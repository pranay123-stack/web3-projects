# DeFi Protocols Projects

A comprehensive collection of Decentralized Finance protocols covering lending, DEXs, derivatives, yield, staking, and RWA.

---

## Folder Structure

```
DeFi Protocols/
├── Lending & Borrowing/         # Supply/borrow (Aave, Compound)
├── DEX & AMM/                   # Swap tokens (Uniswap, Curve)
├── Aggregators/                 # Best swap routes (1inch, Jupiter)
├── Derivatives/                 # Perps, options (dYdX, GMX)
├── Yield Protocols/             # Vaults, auto-compound
├── Staking/                     # Liquid staking (Lido)
├── Structured Products/         # Options vaults, tranches
└── RWA DeFi/                    # Real-world assets
```

---

## DeFi Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DEFI STACK                                      │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │    USER         │
                         └────────┬────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       AGGREGATION LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   1inch     │  │   Jupiter   │  │  DefiLlama  │  │    Zapper   │  │
│  │   Routes    │  │   Solana    │  │    Yield    │  │  Portfolio  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   LENDING    │  │    DEX       │  │ DERIVATIVES  │                │
│  │  Aave        │  │  Uniswap     │  │  GMX         │                │
│  │  Compound    │  │  Curve       │  │  dYdX        │                │
│  │  Morpho      │  │  Balancer    │  │  Hyperliquid │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │    YIELD     │  │   STAKING    │  │     RWA      │                │
│  │  Yearn       │  │  Lido        │  │  Centrifuge  │                │
│  │  Convex      │  │  Rocket Pool │  │  Ondo        │                │
│  │  Beefy       │  │  Jito        │  │  Maple       │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       BASE LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              STABLECOINS + ORACLES + BRIDGES                    │  │
│  │  USDC, DAI, USDT    |    Chainlink, Pyth    |    Bridges        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Categories Explained

### 1. Lending & Borrowing
Supply assets to earn yield, borrow against collateral.

