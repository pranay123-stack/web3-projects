# Cypher Analytics Dashboard

A production-ready liquidity analytics dashboard for Cypher Protocol - an Ethereum L1 capital markets protocol with concentrated liquidity AMM.

## Features

### Pool Dashboard
- View all Cypher liquidity pools with TVL, 24h volume, and 7d fees
- Sortable and filterable table view
- Search by token pair
- Detailed pool modal with historical charts

### TVL & Volume Charts
- Interactive line charts for historical TVL
- Bar charts for trading volume
- Fee APY tracking over time
- Multiple time range options (24h, 7d, 30d, 90d, 1Y)

### Impermanent Loss Calculator
- Input entry price, current price, and position range
- Calculate IL percentage and dollar value
- Visual comparison of LP position vs HODL strategy
- Supports concentrated liquidity mathematics

### Portfolio Tracker
- Connect wallet integration (mock implementation, ready for wagmi)
- View all LP positions
- Track fees earned and impermanent loss
- Position health monitoring (in-range/out-of-range)

### Analytics Page
- Protocol-wide statistics
- Fee tier distribution analysis
- Top pools by TVL and APY
- Recent large swap transactions

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with custom Cypher theme
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React hooks with mock data

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
cypher-analytics-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── pools/              # Pools listing page
│   │   ├── portfolio/          # Portfolio tracker
│   │   └── analytics/          # Analytics page
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── pools/              # Pool-related components
│   │   ├── portfolio/          # Portfolio components
│   │   ├── charts/             # Chart components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and constants
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Design System

### Colors

The dashboard uses a dark theme with Cypher Protocol branding:

- **Background**: `#0a0a0f` (dark)
- **Card**: `#12121a`
- **Border**: `#1e1e2e`
- **Primary Accent**: `#f7c948` (yellow)
- **Success**: `#22c55e` (green)
- **Error**: `#ef4444` (red)

### Components

- **Card**: Container component with multiple variants
- **Button**: Primary, secondary, ghost, and danger variants
- **Table**: Sortable, filterable data table
- **Charts**: Line, area, and bar charts with consistent styling

## Mock Data

The dashboard includes realistic mock data for demonstration:

- 12 liquidity pools (ETH/USDC, WBTC/ETH, stablecoin pairs, etc.)
- 4 sample LP positions
- 30 days of historical TVL/volume data
- Protocol-wide statistics

## Future Enhancements

- [ ] Real blockchain data integration via subgraph
- [ ] Wallet connection with wagmi/viem
- [ ] Transaction execution (add/remove liquidity)
- [ ] Price feed integration
- [ ] Advanced analytics (correlation, volatility)
- [ ] Notification system for position alerts

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
