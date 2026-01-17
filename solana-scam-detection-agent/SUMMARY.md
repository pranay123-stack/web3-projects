# Solana Scam Detection Agent - Summary

## What It Does

An autonomous agent that:
1. **Monitors** new token mints on Solana in real-time via WebSocket
2. **Analyzes** each token for 7+ scam indicators
3. **Classifies** scam type (rug pull, honeypot, fake token, etc.)
4. **Alerts** via Telegram/Discord when scams are detected
5. **Stores** all detections in SQLite database

## Scam Indicators Checked

| Indicator | Severity | Description |
|-----------|----------|-------------|
| Mint Authority Active | HIGH | Can mint unlimited tokens |
| Freeze Authority Active | HIGH | Can freeze your tokens |
| High Holder Concentration | CRITICAL | Whales control supply |
| New Deployer Wallet | HIGH | Wallet < 7 days old |
| Suspicious Name | MEDIUM | Contains "moon", "safe", "100x" |
| Fake Token | CRITICAL | Impersonating USDC, SOL, etc. |
| No Metadata | MEDIUM | Anonymous token |

## How to Run

```bash
# Clone
git clone https://github.com/pranay123-stack/solana-scam-detection-agent.git
cd solana-scam-detection-agent

# Install
npm install

# Configure
cp .env.example .env
# Edit .env to add Telegram/Discord credentials (optional)

# Run
npm run dev
```

Server starts at `http://localhost:3001` and begins monitoring.

## How to Test

**Run unit tests:**
```bash
npm test
```

**Test the API manually:**

```bash
# Check a specific token for scams
curl http://localhost:3001/api/check/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Get recent detections
curl http://localhost:3001/api/recent?limit=10

# Get only detected scams
curl http://localhost:3001/api/scams

# Get agent statistics
curl http://localhost:3001/api/stats

# Report a scam manually
curl -X POST http://localhost:3001/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "ScamToken111111111111111111111111111111111",
    "scamType": "RUG_PULL",
    "description": "Liquidity removed after pump"
  }'

# Health check
curl http://localhost:3001/health
```

## Example Scam Detection Response

```json
{
  "success": true,
  "data": {
    "tokenAddress": "SCAM111111111111111111111111111111111111111",
    "isScam": true,
    "confidence": 0.87,
    "scamType": "RUG_PULL",
    "riskScore": 82,
    "indicators": [
      {
        "name": "MINT_AUTHORITY_ACTIVE",
        "detected": true,
        "severity": "HIGH",
        "description": "Mint authority is NOT revoked - token supply can be increased"
      },
      {
        "name": "HIGH_HOLDER_CONCENTRATION",
        "detected": true,
        "severity": "CRITICAL",
        "description": "High concentration: Top holder 67.2%, Top 10 89.1%"
      },
      {
        "name": "NEW_DEPLOYER_WALLET",
        "detected": true,
        "severity": "HIGH",
        "description": "Very new deployer wallet (2 days old)"
      }
    ],
    "recommendation": "HIGH RISK - Likely scam. Issues: Mint authority NOT revoked; High concentration; Very new deployer. Do NOT interact with this token.",
    "metadata": {
      "name": "SafeMoon100x",
      "symbol": "SM100X",
      "deployer": "NewWallet111111111111111111111111111111111"
    }
  }
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/check/:tokenAddress` | GET | Check token for scams |
| `/api/recent` | GET | Get recent detections |
| `/api/scams` | GET | Get detected scams only |
| `/api/stats` | GET | Agent statistics |
| `/api/report` | POST | Report a scam manually |
| `/health` | GET | Health check |

## Tech Stack

- TypeScript
- Express.js
- @solana/web3.js
- better-sqlite3 (database)
- node-telegram-bot-api (alerts)
- discord.js (alerts)
- Jest (testing)
- Docker ready

## Comparison with Token Risk Analyzer

| Feature | Token Risk Analyzer | Scam Detection Agent |
|---------|--------------------|--------------------|
| Purpose | On-demand risk scoring | Real-time monitoring |
| Input | Single token address | Monitors all new tokens |
| Output | Risk score + breakdown | Scam classification + alerts |
| Storage | In-memory cache | SQLite database |
| Alerts | No | Telegram/Discord |
| ML | No | Yes (weighted classifier) |
| Best For | Wallet integration, before-trade checks | Exchange monitoring, security dashboards |
