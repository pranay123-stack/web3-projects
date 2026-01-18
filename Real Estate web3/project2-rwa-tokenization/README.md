# Real Estate RWA Tokenization Platform

A blockchain-based platform for fractionalizing commercial real estate properties using ERC-3643 inspired security token standards. This platform enables compliant fractional ownership with automated dividend distribution.

## Features

- **Fractional Ownership**: Tokenize real estate properties into divisible shares
- **ERC-3643 Compliance**: Identity registry and compliance modules for regulatory requirements
- **KYC/AML Integration**: On-chain identity verification for investors
- **Automated Dividends**: Smart contract-based rental income distribution
- **Country Restrictions**: Configurable jurisdiction-based transfer controls
- **Holding Limits**: Minimum and maximum investment amounts per investor
- **Holding Periods**: Configurable lock-up periods for investors

## Project Structure

```
project2-rwa-tokenization/
├── contracts/
│   ├── interfaces/
│   │   ├── IIdentityRegistry.sol
│   │   └── IComplianceModule.sol
│   ├── IdentityRegistry.sol      # KYC/AML identity management
│   ├── ComplianceModule.sol      # Transfer compliance checks
│   ├── RealEstateToken.sol       # ERC-20 security token with dividends
│   └── PropertyTokenFactory.sol  # Factory for deploying new properties
├── frontend/
│   └── src/app/                  # Next.js frontend application
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── RWATokenization.test.js   # Comprehensive tests
├── hardhat.config.js
└── package.json
```

## Smart Contracts

### IdentityRegistry.sol
- Manages investor identities (KYC verification)
- Stores country codes for jurisdiction checks
- Role-based access control (REGISTRAR, AGENT)
- Batch registration support

### ComplianceModule.sol
- Pre-transfer compliance validation
- Country restriction enforcement
- Maximum investor limits
- Minimum/maximum holding amounts
- Holding period enforcement

### RealEstateToken.sol
- ERC-20 token representing fractional ownership
- Property metadata storage
- Dividend distribution mechanism
- Account freezing for recovery
- Pausable transfers

### PropertyTokenFactory.sol
- Deploy new tokenized properties
- Shared identity registry
- Configurable compliance parameters
- Batch investor registration

## Compliance Features

| Feature | Description |
|---------|-------------|
| KYC Verification | Only verified investors can hold tokens |
| Country Restrictions | Block transfers to/from specific jurisdictions |
| Investor Limits | Maximum number of investors per property |
| Holding Limits | Min/max token amounts per investor |
| Holding Period | Lock-up period before transfers allowed |
| Account Freeze | Freeze accounts for recovery or compliance |

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
# Edit .env with your private key

# Deploy
npm run deploy:amoy
```

## Environment Variables

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

Open [http://localhost:3001](http://localhost:3001)

## Dividend Distribution Flow

1. Property generates rental income
2. Admin deposits ETH to token contract via `depositDividends()`
3. Dividends distributed proportionally based on token holdings
4. Investors claim via `claimDividends()`
5. Dividends are preserved during transfers

## Security Considerations

- ReentrancyGuard on all state-changing functions
- AccessControl for privileged operations
- Custom errors for gas optimization
- Pausable for emergency stops
- Comprehensive input validation

## Regulatory Notes

This is a demonstration platform. For production use:
- Consult legal counsel for jurisdiction-specific requirements
- Implement proper KYC/AML provider integration
- Consider accredited investor verification
- Review securities regulations (SEC, FCA, etc.)

## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| PropertyTokenFactory | TBD |
| IdentityRegistry | TBD |
| Sample RealEstateToken | TBD |
| Sample ComplianceModule | TBD |

## License

MIT
