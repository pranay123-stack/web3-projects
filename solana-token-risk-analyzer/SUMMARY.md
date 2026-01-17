# Solana Token Risk Analyzer API - Summary

## What It Does

This API analyzes any Solana token and returns a risk score (0-100) based on 5 key factors:

| Factor | Weight | What It Checks |
|--------|--------|----------------|
| Holder Concentration | 25% | Are tokens distributed fairly or held by whales? |
| Liquidity Analysis | 25% | Is there enough liquidity? Is it locked? |
| Deployer History | 20% | Is the deployer wallet new or established? |
| Token Metadata | 10% | Does it have valid name, symbol, social links? |
| Contract Security | 20% | Are mint/freeze authorities revoked? |

## How to Run

```bash
# Clone
git clone https://github.com/pranay123-stack/solana-token-risk-analyzer.git
cd solana-token-risk-analyzer

# Install
npm install

# Configure (optional - works with public RPC by default)
cp .env.example .env

# Run in development
npm run dev

# Or build and run production
npm run build
npm start
```

Server starts at `http://localhost:3000`

## How to Test

**Run unit tests:**
```bash
npm test
```

**Test the API with real tokens:**

```bash
# Analyze USDC (safe token)
curl http://localhost:3000/api/analyze/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Quick risk check
curl http://localhost:3000/api/analyze/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/quick

# Get top holders
curl http://localhost:3000/api/analyze/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/holders

# Batch analyze multiple tokens
curl -X POST http://localhost:3000/api/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{"tokenAddresses": ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "So11111111111111111111111111111111111111112"]}'

# Health check
curl http://localhost:3000/health
```

## Example Response

```json
{
  "success": true,
  "data": {
    "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "overallRisk": "LOW",
    "riskScore": 22,
    "timestamp": "2024-01-15T10:30:00Z",
    "analysis": {
      "holderConcentration": {
        "score": 15,
        "riskLevel": "LOW",
        "top10HoldersPercentage": 28.5,
        "details": "Good distribution: Top 10 holders own 28.5% of supply"
      },
      "contractSecurity": {
        "score": 0,
        "mintAuthorityRevoked": true,
        "freezeAuthorityRevoked": true
      }
    },
    "recommendations": ["Token appears relatively safe based on on-chain metrics"]
  }
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze/:tokenAddress` | GET | Full risk analysis |
| `/api/analyze/:tokenAddress/quick` | GET | Quick risk check |
| `/api/analyze/:tokenAddress/holders` | GET | Top holders list |
| `/api/analyze/batch` | POST | Analyze multiple tokens |
| `/health` | GET | Health check |

## Tech Stack

- TypeScript
- Express.js
- @solana/web3.js
- Winston (logging)
- Jest (testing)
- Docker ready
