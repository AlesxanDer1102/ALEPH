import os
import hmac
import hashlib
import time
import secrets
from eth_account import Account
from web3 import Web3
from eth_utils import keccak
from eth_abi import encode

from core.config import settings

# Domain separator obtenido del contrato desplegado
DOMAIN_SEPARATOR = Web3.to_bytes(
    hexstr="0xd8774c26f4ca3cfa065de9b839031709301b943e2d4242d72cba4459eb37fc27"
)

# RELEASE_AUTH_TYPEHASH (constante en tu contrato)
RELEASE_AUTH_TYPEHASH = keccak(
    text="ReleaseAuth(bytes32 orderId,address merchant,uint256 amount,uint64 exp,bytes32 authNonce)"
)

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

def sign_release_auth(order_id_hex: str, merchant_addr: str, amount_base_units: int):
    """Genera auth struct y firma EIP-712 manual (igual que Solidity)."""
    auth_nonce = secrets.token_bytes(32)
    exp = int(time.time()) + settings.AUTH_TTL_SECONDS

    # structHash
    struct_hash = keccak(
        encode(
            ["bytes32", "bytes32", "address", "uint256", "uint64", "bytes32"],
            [
                RELEASE_AUTH_TYPEHASH,
                Web3.to_bytes(hexstr=order_id_hex),
                Web3.to_checksum_address(merchant_addr),
                int(amount_base_units),
                int(exp),
                auth_nonce,
            ]
        )
    )

    # digest = keccak("\x19\x01" || domainSeparator || structHash)
    digest = keccak(b"\x19\x01" + DOMAIN_SEPARATOR + struct_hash)

    # firmar usando _sign_hash (web3.py v6)
    signed = Account._sign_hash(digest, settings.AUTH_SIGNER_PRIVKEY)

    # abi.encodePacked(r, s, v)
    signature = (
        signed.r.to_bytes(32, "big") +
        signed.s.to_bytes(32, "big") +
        signed.v.to_bytes(1, "big")
    )

    auth_dict = {
        "orderId": order_id_hex,
        "merchant": Web3.to_checksum_address(merchant_addr),
        "amount": int(amount_base_units),
        "exp": exp,
        "authNonce": "0x" + auth_nonce.hex(),
    }

    # Debug logs para comparar con Foundry
    print("StructHash:", struct_hash.hex())
    print("Digest:", digest.hex())
    print("Signature:", signature.hex())

    return auth_dict, signature

def generate_otp(length: int = 6) -> str:
    """Generates a random numerical OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])

def generate_qr_token() -> str:
    """Generates a secure random token for QR codes."""
    return secrets.token_urlsafe(32)
