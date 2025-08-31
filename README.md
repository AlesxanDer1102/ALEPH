# 🚀 VeriPay - Zero Trust Delivery Protocol

> **VeriPay elimina la confianza en comercio P2P usando escrow blockchain + verificación multi-factor (GPS + OTP/QR + fotos) que libera fondos automáticamente solo con pruebas criptográficas de entrega real, haciendo imposible el fraude y disputas.**

🌐 **Live Demo**: [https://veripay-five.vercel.app/](https://veripay-five.vercel.app/)

## 📋 Overview

VeriPay is a decentralized escrow protocol that revolutionizes peer-to-peer commerce by eliminating trust requirements between strangers. Using blockchain smart contracts, multi-factor cryptographic verification, and GPS geofencing, VeriPay automatically releases funds only when delivery is cryptographically proven.

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│   Frontend      │    │    Backend       │    │  Smart Contracts  │
│   (Next.js)     │◄──►│   (FastAPI)      │◄──►│   (Solidity)      │
│                 │    │                  │    │                   │
│ • User Interface│    │ • OTP/QR Gen     │    │ • Escrow Logic    │
│ • Web3 Connect  │    │ • GPS Validation │    │ • EIP-712 Auth    │
│ • Order Forms   │    │ • Signature Gen  │    │ • Fund Release    │
└─────────────────┘    └──────────────────┘    └───────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Account Kit
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Web3.py
- **Blockchain**: Solidity + OpenZeppelin + EIP-712
- **Network**: Ethereum Sepolia Testnet

## 💡 How It Works

### 1. Order Creation
```solidity
// Buyer deposits USDC into escrow contract
createOrder(OrderParams memory params) → escrow locks funds
```

### 2. Delivery Preparation
```python
# Buyer generates secure OTP/QR codes with GPS verification
POST /otp/request → {otp: "123456", qr_payload: "...", expires_at: ...}
```

### 3. Delivery Confirmation
```python
# Courier confirms delivery using OTP + GPS proof
POST /deliveries/confirm → backend signs EIP-712 authorization
```

### 4. Automatic Release
```solidity
// Smart contract validates signature and releases funds
release(orderId, ReleaseAuth, signature) → merchant receives payment
```

## 🔐 Security Features

### Multi-Factor Verification
- **🔢 OTP**: Time-limited 6-digit codes with HMAC protection
- **📱 QR Codes**: Cryptographic tokens with anti-replay protection
- **📍 GPS Geofencing**: Location verification with configurable radius
- **📸 Photo Timestamps**: Immutable delivery proof

### EIP-712 Signature Verification
```solidity
struct ReleaseAuth {
    bytes32 orderId;
    address merchant; 
    uint256 amount;
    uint64 exp;
    bytes32 authNonce;
}
```

### Anti-Fraud Mechanisms
- Geofence validation ensures courier is at delivery location
- Nonce protection prevents signature replay attacks
- Time-bound authorizations with automatic expiration
- Role-based access control for oracle signers

## 🚀 Deployed Contracts (Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| **EscrowPay** | `0xBfb13d12798bD5Be9169Db0a986BbDCaed2700B5` | Main escrow logic with EIP-712 verification |
| **USDC Mock** | `0x613cd54CF57424Db3e4D66B108d847D26E6630C0` | Test token for transactions |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Ethereum wallet (MetaMask)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure database and blockchain settings
uvicorn app.main:app --reload
```

### Environment Variables

#### Frontend (.env)
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
ESCROW_CONTRACT_ADDRESS=0xBfb13d12798bD5Be9169Db0a986BbDCaed2700B5
USDC_MOCK_SEPOLIA=0x613cd54CF57424Db3e4D66B108d847D26E6630C0
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/veripay_db
RPC_HTTP=https://eth-sepolia.g.alchemy.com/v2/your_key
CONTRACT_ADDRESS=0xBfb13d12798bD5Be9169Db0a986BbDCaed2700B5
AUTH_SIGNER_PRIVKEY=your_oracle_private_key
GEOFENCE_RADIUS_M=200
OTP_TTL_SECONDS=180
```

## 🔄 Complete Flow Example

### 1. Buyer Creates Order
```typescript
// Frontend: Create order on-chain
const tx = await contract.createOrder({
  buyer: "0x...",
  merchant: "0x...", 
  amount: 1000000, // $1 USDC (6 decimals)
  timeout: Math.floor(Date.now()/1000) + 3600, // 1 hour
  orderId: "0x..."
})
```

### 2. Buyer Requests OTP
```bash
curl -X POST https://api.veripay.com/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "0x...",
    "gps_buyer": {"lat": 40.7589, "lon": -73.9851, "timestamp": 1672531200},
    "mode": "otp"
  }'

Response: {"otp": "123456", "expires_at": 1672531380}
```

### 3. Courier Confirms Delivery
```bash
curl -X POST https://api.veripay.com/deliveries/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "0x...",
    "otp": "123456",
    "courier_id": "courier_001",
    "gps_courier": {"lat": 40.7589, "lon": -73.9851, "timestamp": 1672531300}
  }'

Response: {"status": "RELEASE_SUBMITTED", "tx_hash": "0x..."}
```

### 4. Automatic Fund Release
- Backend validates OTP + GPS proximity
- Generates EIP-712 signature with oracle key
- Submits `release()` transaction to contract
- Smart contract verifies signature and transfers USDC to merchant

## 🌟 Key Innovations

### **Cryptographic Proof of Delivery**
Unlike traditional escrow services, VeriPay provides mathematical certainty of delivery through:
- **EIP-712 signatures** ensuring tamper-proof authorizations
- **GPS geofencing** with cryptographic location hashing  
- **Time-bound proofs** preventing delayed fraud attempts
- **Multi-factor authentication** combining OTP + location + photos

### **Instant Settlement**
No 7-14 day holding periods or manual dispute resolution. Funds release automatically upon cryptographic proof verification.

### **Gasless UX for End Users**
Backend relayer handles transaction fees while maintaining decentralization guarantees.

## 🎯 Target Markets

1. **High-Value P2P Sales** (Electronics, Luxury Items)
2. **Cross-Border Commerce** (No traditional banking required)
3. **Gig Economy Delivery** (Couriers, Food Delivery)
4. **NFT/Digital Asset Trading** (With physical component)

## 🔮 Future Roadmap

- **Multi-chain deployment** (Polygon, Arbitrum, Base)
- **Mobile apps** with native biometric verification
- **Reputation NFTs** for verified delivery providers
- **Insurance integration** for high-value transactions
- **DAO governance** for protocol parameters

## 📊 Business Model

- **Transaction fees**: 0.5-2% per successful delivery
- **Premium features**: Express verification, insurance, analytics
- **B2B licensing**: White-label for existing marketplaces
- **Staking rewards**: For oracle operators and liquidity providers

📈 **Detailed Business Model Canvas**: [View on Canva](https://www.canva.com/design/DAGxj3exIaU/Z10Lbk3PXg90TV2CXLOpmQ/edit?utm_content=DAGxj3exIaU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

---

**VeriPay transforms every delivery into a cryptographically verifiable event, creating the infrastructure for trust-free global commerce.**