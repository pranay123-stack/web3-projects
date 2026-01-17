# Chainlink Community Tools

A comprehensive toolkit for Chainlink developers and node operators. Monitor prices, estimate CCIP fees, manage VRF subscriptions, and check Automation health.

## Features

| Tool | Description |
|------|-------------|
| **CCIP Fee Estimator** | Estimate cross-chain message fees |
| **Price Feed Monitor** | Real-time oracle price monitoring |
| **VRF Subscription Manager** | Manage VRF v2 subscriptions |
| **Automation Health Checker** | Monitor upkeep status and balance |

## Installation

```bash
git clone https://github.com/pranay123-stack/chainlink-community-tools.git
cd chainlink-community-tools
npm install
```

## Configuration

Copy `.env.example` to `.env` and add your RPC URLs:

```bash
cp .env.example .env
```

Edit `.env`:
```env
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Usage

### Interactive Mode

```bash
npm start
```

This launches an interactive menu to select tools.

### Individual Tools

#### CCIP Fee Estimator

```bash
# Get all routes from Ethereum
npm run ccip-estimate ethereum

# Get specific route fee
npm run ccip-estimate ethereum polygon
```

#### Price Feed Monitor

```bash
# List all prices for a chain
npm run price-monitor list ethereum

# Compare price across chains
npm run price-monitor compare ETH/USD

# Live monitoring (updates every 30s)
npm run price-monitor watch 30

# Get single price
npm run price-monitor get ethereum ETH/USD
```

#### VRF Subscription Manager

```bash
# Get subscription details
npm run vrf-manager get ethereum 12345

# Health check
npm run vrf-manager health ethereum 12345

# Estimate request cost
npm run vrf-manager estimate ethereum 100000 1

# Check LINK balance
npm run vrf-manager link-balance ethereum 0xYourAddress
```

#### Automation Health Checker

```bash
# Get upkeep details
npm run automation-health get ethereum 123456789

# Full health check
npm run automation-health health ethereum 123456789

# Check multiple upkeeps
npm run automation-health batch ethereum 123 456 789

# Get registry state
npm run automation-health registry ethereum
```

## Supported Networks

- Ethereum Mainnet
- Polygon
- Arbitrum One
- Optimism
- Avalanche C-Chain
- BNB Smart Chain
- Base

## Example Output

### Price Feed Monitor
```
ETHEREUM
┌──────────┬──────────────────┬──────────────────────┬───────────┬──────────┐
│ Pair     │ Price            │ Updated              │ Staleness │ Status   │
├──────────┼──────────────────┼──────────────────────┼───────────┼──────────┤
│ ETH/USD  │ $2,234.56        │ 12/10/2025, 4:30 PM  │ 45s       │ Fresh    │
│ BTC/USD  │ $43,567.89       │ 12/10/2025, 4:30 PM  │ 32s       │ Fresh    │
│ LINK/USD │ $15.23           │ 12/10/2025, 4:28 PM  │ 2m        │ Fresh    │
└──────────┴──────────────────┴──────────────────────┴───────────┴──────────┘
```

### VRF Health Report
```
🎲 VRF Subscription #12345
────────────────────────────────────────
Chain:          ethereum
Owner:          0x1234...5678
Balance:        5.5 LINK
Request Count:  142
Consumers:      3

Status: HEALTHY

💡 Recommendations:
   - Monitor balance and top up as needed
```

## API Usage

You can also use these tools programmatically:

```javascript
const { PriceFeedMonitor } = require('./src/price-feed-monitor');

async function main() {
  const monitor = new PriceFeedMonitor();
  await monitor.initialize();

  const price = await monitor.getPrice('ethereum', 'ETH/USD');
  console.log(`ETH/USD: $${price.price}`);

  // Set alerts
  monitor.setAlert('ethereum', 'ETH/USD', 'above', 2500, (data) => {
    console.log(`Alert! ETH above $2500: $${data.price}`);
  });
}

main();
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Links

- [Chainlink Documentation](https://docs.chain.link/)
- [CCIP Documentation](https://docs.chain.link/ccip)
- [VRF Documentation](https://docs.chain.link/vrf)
- [Automation Documentation](https://docs.chain.link/chainlink-automation)

## Author

[@pranay123-stack](https://github.com/pranay123-stack)
