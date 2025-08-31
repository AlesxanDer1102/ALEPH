# Web3 Escrow DApp - Backend

This backend service provides the off-chain logic for a decentralized escrow application. It manages order metadata, generates secure one-time passwords (OTPs) for delivery confirmation, validates delivery conditions (like geolocation), and relays transactions to the blockchain.

## Project Structure

-   `/app`: Contains the main FastAPI application, including API endpoints, database operations (CRUD), and Pydantic schemas.
-   `/core`: Core logic, including configuration management and cryptographic utilities (hashing, EIP-712 signing).
-   `/database`: SQLAlchemy models and database session management.
-   `/utils`: Helper utilities, such as geolocation calculations.
-   `.env`: Local environment variable configuration.
-   `requirements.txt`: Python package dependencies.

## Setup and Installation

### 1. Prerequisites

-   Python 3.8+
-   PostgreSQL database running (e.g., via Docker)

### 2. Clone the Repository

```bash
# This script already creates the project directory. If cloning from git:
# git clone <your-repo-url>
# cd <your-repo-directory>
```

### 3. Install Dependencies

It's recommended to use a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root by copying the provided `.env` file and filling in your values.

```bash
# The script generates a .env file you can edit.
```

Now, edit the `.env` file with your specific configuration:
-   `RPC_WSS` and `RPC_HTTP`: Your Arbitrum node URLs.
-   `CONTRACT_ADDRESS`: The address of your deployed Escrow smart contract.
-   `OPS_EOA_PRIVKEY`: The private key of the account that will fund the `release` transactions. **WARNING: For development only. Use a secrets manager in production.**
-   `DATABASE_URL`: Your PostgreSQL connection string.

### 5. Database

Make sure you have a PostgreSQL database created that matches the name in your `DATABASE_URL`. The application will create the necessary tables automatically on startup.

### 6. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. You can access the interactive API documentation at `http://127.0.0.1:8000/docs`.
