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

# Web3 instance para interactuar con el contrato
w3 = Web3(Web3.HTTPProvider(settings.RPC_HTTP))

# ABI mínimo para la función domainSeparator
CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "domainSeparator",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def get_domain_separator():
    """Obtiene el domain separator directamente del contrato desplegado."""
    try:
        print(f"Connecting to RPC: {settings.RPC_HTTP}")
        print(f"Contract address: {settings.CONTRACT_ADDRESS}")
        
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=CONTRACT_ABI
        )
        domain_sep = contract.functions.domainSeparator().call()
        print(f"Retrieved domain separator from contract: {domain_sep.hex()}")
        return domain_sep
    except Exception as e:
        print(f"ERROR getting domain separator from contract: {e}")
        print("Falling back to hardcoded domain separator")
        # Fallback al valor hardcodeado si falla la conexión
        return Web3.to_bytes(hexstr="0xd8774c26f4ca3cfa065de9b839031709301b943e2d4242d72cba4459eb37fc27")

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
    auth_nonce = secrets.token_bytes(32)  # Fixed: Changed from 34 to 32 bytes to match bytes32
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

    # Obtener el domain separator del contrato
    domain_separator = get_domain_separator()
    
    # digest = keccak("\x19\x01" || domainSeparator || structHash)
    digest = keccak(b"\x19\x01" + domain_separator + struct_hash)

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
    print("=== EIP-712 DEBUG ===")
    print("RELEASE_AUTH_TYPEHASH:", RELEASE_AUTH_TYPEHASH.hex())
    print("Domain Separator:", domain_separator.hex())
    print("OrderId:", Web3.to_bytes(hexstr=order_id_hex).hex())
    print("Merchant:", Web3.to_checksum_address(merchant_addr))
    print("Amount:", int(amount_base_units))
    print("Exp:", int(exp))
    print("AuthNonce:", auth_nonce.hex())
    print("StructHash:", struct_hash.hex())
    print("Digest:", digest.hex())
    print("Signature:", signature.hex())
    print("=== END DEBUG ===")
    
    # También recuperar la dirección del firmante para verificar usando ECDSA
    from eth_utils import to_checksum_address
    signer_address = to_checksum_address(Account._recover_hash(digest, signature=signature))
    print("Recovered Signer Address:", signer_address)

    return auth_dict, signature

def generate_otp(length: int = 6) -> str:
    """Generates a random numerical OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])

def generate_qr_token() -> str:
    """Generates a secure random token for QR codes."""
    return secrets.token_urlsafe(32)
