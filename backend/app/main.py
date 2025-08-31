from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import time
import base64
import hmac

import app.crud as crud
import app.schemas as schemas
from database.database import get_db, Base, engine
from core.config import settings
from core.security import (
    generate_otp, generate_qr_token, hash_otp, hash_qr_token,
    sign_release_auth
)
from utils.geo import calculate_distance_m, hash_gps
from app.relayer import send_release_transaction

# Create database tables on startup
#Base.metadata.create_all(bind=engine)

app = FastAPI(title="Escrow DApp Backend")

# Endpoint para que el frontend registre un pedido
@app.post("/orders", response_model=schemas.OrderResponse, status_code=201)
def register_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    (Optional) Endpoint for the frontend to register off-chain metadata for an order
    that was already created on-chain.
    """
    order_id_bytes = bytes.fromhex(order.order_id[2:])
    db_order = crud.get_order(db, order_id=order_id_bytes)
    if db_order:
        raise HTTPException(status_code=400, detail="Order already registered")
    
    created_order = crud.create_order(db, order)
    return {
        "order_id": order.order_id,
        "status": created_order.status
    }

# Informacion que se le pide al cliente para obtener el OTP/QR
@app.post("/otp/request", response_model=schemas.OtpResponse)
def request_otp(req: schemas.OtpRequest, db: Session = Depends(get_db)):
    """
    Buyer-triggered endpoint to generate a short-lived OTP/QR code for delivery confirmation.
    """
    # tomamos el id de la orden y la consultamos
    order_id_bytes = bytes.fromhex(req.order_id[2:])
    order = crud.get_order(db, order_id=order_id_bytes)

    if not order or order.status != 'CREATED':
        raise HTTPException(status_code=404, detail="Order not found or not in CREATED state")
    
    if not order.destination_lat or not order.destination_lon:
        raise HTTPException(status_code=400, detail="Order destination not set")

    # Geofence validation , se pide GPS
    dest_point = (float(order.destination_lat), float(order.destination_lon))
    buyer_point = (req.gps_buyer.lat, req.gps_buyer.lon) # tambien el gps del vendedor
    distance = calculate_distance_m(buyer_point, dest_point) # distancia para saber si el delivery está en el mismo radio que el destinatario
    if distance > settings.GEOFENCE_RADIUS_M: 
        raise HTTPException(status_code=403, detail=f"Buyer is outside the allowed delivery area ({int(distance)}m > {settings.GEOFENCE_RADIUS_M}m)")

    # CREACION DEL OTP
    try:
        # Pasar la orden a estado "Revoke" a todas las sesiones OTP activas
        crud.revoke_existing_otp_sessions(db, order_id=order_id_bytes)
        
        otp, qr_token = None, None
        otp_hash, qr_hash = None, None

        # Generamos el hash para OTP y QR
        if req.mode in ["otp", "both"]:
            otp = generate_otp()
            otp_hash = hash_otp(order_id_bytes, otp, settings.OTP_PEPPER)
        
        if req.mode in ["qr", "both"]:
            qr_token = generate_qr_token()
            qr_hash = hash_qr_token(qr_token, settings.QR_PEPPER)

        # Generamos el hash GPS del comprador
        gps_buyer_hash = hash_gps(req.gps_buyer.lat, req.gps_buyer.lon, req.gps_buyer.timestamp, "buyer_pepper")
        
        # marcamos el order con estado activa y además otorgamaos los hashes de otp, qr y gps! 
        session = crud.create_otp_session(
            db, order.id, order.buyer_address, otp_hash, qr_hash, gps_buyer_hash, req.device_id
        )

        qr_payload = None
        if qr_token:
            payload_str = f'{{"orderId":"{req.order_id}","token":"{qr_token}"}}'
            qr_payload = base64.b64encode(payload_str.encode()).decode()

        return {
            "otp": otp,
            "qr_payload": qr_payload,
            "expires_at": int(session.expires_at.timestamp())
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not create OTP session due to a database conflict. Please try again.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/deliveries/confirm", response_model=schemas.DeliveryConfirmationResponse)
def confirm_delivery(req: schemas.DeliveryConfirmationRequest, db: Session = Depends(get_db)):
    """
    Courier-triggered endpoint to confirm delivery using OTP/QR, which triggers
    the backend to sign and relay the `release` transaction.
    """
    # Se obtiene la sesion de la orden
    order_id_bytes = bytes.fromhex(req.order_id[2:])
    session = crud.get_active_otp_session(db, order_id=order_id_bytes)
    
    # verificamos que exista o que no haya expirado
    #if not session or session.expires_at.timestamp() < time.time():
    #    raise HTTPException(status_code=404, detail="No active OTP/QR session found or session expired")

    # se verifica o bien que otp sea el mismo que indica la sesion, o que el qr token sea el mismo
    is_valid = False
    if req.otp and session.otp_hash:
        expected_hash = hash_otp(order_id_bytes, req.otp, settings.OTP_PEPPER)
        if hmac.compare_digest(expected_hash, session.otp_hash):
            is_valid = True
    elif req.qr_token and session.qr_token_hash:
        expected_hash = hash_qr_token(req.qr_token, settings.QR_PEPPER)
        if hmac.compare_digest(expected_hash, session.qr_token_hash):
            is_valid = True
    
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid OTP or QR token")

    order = crud.get_order(db, order_id=order_id_bytes)
    
    # Se realiza la firma para confirmar la compra
    try:
        # Esta es la firma!
        auth_dict, signature = sign_release_auth(
            order_id_hex=req.order_id,
            merchant_addr='0x' + order.merchant_address.hex(),
            amount_base_units=int(order.amount)
        )

        tx_hash = send_release_transaction(req.order_id, auth_dict, signature)

        # Se hashea la posicion del courier
        gps_courier_hash = hash_gps(req.gps_courier.lat, req.gps_courier.lon, req.gps_courier.timestamp, "courier_pepper")

        # Se crea el registro de entrega
        crud.create_delivery_record(db, {
            "order_id": order_id_bytes,
            "otp_id": session.otp_id,
            "courier_id": req.courier_id,
            "gps_courier_hash": gps_courier_hash,
            "photo_uri": req.photo_uri,
            "auth_nonce": bytes.fromhex(auth_dict["authNonce"][2:]),
            "release_tx_hash": bytes.fromhex(tx_hash[2:])
        })

        # Se pasa el status de la sesion de OTP a "USED"
        crud.use_otp_session(db, session.otp_id)

        return {
            "status": "RELEASE_SUBMITTED",
            "tx_hash": tx_hash,
            "auth_nonce": auth_dict["authNonce"],
            "expires_at": auth_dict["exp"]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process delivery confirmation: {e}")
