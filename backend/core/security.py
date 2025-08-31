import os
import hmac
import hashlib
import time
import secrets
from eth_account import Account
from eth_account.messages import encode_structured_data
from web3 import Web3

from core.config import settings

# EIP712 Domain and Types definition
DOMAIN = {
    "name": settings.EIP712_DOMAIN_NAME,
    "version": settings.EIP712_DOMAIN_VERSION,
    "chainId": settings.CHAIN_ID,
    "verifyingContract": Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
}

TYPES = {
    "ReleaseAuth": [
        {"name": "orderId", "type": "bytes32"},
        {"name": "merchant", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "exp", "type": "uint64"},
        {"name": "authNonce", "type": "bytes32"},
    ]
}

def hash_otp(order_id: bytes, otp: str, pepper: str) -> bytes:
    """Hashes an OTP using HMAC-SHA256 for secure storage."""
    return hmac.new(
        key=pepper.encode(),
        msg=order_id + otp.encode(),
        digestmod=hashlib.sha256
    ).digest()

def hash_qr_token(token: str, pepper: str) -> bytes:
    """Hashes a QR token using HMAC-SHA256."""
    return hmac.new(
        key=pepper.encode(),
        msg=token.encode(),
        digestmod=hashlib.sha256
    ).digest()


def sign_release_auth(
    order_id_hex: str,
    merchant_addr: str,
    amount_base_units: int,
) -> tuple[dict, bytes]:
    """
    Constructs and signs an EIP-712 ReleaseAuth message.
    Returns the auth message and the signature.
    """
    auth_nonce_bytes = secrets.token_bytes(32)
    expiration = int(time.time()) + settings.AUTH_TTL_SECONDS

    message = {
        "orderId": Web3.to_bytes(hexstr=order_id_hex),
        "merchant": Web3.to_checksum_address(merchant_addr),
        "amount": int(amount_base_units),
        "exp": expiration,
        "authNonce": auth_nonce_bytes,
    }

    structured_data = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            **TYPES,
        },
        "domain": DOMAIN,
        "primaryType": "ReleaseAuth",
        "message": message,
    }

    try:
        signable_message = encode_structured_data(structured_data)
        private_key = settings.AUTH_SIGNER_PRIVKEY
        signed_message = Account.sign_message(signable_message, private_key=private_key)
        
        # Convert bytes to hex for auth dict
        auth_dict = message.copy()
        auth_dict["orderId"] = "0x" + message["orderId"].hex()
        auth_dict["authNonce"] = "0x" + message["authNonce"].hex()

        return auth_dict, signed_message.signature

    except Exception as e:
        print(f"Error signing message: {e}")
        raise

def generate_otp(length: int = 6) -> str:
    """Generates a random numerical OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])

def generate_qr_token() -> str:
    """Generates a secure random token for QR codes."""
    return secrets.token_urlsafe(32)
