from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import database.models as models
import app.schemas as schemas
from core.config import settings
import uuid

# --- Order ---
def get_order(db: Session, order_id: bytes):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def create_order(db: Session, order: schemas.OrderCreate):
    db_order = models.Order(
        id=bytes.fromhex(order.order_id[2:]),
        merchant_address=bytes.fromhex(order.merchant_address[2:]),
        buyer_address=bytes.fromhex(order.buyer_address[2:]),
        amount=order.amount,
        timeout=datetime.fromtimestamp(order.timeout),
        destination_lat=str(order.destination_lat),
        destination_lon=str(order.destination_lon)
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

# --- OTP Session ---
def get_active_otp_session(db: Session, order_id: bytes):
    return db.query(models.OtpSession).filter(
        models.OtpSession.order_id == order_id,
        models.OtpSession.status == 'ACTIVE'
    ).first()

# Cambia el estado de la orden a Revocado!
def revoke_existing_otp_sessions(db: Session, order_id: bytes):
    db.query(models.OtpSession)\
      .filter(models.OtpSession.order_id == order_id, models.OtpSession.status == 'ACTIVE')\
      .update({"status": "REVOKED"})
    # Commit is handled in the calling function to ensure atomicity
    # db.commit()

def create_otp_session(db: Session, order_id: bytes, buyer_address: bytes, otp_hash: bytes, qr_hash: bytes, gps_hash: bytes, device_id: str, auto_commit: bool = False):
    expires_at = datetime.utcnow() + timedelta(seconds=settings.OTP_TTL_SECONDS)
    db_session = models.OtpSession(
        order_id=order_id,
        buyer_address=buyer_address,
        otp_hash=otp_hash,
        qr_token_hash=qr_hash,
        expires_at=expires_at,
        gps_buyer_hash=gps_hash,
        buyer_device_id=device_id,
        max_attempts=settings.MAX_OTP_ATTEMPTS
    )
    db.add(db_session)
    if auto_commit:
        db.commit()
        db.refresh(db_session)
    return db_session

def use_otp_session(db: Session, otp_session_id: uuid.UUID):
    db.query(models.OtpSession).filter(models.OtpSession.otp_id == otp_session_id).update({"status": "USED"})
    db.commit()

# --- Delivery ---
def create_delivery_record(db: Session, delivery_data: dict, auto_commit: bool = True):
    db_delivery = models.Delivery(**delivery_data)
    db.add(db_delivery)
    if auto_commit:
        db.commit()
        db.refresh(db_delivery)
    return db_delivery
