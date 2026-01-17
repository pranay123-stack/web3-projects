# Solana Token Risk Analyzer API

A real-time risk scoring API for Solana tokens that analyzes rug-pull indicators, holder concentration, liquidity depth, and deployer wallet history.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)

## Features

- **Comprehensive Risk Analysis**: Multi-factor risk scoring across 5 key dimensions
- **Real-time Data**: Direct integration with Solana RPC for live on-chain data
- **Holder Concentration Analysis**: Identifies whale wallets and distribution risks
- **Deployer History Tracking**: Analyzes deployer wallet age and transaction patterns
- **Contract Security Checks**: Validates mint/freeze authority revocation
- **RESTful API**: Clean, documented endpoints with rate limiting
- **Caching Layer**: In-memory caching for improved performance
- **Production Ready**: Health checks, error handling, and logging

## Risk Factors Analyzed

| Factor | Weight | Description |
|--------|--------|-------------|
| Holder Concentration | 25% | Top holder distribution analysis |
| Liquidity Analysis | 25% | DEX liquidity depth and lock status |
| Deployer History | 20% | Wallet age, transaction count, past tokens |
| Token Metadata | 10% | Name, symbol, social links validation |
| Contract Security | 20% | Authority revocation, supply concentration |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/solana-token-risk-analyzer.git
cd solana-token-risk-analyzer

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## API Endpoints

### Analyze Token

```bash
GET /api/analyze/:tokenAddress
```

Performs comprehensive risk analysis on a single token.

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "overallRisk": "LOW",
    "riskScore": 25,
    "timestamp": "2024-01-15T10:30:00Z",
    "analysis": {
      "holderConcentration": {
        "score": 20,
        "riskLevel": "LOW",
        "top10HoldersPercentage": 28.5,
        "details": "Good distribution..."
      },
      // ... other analysis sections
    },
    "recommendations": [
      "Token appears relatively safe based on on-chain metrics"
    ]
  }
}
```

### Quick Risk Check

```bash
GET /api/analyze/:tokenAddress/quick
```

Fast, lightweight risk assessment for real-time applications.

### Batch Analysis

```bash
POST /api/analyze/batch
Content-Type: application/json

{
  "tokenAddresses": [
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "So11111111111111111111111111111111111111112"
  ]
}
```

### Get Top Holders

```bash
GET /api/analyze/:tokenAddress/holders?limit=20
```

### Health Check

```bash
GET /health
GET /health/ready
GET /health/live
```

## Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| LOW | 0-25 | Token appears safe based on metrics |
| MEDIUM | 26-50 | Some risk indicators present |
| HIGH | 51-75 | Multiple risk factors detected |
| CRITICAL | 76-100 | High probability of scam/rug |

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `SOLANA_RPC_URL` | mainnet-beta | Solana RPC endpoint |
| `HELIUS_API_KEY` | - | Optional Helius API key |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## Architecture

```
src/
├── index.ts              # Application entry point
├── routes/
│   ├── analyze.ts        # Token analysis endpoints
│   └── health.ts         # Health check endpoints
├── services/
│   ├── solanaService.ts  # Solana blockchain interactions
│   ├── riskAnalyzer.ts   # Risk calculation logic
│   └── cacheService.ts   # In-memory caching
├── middleware/
│   ├── rateLimiter.ts    # Rate limiting
│   └── errorHandler.ts   # Error handling
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    ├── helpers.ts        # Utility functions
    └── logger.ts         # Winston logger
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- helpers.test.ts
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Railway / Render / Heroku

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

## Disclaimer

This tool provides risk analysis based on on-chain metrics only. It is not financial advice. Always do your own research (DYOR) before interacting with any token. Past performance and on-chain metrics do not guarantee future results.
