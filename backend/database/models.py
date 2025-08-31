import uuid
from sqlalchemy import (
    Column, String, DateTime, Integer, LargeBinary, Text, ForeignKey,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(LargeBinary, primary_key=True, index=True) # orderId from contract
    merchant_address = Column(LargeBinary, nullable=False)
    buyer_address = Column(LargeBinary, nullable=False)
    amount = Column(String, nullable=False) # Store as string to avoid precision issues
    timeout = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False, default='CREATED') # CREATED, RELEASED, REFUNDED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Off-chain metadata
    destination_lat = Column(String)
    destination_lon = Column(String)

class OtpSession(Base):
    __tablename__ = "otp_sessions"
    otp_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(LargeBinary, ForeignKey("orders.id"), nullable=False)
    buyer_address = Column(LargeBinary, nullable=False)
    otp_hash = Column(LargeBinary, nullable=True)
    qr_token_hash = Column(LargeBinary, nullable=True)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, nullable=False, default='ACTIVE') # ACTIVE, USED, REVOKED, EXPIRED
    attempts_used = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    gps_buyer_hash = Column(LargeBinary, nullable=True)
    buyer_device_id = Column(Text, nullable=True)

    __table_args__ = (UniqueConstraint('order_id', name='uq_active_order_id', deferrable=True, initially='DEFERRED'),)


class Delivery(Base):
    __tablename__ = "deliveries"
    delivery_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(LargeBinary, ForeignKey("orders.id"), nullable=False)
    otp_id = Column(UUID(as_uuid=True), ForeignKey("otp_sessions.otp_id"), nullable=False)
    courier_id = Column(String, nullable=False)
    gps_courier_hash = Column(LargeBinary, nullable=False)
    photo_uri = Column(String, nullable=True)
    auth_nonce = Column(LargeBinary, unique=True)
    release_tx_hash = Column(LargeBinary, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
