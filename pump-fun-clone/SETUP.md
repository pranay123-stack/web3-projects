# Setup Guide

This guide provides detailed instructions for setting up the Pump.Fun Clone development environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Solana Program Deployment](#solana-program-deployment)
- [Running Locally](#running-locally)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Node.js (v18.0.0 or higher)

**Ubuntu/Debian:**
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should output v18.x.x or higher
npm --version   # Should output 9.x.x or higher
```

**macOS:**
```bash
# Using Homebrew
brew install node@18

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

### MongoDB (v6.0 or higher)

**Ubuntu/Debian:**
```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval 'db.runCommand({ ping: 1 })'
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Using Docker (Recommended for development):**
```bash
docker run -d \
  --name pump-fun-mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6
```

### Solana CLI Tools

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version

# Configure for devnet (recommended for development)
solana config set --url https://api.devnet.solana.com

# Generate a new keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL for testing
solana airdrop 2
```

### Anchor Framework (v0.29.0)

**Install Rust first:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup default stable
rustup update
```

**Install Anchor:**
```bash
# Using cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Verify installation
anchor --version  # Should output anchor-cli 0.29.0
```

### Additional Tools

```bash
# Git
sudo apt-get install git  # Ubuntu/Debian
brew install git          # macOS

# Yarn (optional, npm works fine)
npm install -g yarn
```

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 10 GB | 20+ GB SSD |
| Network | Broadband | Stable broadband |

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/pump_fun_clone.git
cd pump_fun_clone
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

Expected output:
```
added 150 packages, and audited 151 packages in 10s
found 0 vulnerabilities
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

Expected output:
```
added 350 packages, and audited 351 packages in 30s
found 0 vulnerabilities
```

### Step 4: Build Smart Contracts (Optional)

If you want to modify or deploy the contracts:

```bash
cd ../contracts
anchor build
```

Expected output:
```
BPF SDK: ~/.local/share/solana/install/releases/1.17.0/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
...
To deploy this program:
  $ solana program deploy /path/to/pump_fun_clone/contracts/target/deploy/pump_fun.so
```

## Environment Configuration

### Backend Configuration

1. **Copy the example environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` with your settings:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Configure each variable:**

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001

   # MongoDB Configuration
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/pump_fun_clone
   # Or with authentication
   # MONGODB_URI=mongodb://username:password@localhost:27017/pump_fun_clone

   # JWT Configuration
   # Generate a strong secret: openssl rand -base64 64
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Solana Configuration
   # Devnet (for development)
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_NETWORK=devnet
   # Mainnet (for production)
   # SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   # SOLANA_NETWORK=mainnet-beta

   # Program IDs
   TOKEN_PROGRAM_ID=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
   # Replace with your deployed bonding curve program ID
   BONDING_CURVE_PROGRAM_ID=your-deployed-program-id

   # Platform Configuration
   PLATFORM_FEE_PERCENTAGE=1
   # Your platform wallet address for receiving fees
   PLATFORM_WALLET_ADDRESS=your-platform-wallet-address

   # File Upload Configuration
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   UPLOAD_DIR=uploads

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000

   # Socket.IO Configuration
   SOCKET_PING_TIMEOUT=60000
   SOCKET_PING_INTERVAL=25000
   ```

### Frontend Configuration

1. **Create environment file:**
   ```bash
   cd frontend
   touch .env.local
   ```

2. **Add frontend environment variables:**
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001

   # Solana Configuration
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

   # Optional: Custom RPC (recommended for production)
   # NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-provider.com
   ```

### Generating Secure Keys

```bash
# Generate JWT secret
openssl rand -base64 64

# Example output (use this in JWT_SECRET):
# kJ8mN2xP4qR6sT8vW0yA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1d
```

## Database Setup

### MongoDB Indexes

The application automatically creates indexes, but for optimal performance, you can create them manually:

```bash
# Connect to MongoDB
mongosh pump_fun_clone

# Create indexes for Users collection
db.users.createIndex({ walletAddress: 1 }, { unique: true })
db.users.createIndex({ username: 1 })
db.users.createIndex({ tokensCreated: -1 })
db.users.createIndex({ totalVolume: -1 })
db.users.createIndex({ createdAt: -1 })
db.users.createIndex({ "holdings.mintAddress": 1 })

# Create indexes for Tokens collection
db.tokens.createIndex({ mintAddress: 1 }, { unique: true })
db.tokens.createIndex({ creator: 1 })
db.tokens.createIndex({ marketCap: -1 })
db.tokens.createIndex({ volume24h: -1 })
db.tokens.createIndex({ createdAt: -1 })

# Create indexes for Trades collection
db.trades.createIndex({ tokenMint: 1, timestamp: -1 })
db.trades.createIndex({ userAddress: 1, timestamp: -1 })
db.trades.createIndex({ timestamp: -1 })
```

### Seed Data (Optional)

Create a seed script for testing:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Add your seed data here

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch(console.error);
"
```

## Solana Program Deployment

### Step 1: Configure Solana CLI

```bash
# Set network to devnet
solana config set --url devnet

# Verify configuration
solana config get

# Expected output:
# Config File: ~/.config/solana/cli/config.yml
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/
# Keypair Path: ~/.config/solana/id.json
```

### Step 2: Fund Your Wallet

```bash
# Get devnet SOL (run multiple times if needed)
solana airdrop 2
solana airdrop 2
solana airdrop 2

# Check balance
solana balance
# Expected: 6 SOL or more
```

### Step 3: Build the Program

```bash
cd contracts
anchor build
```

### Step 4: Get Program ID

```bash
# The program ID is shown after build
solana address -k target/deploy/pump_fun-keypair.json

# Update Anchor.toml with this ID
# Update the program ID in [programs.devnet] section
```

### Step 5: Deploy

```bash
anchor deploy

# Or deploy to specific network
anchor deploy --provider.cluster devnet
```

### Step 6: Update Environment

After deployment, update your backend `.env`:
```env
BONDING_CURVE_PROGRAM_ID=<your-deployed-program-id>
```

## Running Locally

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

Expected output:
```
[nodemon] starting `node src/index.js`
MongoDB connected to: localhost
Solana connected to: devnet (https://api.devnet.solana.com)
Server running on port 3001
Socket.IO listening on port 3001
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
   - Local:        http://localhost:3000
   - Environments: .env.local

   Ready in 2.3s
```

### Production Mode

**Backend:**
```bash
cd backend
npm run start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run start
```

### Verify Everything is Working

1. **Check Backend Health:**
   ```bash
   curl http://localhost:3001/health
   # Expected: {"status":"ok","mongodb":"connected","solana":"connected"}
   ```

2. **Check Frontend:**
   - Open `http://localhost:3000` in your browser
   - You should see the homepage

3. **Check Database Connection:**
   ```bash
   mongosh pump_fun_clone --eval 'db.stats()'
   ```

4. **Check Solana Connection:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
     https://api.devnet.solana.com
   # Expected: {"jsonrpc":"2.0","result":"ok","id":1}
   ```

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

**Error:** `MongoServerSelectionError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# If using Docker
docker start pump-fun-mongodb
```

#### Solana RPC Rate Limited

**Error:** `429 Too Many Requests`

**Solution:**
- Use a private RPC provider like QuickNode, Alchemy, or Helius
- Add rate limiting to your requests
- Implement request caching

#### Anchor Build Fails

**Error:** `error: could not compile`

**Solution:**
```bash
# Update Rust
rustup update

# Clean and rebuild
anchor clean
anchor build
```

#### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using the port
lsof -i :3001  # or :3000 for frontend

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3002
```

#### Wallet Connection Issues

**Error:** Wallet not connecting in browser

**Solution:**
1. Ensure you have a Solana wallet extension installed (Phantom recommended)
2. Check that the wallet is set to the correct network (devnet/mainnet)
3. Clear browser cache and try again
4. Check browser console for specific errors

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/yourusername/pump_fun_clone/issues)
2. Search existing discussions
3. Open a new issue with:
   - Your environment (OS, Node version, etc.)
   - Complete error message
   - Steps to reproduce

---

Next Steps:
- Read the [API Documentation](./API.md)
- Explore the [README](./README.md) for architecture overview
- Join our community discussions
