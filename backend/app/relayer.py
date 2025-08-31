from web3 import Web3
from eth_account import Account
from core.config import settings
import json

w3 = Web3(Web3.HTTPProvider(settings.RPC_HTTP))
ops_account = Account.from_key(settings.OPS_EOA_PRIVKEY)

# In a real app, load the full ABI from a JSON file.
# This is a minimal ABI for the release function.
ESCROW_ABI = json.loads('''
[
    {
        "type": "function",
        "name": "release",
        "stateMutability": "nonpayable",
        "inputs": [
            {
                "name": "orderId",
                "type": "bytes32"
            },
            {
                "name": "auth",
                "type": "tuple",
                "components": [
                    { "name": "orderId", "type": "bytes32" },
                    { "name": "merchant", "type": "address" },
                    { "name": "amount", "type": "uint256" },
                    { "name": "exp", "type": "uint64" },
                    { "name": "authNonce", "type": "bytes32" }
                ]
            },
            {
                "name": "sig",
                "type": "bytes"
            }
        ],
        "outputs": []
    }
]
''')

contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=ESCROW_ABI
)

def send_release_transaction(order_id_hex: str, auth: dict, signature_bytes: bytes) -> str:
    """
    Builds, signs, and sends the `release` transaction using the operational EOA.
    """
    try:
        # The `auth` tuple for the contract call needs values in the correct types
        auth_tuple = (
            Web3.to_bytes(hexstr=auth["orderId"]),
            Web3.to_checksum_address(auth["merchant"]),
            int(auth["amount"]),
            int(auth["exp"]),
            Web3.to_bytes(hexstr=auth["authNonce"]),
        )
        
        tx = contract.functions.release(
            Web3.to_bytes(hexstr=order_id_hex),
            auth_tuple,
            signature_bytes
        ).build_transaction({
            "from": ops_account.address,
            "nonce": w3.eth.get_transaction_count(ops_account.address),
            "gas": 500_000,  
            "maxFeePerGas": w3.to_wei("0.2", "gwei"), 
            "maxPriorityFeePerGas": w3.to_wei("0.01", "gwei"),
            "chainId": settings.CHAIN_ID,
        })

        signed_tx = ops_account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        return tx_hash.hex()
    
    except Exception as e:
        print(f"Failed to send release transaction: {e}")
        raise
