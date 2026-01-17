# Solana Scam Detection Agent

An autonomous agent that monitors Solana blockchain in real-time to detect scam tokens, honeypots, and rug pulls using pattern matching and machine learning.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
![Machine Learning](https://img.shields.io/badge/ML-Powered-green?style=flat)

## Features

- **Real-Time Monitoring**: WebSocket-based monitoring of new token mints
- **Multi-Factor Detection**: 7+ scam indicators analyzed per token
- **ML Classification**: Weighted heuristic model with online learning
- **Instant Alerts**: Telegram and Discord notifications for detected scams
- **REST API**: Query tokens and access detection history
- **Persistent Storage**: SQLite database for detection records
- **Scam Type Classification**: Identifies specific scam patterns (rug pull, honeypot, etc.)

## Detection Indicators

| Indicator | Description | Severity |
|-----------|-------------|----------|
| Mint Authority | Token supply can be increased | HIGH |
| Freeze Authority | Tokens can be frozen | HIGH |
| Holder Concentration | Top holders own majority of supply | CRITICAL |
| Deployer Age | Recently created deployer wallet | HIGH |
| Suspicious Name | Hype patterns (moon, safe, 100x) | MEDIUM |
| Fake Token | Impersonating known tokens | CRITICAL |
| No Metadata | Missing on-chain metadata | MEDIUM |

## Scam Types Detected

- **RUG_PULL**: High concentration, likely liquidity removal
- **HONEYPOT**: Freeze authority active, can't sell
- **PUMP_AND_DUMP**: Suspicious trading patterns
- **FAKE_TOKEN**: Impersonating legitimate projects
- **MINT_EXPLOIT**: Active mint authority abuse
- **LIQUIDITY_DRAIN**: LP removal patterns

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/solana-scam-detection-agent.git
cd solana-scam-detection-agent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build the project
npm run build

# Start the agent
npm start
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Configuration

Environment variables in `.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | Yes |
| `SOLANA_WS_URL` | Solana WebSocket endpoint | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for alerts | No |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for alerts | No |
| `DISCORD_WEBHOOK_URL` | Discord webhook for alerts | No |
| `DATABASE_PATH` | SQLite database path | Yes |
| `MIN_SCAM_CONFIDENCE` | Minimum confidence to flag (0-1) | Yes |
| `ALERT_THRESHOLD` | Minimum confidence for alerts (0-1) | Yes |
| `PORT` | API server port | Yes |

## API Endpoints

### Check Token

```bash
GET /api/check/:tokenAddress
```

Analyze a token for scam indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenAddress": "...",
    "isScam": true,
    "confidence": 0.85,
    "scamType": "RUG_PULL",
    "riskScore": 78,
    "indicators": [
      {
        "name": "MINT_AUTHORITY_ACTIVE",
        "detected": true,
        "severity": "HIGH",
        "description": "Mint authority is NOT revoked"
      }
    ],
    "recommendation": "HIGH RISK - Do NOT interact"
  }
}
```

### Report Scam

```bash
POST /api/report
Content-Type: application/json

{
  "tokenAddress": "...",
  "scamType": "RUG_PULL",
  "description": "Optional description",
  "evidence": ["tx_signature_1", "tx_signature_2"]
}
```

### Get Recent Detections

```bash
GET /api/recent?limit=50
```

### Get Statistics

```bash
GET /api/stats
```

### Health Check

```bash
GET /health
```

## Architecture

```
src/
├── index.ts              # Main entry point
├── types/                # TypeScript interfaces
├── services/
│   └── solanaMonitor.ts  # Blockchain monitoring
├── detectors/
│   └── scamDetector.ts   # Detection logic
├── ml/
│   └── classifier.ts     # ML classification model
├── alerts/
│   └── alertService.ts   # Notification system
├── db/
│   └── database.ts       # SQLite persistence
├── api/
│   └── server.ts         # REST API
└── utils/
    ├── helpers.ts        # Utility functions
    └── logger.ts         # Winston logger
```

## ML Model

The classifier uses a weighted heuristic model that can be extended:

### Features
- Holder concentration (normalized)
- Deployer wallet age
- Liquidity ratio
- Mint/Freeze authority status
- Name pattern analysis
- Metadata quality

### Training
```bash
# Train model on historical data
npm run train
```

### Model Updates
The model supports online learning - weights are updated as new confirmed scams are reported.

## Alert Examples

### Telegram Alert
```
🔴 Scam Detected: FAKESOL

Token: Fake Solana (FAKESOL)
Address: ABC...XYZ
Risk Score: 92/100
Confidence: 95.2%
Type: Fake/Clone Token

Indicators:
• Potentially impersonating SOL (89% similar)
• Mint authority NOT revoked
• Very new deployer wallet (2 days)

Recommendation:
HIGH RISK - Do NOT interact with this token.

View on Solscan
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- classifier.test.ts

# Run with coverage report
npm test -- --coverage
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY data ./data
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  scam-agent:
    build: .
    ports:
      - "3001:3001"
    environment:
      - SOLANA_RPC_URL=${SOLANA_RPC_URL}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## Roadmap

- [ ] Integration with major DEX APIs (Jupiter, Raydium)
- [ ] Deep learning model for pattern recognition
- [ ] Browser extension for wallet integration
- [ ] Historical accuracy tracking dashboard
- [ ] Community-driven scam reporting verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE)

## Disclaimer

This tool provides automated scam detection based on on-chain analysis and pattern matching. It is not 100% accurate and should not be the sole basis for investment decisions. Always do your own research (DYOR). The authors are not responsible for any financial losses.
