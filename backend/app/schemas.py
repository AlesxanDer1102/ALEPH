from pydantic import BaseModel, Field
from typing import Optional
import uuid

class GPSLocation(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(None, gt=0)
    timestamp: int

# --- OTP Request ---
class OtpRequest(BaseModel):
    order_id: str # hex string
    gps_buyer: GPSLocation
    device_id: Optional[str]
    mode: str = "otp" # "otp", "qr", or "both"

class OtpResponse(BaseModel):
    otp: Optional[str]
    qr_payload: Optional[str]
    expires_at: int # timestamp

# --- Delivery Confirmation ---
class DeliveryConfirmationRequest(BaseModel):
    order_id: str # hex string
    otp: Optional[str]
    qr_token: Optional[str]
    gps_courier: GPSLocation
    courier_id: str
    photo_uri: Optional[str]

class DeliveryConfirmationResponse(BaseModel):
    status: str
    tx_hash: str
    auth_nonce: str
    expires_at: int

# --- Order ---
class OrderCreate(BaseModel):
    order_id: str # hex string
    merchant_address: str
    buyer_address: str
    amount: str
    timeout: int # timestamp
    destination_lat: Optional[float]
    destination_lon: Optional[float]

class OrderResponse(BaseModel):
    order_id: str
    status: str

    class Config:
        orm_mode = True
