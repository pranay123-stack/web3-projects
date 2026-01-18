# Real Estate NFT Marketplace

A decentralized marketplace for tokenizing real estate properties as NFTs. Users can mint, list, buy, sell, and bid on property NFTs.

## Features

- **Property NFT Minting**: Tokenize real estate properties with detailed metadata
- **Marketplace**: List properties for sale with fixed prices
- **Bidding System**: Place and accept bids on listed properties
- **Offer System**: Make offers on any property (even unlisted)
- **Multi-Token Payments**: Support for ETH and ERC20 tokens (USDT, USDC)
- **Web3 Wallet Integration**: Connect with MetaMask, WalletConnect, etc.
- **Property Verification**: Verified minters can mark properties as verified

## Project Structure

```
project1-nft-marketplace/
├── contracts/
│   ├── RealEstateNFT.sol      # ERC721 NFT contract for properties
│   └── RealEstateMarketplace.sol  # Marketplace for trading NFTs
├── frontend/
│   └── src/app/               # Next.js frontend application
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   ├── RealEstateNFT.test.js
│   └── RealEstateMarketplace.test.js
├── hardhat.config.js
└── package.json
```

## Smart Contracts

### RealEstateNFT.sol
- ERC721 NFT with URI storage
- Stores property details on-chain (address, type, sqft, bedrooms, etc.)
- Minting fee mechanism
- Property verification system
- Verified minter roles

### RealEstateMarketplace.sol
- List/unlist properties
- Direct purchase
- Bidding system with escrow
- Offer system for unlisted NFTs
- Platform fee (2.5%)
- Multi-token payment support

## Installation

```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

### Local (Hardhat)
```bash
# Start local node
npm run node

# Deploy contracts
npm run deploy:local
```

### Polygon Amoy Testnet
```bash
# Set environment variables
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Deploy
npm run deploy:amoy
```

## Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_api_key
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| RealEstateNFT | TBD |
| RealEstateMarketplace | TBD |

## Security Features

- ReentrancyGuard on all state-changing functions
- Custom errors for gas optimization
- Access control with Ownable
- Input validation
- Safe ERC20 transfers

## License

MIT
