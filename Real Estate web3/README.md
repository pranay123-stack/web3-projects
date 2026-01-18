# Real Estate Web3 Projects

This directory contains two comprehensive real estate blockchain projects demonstrating different approaches to property tokenization.

## Projects Overview

### 1. [Real Estate NFT Marketplace](./project1-nft-marketplace/)

A decentralized marketplace for tokenizing real estate properties as NFTs (ERC-721).

**Key Features:**
- Property NFT minting with detailed metadata
- Marketplace for listing, buying, and selling
- Bidding system with escrow
- Offer system for unlisted properties
- Multi-token payments (ETH, USDT, USDC)
- Web3 wallet integration

**Tech Stack:**
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts v5
- Next.js + RainbowKit (Frontend)

**Smart Contracts:**
- `RealEstateNFT.sol` - ERC-721 NFT for properties
- `RealEstateMarketplace.sol` - Trading marketplace

---

### 2. [RWA Tokenization Platform](./project2-rwa-tokenization/)

An ERC-3643 inspired security token platform for fractional real estate ownership with regulatory compliance.

**Key Features:**
- Fractional ownership via ERC-20 tokens
- KYC/AML identity registry
- Compliance module for transfer restrictions
- Automated dividend distribution
- Country-based restrictions
- Holding period enforcement
- Property token factory for multi-property deployment

**Tech Stack:**
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts v5
- ERC-3643 (T-REX) inspired architecture
- Next.js + RainbowKit (Frontend)

**Smart Contracts:**
- `IdentityRegistry.sol` - KYC/AML identity management
- `ComplianceModule.sol` - Transfer compliance checks
- `RealEstateToken.sol` - Security token with dividends
- `PropertyTokenFactory.sol` - Deploy new tokenized properties

---

## Quick Start

### Project 1 - NFT Marketplace
```bash
cd project1-nft-marketplace
npm install
npm test
npm run deploy:amoy  # Deploy to Polygon Amoy testnet
```

### Project 2 - RWA Tokenization
```bash
cd project2-rwa-tokenization
npm install
npm test
npm run deploy:amoy  # Deploy to Polygon Amoy testnet
```

---

## Test Results

| Project | Tests | Status |
|---------|-------|--------|
| NFT Marketplace | 37 | ✅ All Passing |
| RWA Tokenization | 24 | ✅ All Passing |

---

## Network Support

Both projects support:
- Hardhat local network
- Polygon Amoy testnet
- Ethereum Sepolia testnet

---

## Comparison

| Feature | NFT Marketplace | RWA Tokenization |
|---------|-----------------|------------------|
| Token Standard | ERC-721 (NFT) | ERC-20 (Fungible) |
| Ownership | Whole property | Fractional shares |
| Compliance | Basic | ERC-3643 inspired |
| KYC Required | No | Yes |
| Dividends | No | Yes (automatic) |
| Transfer Restrictions | No | Yes (configurable) |
| Use Case | Property trading | Investment platform |

---

## License

MIT
