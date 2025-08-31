import os
from dotenv import load_dotenv
from pydantic import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # Blockchain settings
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", 42161))
    RPC_WSS: str = os.getenv("RPC_WSS", "wss://arb1.arbitrum.io/ws")
    RPC_HTTP: str = os.getenv("RPC_HTTP", "https://arb1.arbitrum.io/rpc")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS")
    USDC_ADDRESS: str = os.getenv("USDC_ADDRESS")

    # Private key for the operational EOA (signs and sends transactions)
    # In production, use a secure secret management service (e.g., AWS KMS, HashiCorp Vault)
    OPS_EOA_PRIVKEY: str = os.getenv("OPS_EOA_PRIVKEY")
    AUTH_SIGNER_PRIVKEY: str = os.getenv("AUTH_SIGNER_PRIVKEY", os.getenv("OPS_EOA_PRIVKEY"))

    # Security settings
    QR_PEPPER: str = os.getenv("QR_PEPPER", "default-qr-pepper")
    OTP_PEPPER: str = os.getenv("OTP_PEPPER", "default-otp-pepper")

    # Business logic settings
    GEOFENCE_RADIUS_M: int = int(os.getenv("GEOFENCE_RADIUS_M", 200))
    OTP_TTL_SECONDS: int = int(os.getenv("OTP_TTL_SECONDS", 180))  # 3 minutes
    AUTH_TTL_SECONDS: int = int(os.getenv("AUTH_TTL_SECONDS", 120)) # 2 minutes
    MAX_OTP_ATTEMPTS: int = int(os.getenv("MAX_OTP_ATTEMPTS", 5))
    RATE_LIMIT_OTP_PER_HOUR: int = int(os.getenv("RATE_LIMIT_OTP_PER_HOUR", 10))
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/escrow_db")

    # EIP712 Domain
    EIP712_DOMAIN_NAME: str = "EscrowOrder"
    EIP712_DOMAIN_VERSION: str = "1"


settings = Settings()
