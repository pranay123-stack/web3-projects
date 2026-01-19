# Uniswap V3 & V4 Sniper Bot

A high-performance, multi-agent sniper bot for Base blockchain that supports both Uniswap V3 and Uniswap V4 protocols.

## Features

- **Multi-Protocol Support**: Works with both Uniswap V3 and V4
- **Multi-Agent Architecture**: Modular design with specialized agents
- **Mempool Monitoring**: Real-time pending transaction detection
- **Pool Detection**: Automatic detection of new liquidity pools
- **Safety Analysis**: Honeypot detection, tax estimation, ownership checks
- **Automated Execution**: Configurable snipe parameters with slippage protection
- **Interactive CLI**: Real-time monitoring and control

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Coordinator Agent                         │
│  (Orchestrates all agents and handles system-wide events)    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Mempool     │   │    Pool       │   │    Safety     │
│   Agent       │   │   Detector    │   │    Agent      │
│               │   │    Agent      │   │               │
│ • Pending TX  │   │ • V3 Factory  │   │ • Honeypot    │
│ • Decode data │   │ • V4 PoolMgr  │   │ • Tax check   │
│ • Filter      │   │ • Events      │   │ • Ownership   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │    Sniper     │
                    │    Agent      │
                    │               │
                    │ • Execute TX  │
                    │ • Position    │
                    │ • Profit/Loss │
                    └───────────────┘
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A wallet with ETH on Base network
- RPC endpoint (recommended: Alchemy, QuickNode, or Infura)

## Installation

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/Uniswap_sniper_bot.git
cd Uniswap_sniper_bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit `.env` file with your settings:

```env
# Required
PRIVATE_KEY=your_private_key_here
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
WSS_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Sniper Settings
MIN_LIQUIDITY_ETH=1
MAX_POSITION_SIZE_ETH=0.5
SLIPPAGE_TOLERANCE=5
MAX_BUY_TAX=10
MAX_SELL_TAX=10

# Safety
SIMULATION_MODE=false
```

## Usage

### Start the Bot

```bash
# Build
npm run build

# Start with all agents
npm start

# Or use CLI
npm run snipe
```

### CLI Commands

```bash
# Start in monitoring mode (no trades)
npm run monitor

# Run simulation
npm run simulate

# Check status
npx ts-node src/cli.ts status

# View configuration
npx ts-node src/cli.ts config
```

### Interactive Commands

Once the bot is running, use these commands:

| Command | Description |
|---------|-------------|
| `status` | Show agent status |
| `stats` | Show statistics |
| `positions` | Show open positions |
| `history` | Show trade history |
| `balance` | Show wallet balance |
| `pause` | Pause all agents |
| `resume` | Resume all agents |
| `sell <addr>` | Sell a specific position |
| `sellall` | Sell all positions |
| `exit` | Stop and exit |

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Build
npm run build

# Development mode
npm run dev
```

## Project Structure

```
├── src/
│   ├── agents/           # Multi-agent system
│   │   ├── BaseAgent.ts
│   │   ├── MempoolAgent.ts
│   │   ├── PoolDetectorAgent.ts
│   │   ├── SafetyAgent.ts
│   │   ├── SniperAgent.ts
│   │   └── CoordinatorAgent.ts
│   ├── core/
│   │   ├── provider.ts   # Blockchain provider
│   │   └── eventBus.ts   # Inter-agent communication
│   ├── services/
│   │   ├── uniswapV3.ts  # V3 integration
│   │   └── uniswapV4.ts  # V4 integration
│   ├── contracts/
│   │   └── abis.ts       # Contract ABIs
│   ├── config/
│   │   └── index.ts      # Configuration
│   ├── types/
│   │   └── index.ts      # TypeScript types
│   ├── utils/
│   │   ├── logger.ts     # Logging
│   │   └── helpers.ts    # Utility functions
│   ├── cli.ts            # CLI interface
│   └── index.ts          # Main entry
├── tests/                # Test files
├── logs/                 # Log files
└── dist/                 # Build output
```

## Safety Features

- **Honeypot Detection**: Analyzes contract bytecode for malicious patterns
- **Tax Estimation**: Estimates buy/sell taxes before trading
- **Ownership Check**: Verifies if contract ownership is renounced
- **Blacklist Detection**: Checks for blacklist functionality
- **Liquidity Verification**: Ensures minimum liquidity requirements
- **Simulation Mode**: Test without executing real trades

## Uniswap V4 Support

This bot fully supports Uniswap V4 including:

- Pool Manager integration
- Hook-aware pool detection
- New swap paradigm with unlock callbacks
- Position Manager for liquidity positions

## Risk Warning

**USE AT YOUR OWN RISK**

- Trading cryptocurrencies involves significant risk
- Sniper bots can result in loss of funds
- Always test with simulation mode first
- Never invest more than you can afford to lose
- This software is provided as-is with no warranty

## License

MIT License

## Author

pranay123-stack