```
┌─────────────────────────────────────────────────────────────────┐
│                    LENDING PROTOCOL FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          AAVE                                      │
│                                                                    │
│   LENDER                   POOL                    BORROWER       │
│                                                                    │
│   ┌─────────┐         ┌───────────┐          ┌─────────┐         │
│   │ Deposit │         │           │          │ Deposit │         │
│   │ 100 USDC│────────▶│   USDC    │◀─────────│ 2 ETH   │         │
│   │         │         │   POOL    │          │collateral│        │
│   └─────────┘         │           │          └─────────┘         │
│       │               │ Total:    │               │              │
│       │               │ $10M USDC │               │              │
│       ▼               │           │               ▼              │
│   ┌─────────┐         │ Util: 75% │          ┌─────────┐         │
│   │ Receive │         │           │          │ Borrow  │         │
│   │ aUSDC   │         └─────┬─────┘          │ 3000    │         │
│   │ (yield) │               │                │ USDC    │         │
│   └─────────┘               │                └─────────┘         │
│                             │                     │              │
│                             ▼                     │              │
│              ┌─────────────────────────┐         │              │
│              │   INTEREST RATE MODEL   │         │              │
│              │                         │         │              │
│              │ Low utilization = low % │         │              │
│              │ High utilization = high%│◀────────┘              │
│              │                         │   Pay interest         │
│              │ Supply APY: 5%          │   Borrow APR: 7%       │
│              │ Spread = Protocol fee   │                        │
│              └─────────────────────────┘                        │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


LIQUIDATION:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   If collateral value drops below threshold:                      │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Collateral: 2 ETH = $6,000                           │    │
│   │   Borrowed: 3,000 USDC                                  │    │
│   │   Health Factor: 6000/3000 × LTV = 1.5 ✓               │    │
│   │                                                         │    │
│   │   ETH drops 50%:                                        │    │
│   │   Collateral: 2 ETH = $3,000                           │    │
│   │   Health Factor: 3000/3000 × LTV = 0.75 ✗             │    │
│   │                                                         │    │
│   │   LIQUIDATION TRIGGERED                                │    │
│   │   Liquidator repays debt, takes collateral + bonus     │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Protocol | TVL | Chains | Model |
|----------|-----|--------|-------|
| **Aave** | $15B+ | 10+ | Pool-based |
| **Compound** | $2B+ | Ethereum | Pool-based |
| **Morpho** | $3B+ | Ethereum | P2P matching |
| **Spark** | $2B+ | Ethereum | MakerDAO |
| **Kamino** | $1B+ | Solana | Concentrated |

---

### 2. DEX & AMM
Swap tokens without intermediaries.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AMM (UNISWAP) MECHANICS                       │
└─────────────────────────────────────────────────────────────────┘

CONSTANT PRODUCT FORMULA: x * y = k

┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ETH/USDC POOL                                                   │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Initial State:                                        │    │
│   │   ETH: 100    USDC: 300,000                            │    │
│   │   k = 100 × 300,000 = 30,000,000                       │    │
│   │   Price: 1 ETH = 3,000 USDC                            │    │
│   │                                                         │    │
│   │   User swaps 10,000 USDC for ETH:                      │    │
│   │                                                         │    │
│   │   New USDC: 310,000                                    │    │
│   │   New ETH: 30,000,000 / 310,000 = 96.77                │    │
│   │   User receives: 100 - 96.77 = 3.23 ETH                │    │
│   │                                                         │    │
│   │   New price: 1 ETH = 3,203 USDC (slippage!)           │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


UNISWAP V3 CONCENTRATED LIQUIDITY:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   V2: Liquidity spread across all prices                          │
│   ════════════════════════════════════════════════                │
│                                                                   │
│   V3: Liquidity concentrated in active range                      │
│                    ████████████                                   │
│   ─────────────────████████████─────────────────                 │
│                    $2,900 - $3,100                                │
│                                                                   │
│   Benefits:                                                       │
│   • 4000x more capital efficient                                  │
│   • Higher fees for same capital                                  │
│   • But: requires active management                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


DEX TYPES:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  CONSTANT PRODUCT          STABLESWAP             ORDER BOOK      │
│  (Uniswap)                (Curve)                (dYdX)          │
│  ┌─────────────────┐     ┌─────────────────┐   ┌─────────────┐   │
│  │ x × y = k       │     │ Flat curve for  │   │ Traditional │   │
│  │                 │     │ similar assets  │   │ bid/ask     │   │
│  │ Any token pair  │     │                 │   │             │   │
│  │ Higher slippage │     │ USDC/USDT/DAI   │   │ Low slippage│   │
│  │ for large trades│     │ Minimal slippage│   │ More complex│   │
│  └─────────────────┘     └─────────────────┘   └─────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Protocol | Type | TVL | Chains |
|----------|------|-----|--------|
| **Uniswap** | AMM V3 | $5B+ | 10+ |
| **Curve** | Stableswap | $2B+ | 10+ |
| **Balancer** | Weighted pools | $1B+ | 5+ |
| **Raydium** | AMM | $500M+ | Solana |
| **Orca** | Concentrated | $300M+ | Solana |

---

### 3. Aggregators
Find the best swap route across all DEXs.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEX AGGREGATOR FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          1INCH                                     │
│                                                                    │
│   USER REQUEST: Swap 10,000 USDC → ETH                            │
│                                                                    │
│                    ┌─────────────────┐                            │
│                    │   PATHFINDER    │                            │
│                    │    ALGORITHM    │                            │
│                    └────────┬────────┘                            │
│                             │                                      │
│            ┌────────────────┼────────────────┐                    │
│            │                │                │                    │
│            ▼                ▼                ▼                    │
│       ┌─────────┐     ┌─────────┐     ┌─────────┐                │
│       │ Uniswap │     │  Curve  │     │Sushiswap│                │
│       │         │     │         │     │         │                │
│       │ 3.20 ETH│     │ 3.15 ETH│     │ 3.18 ETH│                │
│       └─────────┘     └─────────┘     └─────────┘                │
│                                                                    │
│   OPTIMAL ROUTE FOUND:                                            │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Split: 60% Uniswap V3 + 40% Curve                    │    │
│   │   Via: USDC → WETH → ETH                               │    │
│   │   Output: 3.25 ETH (best price!)                       │    │
│   │   Saved: 0.05 ETH vs single DEX                        │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Aggregator | Chains | Features |
|------------|--------|----------|
| **1inch** | 10+ | Pathfinder, limit orders |
| **Jupiter** | Solana | Best on Solana |
| **0x** | EVM | API, RFQ system |
| **Paraswap** | EVM | Gas optimization |
| **CowSwap** | Ethereum | MEV protection |

---

### 4. Derivatives (Perps & Options)
Trade with leverage, hedge positions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERPETUAL SWAP FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          GMX                                       │
│                                                                    │
│   TRADER                                              GLP POOL    │
│                                                                    │
│   ┌─────────┐                                    ┌───────────┐    │
│   │ Open    │                                    │ Liquidity │    │
│   │ Long    │                                    │  Pool     │    │
│   │ 10x ETH │                                    │           │    │
│   │         │                                    │ ETH, BTC  │    │
│   │ Margin: │─────────────────────────────────▶ │ USDC, etc │    │
│   │ $1,000  │                                    │           │    │
│   └─────────┘                                    │ $500M TVL │    │
│       │                                          └───────────┘    │
│       │                                               │           │
│       │   Position: $10,000 ETH exposure              │           │
│       │                                               │           │
│       │   ETH +10%: Profit $1,000 (100% gain!)       │           │
│       │   ETH -10%: Loss $1,000 (liquidated!)        │           │
│       │                                               │           │
│       ▼                                               ▼           │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                  FUNDING RATE                           │    │
│   │                                                         │    │
│   │   Longs pay shorts (or vice versa) to balance          │    │
│   │   Keeps perp price close to spot price                 │    │
│   │                                                         │    │
│   │   More longs → Longs pay shorts                        │    │
│   │   More shorts → Shorts pay longs                       │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


PERP MODELS:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  LP POOL (GMX)                ORDER BOOK (dYdX)                   │
│  ┌─────────────────────────┐ ┌─────────────────────────┐         │
│  │ • Trade against pool    │ │ • Traditional matching  │         │
│  │ • Zero slippage         │ │ • Professional trading  │         │
│  │ • Oracle-based pricing  │ │ • Limit orders          │         │
│  │ • LPs take risk         │ │ • Higher volume         │         │
│  └─────────────────────────┘ └─────────────────────────┘         │
│                                                                   │
│  vAMM (Perpetual Protocol)   HYBRID (Hyperliquid)                │
│  ┌─────────────────────────┐ ┌─────────────────────────┐         │
│  │ • Virtual AMM           │ │ • On-chain order book   │         │
│  │ • No real LPs needed    │ │ • Own L1 chain          │         │
│  │ • Funding rate balances │ │ • CEX-like experience   │         │
│  └─────────────────────────┘ └─────────────────────────┘         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Protocol | Type | Volume | Chain |
|----------|------|--------|-------|
| **Hyperliquid** | Order book | $50B+/mo | Own L1 |
| **dYdX** | Order book | $30B+/mo | Cosmos |
| **GMX** | LP pool | $5B+/mo | Arbitrum |
| **Drift** | vAMM + DLOB | $1B+/mo | Solana |
| **Vertex** | Hybrid | $2B+/mo | Arbitrum |

---

### 5. Liquid Staking
Stake ETH/SOL and receive liquid tokens.

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIQUID STAKING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          LIDO                                      │
│                                                                    │
│   USER                     LIDO                    VALIDATORS      │
│                                                                    │
│   ┌─────────┐         ┌───────────┐          ┌─────────────┐     │
│   │ Deposit │         │           │          │             │     │
│   │ 32 ETH  │────────▶│   Lido    │─────────▶│  Validator  │     │
│   │         │         │  Protocol │          │   Node 1    │     │
│   └─────────┘         │           │          │             │     │
│       │               │           │          │  Validator  │     │
│       │               │ Stakes on │          │   Node 2    │     │
│       ▼               │ behalf of │          │    ...      │     │
│   ┌─────────┐         │ users     │          └─────────────┘     │
│   │ Receive │         │           │                │             │
│   │ 32 stETH│         └───────────┘                │             │
│   │         │              │                       │             │
│   └─────────┘              │◀──────────────────────┘             │
│       │                    │    Staking rewards                   │
│       │                    │                                      │
│       ▼                    ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   stETH = Rebasing token (balance grows daily)          │    │
│   │                                                         │    │
│   │   Day 1: 32.000 stETH                                  │    │
│   │   Day 30: 32.087 stETH (+0.27% monthly)                │    │
│   │   Year: ~35.2 stETH (~10% APY)                         │    │
│   │                                                         │    │
│   │   AND you can use stETH in DeFi!                       │    │
│   │   • Collateral on Aave                                 │    │
│   │   • LP on Curve                                        │    │
│   │   • Leverage via looping                               │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


LST TYPES:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  REBASING (stETH)              VALUE ACCRUING (rETH, cbETH)      │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐    │
│  │ Balance increases       │  │ Price increases             │    │
│  │                         │  │                             │    │
│  │ Day 1: 1.00 stETH       │  │ Day 1: 1 rETH = 1.0 ETH    │    │
│  │ Day 365: 1.05 stETH     │  │ Day 365: 1 rETH = 1.05 ETH │    │
│  │                         │  │                             │    │
│  │ Same price vs ETH       │  │ Same quantity               │    │
│  └─────────────────────────┘  └─────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Protocol | Asset | TVL | Market Share |
|----------|-------|-----|--------------|
| **Lido** | ETH | $25B+ | ~30% |
| **Rocket Pool** | ETH | $3B+ | ~3% |
| **Coinbase** | ETH | $3B+ | ~3% |
| **Jito** | SOL | $2B+ | Top on Solana |
| **Marinade** | SOL | $1B+ | Solana |

---

## Revenue Models

| Category | Revenue Source | Typical Range |
|----------|----------------|---------------|
| **Lending** | Interest spread | 10-20% of interest |
| **DEX** | Swap fees | 0.05-0.3% |
| **Aggregators** | Positive slippage | Variable |
| **Perps** | Trading fees | 0.05-0.1% |
| **Staking** | Commission | 5-10% of rewards |
| **Yield** | Performance fees | 10-20% |

### Detailed Breakdown:

**Aave model:**
```
Revenue Streams:
├── Reserve factor: 10-20% of interest
├── Flash loan fees: 0.09%
├── Liquidation bonus (indirect)
└── GHO stablecoin interest

Example:
├── $10B TVL, 5% avg borrow rate
├── Interest paid: $500M/year
├── Protocol share (15%): $75M/year
```

**Uniswap model:**
```
Revenue Streams:
├── Protocol fee switch: 0.05% (optional)
├── Currently: 100% to LPs
└── UNI governance controls fee

If enabled:
├── $500B annual volume
├── Protocol fee: 0.05%
├── Revenue: $250M/year
```

---

## Risk Considerations

```
┌───────────────────────────────────────────────────────────────────┐
│                       DEFI RISKS                                   │
├─────────────────────┬─────────────────────────────────────────────┤
│ Smart Contract      │ Bugs, exploits, upgrades                    │
│ Oracle              │ Price manipulation, stale data              │
│ Liquidity           │ Bank runs, depegs, cascading liquidations  │
│ Economic            │ Tokenomics flaws, death spirals             │
│ Governance          │ Malicious proposals, 51% attacks           │
│ Regulatory          │ Legal uncertainty, compliance               │
└─────────────────────┴─────────────────────────────────────────────┘
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/web3-projects.git
cd "web3-projects/DeFi Protocols"

# Explore categories
ls -la
```

---

<p align="center">
  <i>The building blocks of decentralized finance.</i>
</p>
