# Stablecoins Projects

A comprehensive collection of stablecoin protocols covering fiat-backed, crypto-backed, algorithmic, and yield-bearing stablecoins.

---

## Folder Structure

```
Stablecoins/
├── Fiat-backed/                 # 1:1 reserves (USDC, USDT)
├── Crypto-backed/               # Over-collateralized (DAI, LUSD)
├── Algorithmic/                 # Supply/demand based
├── Yield-bearing/               # Stables that earn yield
├── Payment Stablecoins/         # Optimized for payments
├── Stablecoin Infrastructure/   # Minting, redemption
└── Compliance & Attestation/    # Proof of reserves
```

---

## Stablecoin Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     STABLECOIN TYPES                                     │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         STABLECOINS ($150B+)        │
                    └───────────────────┬─────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
         ▼                              ▼                              ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   FIAT-BACKED   │          │  CRYPTO-BACKED  │          │  ALGORITHMIC    │
│                 │          │                 │          │                 │
│  USDC  USDT     │          │   DAI   LUSD    │          │  FRAX (hybrid)  │
│  PYUSD TUSD     │          │  crvUSD  GHO    │          │                 │
│                 │          │                 │          │  UST (failed)   │
│  $100B+         │          │  $10B+          │          │  $5B+           │
└─────────────────┘          └─────────────────┘          └─────────────────┘
         │                              │                              │
         ▼                              ▼                              ▼
   Bank reserves              Over-collateralized           Supply/demand
   1:1 redemption             with crypto                   mechanisms
```

---

## Categories Explained

### 1. Fiat-Backed Stablecoins
Backed 1:1 by USD in bank accounts and T-bills.

```
┌─────────────────────────────────────────────────────────────────┐
│                    USDC MINT/REDEEM FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                         CIRCLE (USDC)                              │
│                                                                    │
│   MINT FLOW:                                                       │
│   ─────────                                                        │
│   USER                     CIRCLE                    BLOCKCHAIN    │
│     │                        │                           │         │
│     │  Wire $1,000,000       │                           │         │
│     │───────────────────────▶│                           │         │
│     │                        │                           │         │
│     │              ┌─────────┴─────────┐                 │         │
│     │              │ 1. Receive USD    │                 │         │
│     │              │ 2. Hold in reserve│                 │         │
│     │              │    (T-bills/bank) │                 │         │
│     │              │ 3. Mint USDC      │                 │         │
│     │              └─────────┬─────────┘                 │         │
│     │                        │                           │         │
│     │                        │  Mint 1,000,000 USDC      │         │
│     │                        │──────────────────────────▶│         │
│     │                        │                           │         │
│     │  1,000,000 USDC sent   │                           │         │
│     │◀───────────────────────────────────────────────────│         │
│                                                                    │
│   REDEEM FLOW:                                                     │
│   ────────────                                                     │
│     │  Send 1,000,000 USDC   │                           │         │
│     │───────────────────────▶│                           │         │
│     │                        │                           │         │
│     │              ┌─────────┴─────────┐                 │         │
│     │              │ 1. Receive USDC   │                 │         │
│     │              │ 2. Burn USDC      │                 │         │
│     │              │ 3. Wire USD       │                 │         │
│     │              └─────────┬─────────┘                 │         │
│     │                        │                           │         │
│     │  Wire $1,000,000       │   Burn 1,000,000 USDC    │         │
│     │◀───────────────────────│──────────────────────────▶│         │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


RESERVE COMPOSITION (USDC):
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    USDC RESERVES                        │    │
│   │                                                         │    │
│   │   ████████████████████████████████████  80% T-bills    │    │
│   │   ████████████  20% Cash deposits                      │    │
│   │                                                         │    │
│   │   Total: ~$25 billion                                   │    │
│   │   Monthly attestation by Deloitte                       │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Stablecoin | Issuer | Supply | Reserves |
|------------|--------|--------|----------|
| **USDT** | Tether | $85B+ | T-bills, cash, loans |
| **USDC** | Circle | $25B+ | T-bills, cash |
| **PYUSD** | PayPal | $500M+ | Full attestation |
| **TUSD** | TrustToken | $1B+ | Real-time attestation |
| **USDP** | Paxos | $1B+ | Regulated |

---

### 2. Crypto-Backed Stablecoins
Over-collateralized with crypto assets.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CDP (MakerDAO/DAI) FLOW                       │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   USER                    MAKER VAULT                             │
│                                                                   │
│   ┌─────────┐            ┌───────────────┐                       │
│   │ Deposit │            │               │                       │
│   │ 10 ETH  │───────────▶│   CDP VAULT   │                       │
│   │($30,000)│            │               │                       │
│   └─────────┘            │ Collateral:   │                       │
│       │                  │ 10 ETH        │                       │
│       │                  │               │                       │
│       ▼                  │ Coll. Ratio:  │                       │
│   ┌─────────┐            │ 150% required │                       │
│   │ Borrow  │◀───────────│               │                       │
│   │ 15,000  │            │ Can borrow:   │                       │
│   │ DAI     │            │ $20,000 max   │                       │
│   └─────────┘            │               │                       │
│                          └───────────────┘                       │
│                                                                   │
│   HEALTH CALCULATION:                                             │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   Collateral: 10 ETH × $3,000 = $30,000                │    │
│   │   Debt: 15,000 DAI                                      │    │
│   │   Ratio: $30,000 / $15,000 = 200% ✓                    │    │
│   │                                                         │    │
│   │   If ETH drops to $2,250 (25% drop):                   │    │
│   │   Collateral: $22,500                                   │    │
│   │   Ratio: $22,500 / $15,000 = 150%                      │    │
│   │   ⚠️ LIQUIDATION THRESHOLD                             │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


LIQUIDATION FLOW:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   When ratio < 150%:                                              │
│                                                                   │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   LIQUIDATOR                          VAULT              │   │
│   │       │                                 │                │   │
│   │       │  1. Pay back 15,000 DAI debt    │                │   │
│   │       │────────────────────────────────▶│                │   │
│   │       │                                 │                │   │
│   │       │  2. Receive ETH + 13% bonus     │                │   │
│   │       │◀────────────────────────────────│                │   │
│   │       │                                 │                │   │
│   │   Liquidator profit: ~$2,000            │                │   │
│   │   User loses collateral                 │                │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Stablecoin | Protocol | Collateral | Ratio |
|------------|----------|------------|-------|
| **DAI** | MakerDAO | ETH, stETH, RWA | 150%+ |
| **LUSD** | Liquity | ETH only | 110%+ |
| **crvUSD** | Curve | ETH, stETH, wBTC | Variable |
| **GHO** | Aave | Multi-asset | 130%+ |
| **sUSD** | Synthetix | SNX | 400%+ |

---

### 3. Algorithmic Stablecoins
Maintain peg through algorithms, not collateral.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALGORITHMIC MECHANISMS                        │
└─────────────────────────────────────────────────────────────────┘

MODEL 1: REBASE (Ampleforth)
────────────────────────────
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Price above $1:                    Price below $1:              │
│   ┌─────────────────────────┐       ┌─────────────────────────┐  │
│   │ Increase everyone's     │       │ Decrease everyone's     │  │
│   │ token balance           │       │ token balance           │  │
│   │                         │       │                         │  │
│   │ 100 AMPL → 105 AMPL    │       │ 100 AMPL → 95 AMPL     │  │
│   │ Price returns to $1     │       │ Price returns to $1     │  │
│   └─────────────────────────┘       └─────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


MODEL 2: SEIGNIORAGE (UST/LUNA - FAILED)
────────────────────────────────────────
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   MINT UST:                          REDEEM UST:                  │
│   ┌─────────────────────────┐       ┌─────────────────────────┐  │
│   │ Burn $1 of LUNA         │       │ Burn 1 UST              │  │
│   │      ↓                  │       │      ↓                  │  │
│   │ Mint 1 UST              │       │ Mint $1 of LUNA         │  │
│   └─────────────────────────┘       └─────────────────────────┘  │
│                                                                   │
│   DEATH SPIRAL:                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   1. UST depegs ($0.98)                                │    │
│   │   2. Arbitrageurs burn UST for LUNA                    │    │
│   │   3. LUNA supply explodes, price crashes               │    │
│   │   4. Confidence lost, more UST sold                    │    │
│   │   5. Spiral continues until worthless                  │    │
│   │                                                         │    │
│   │   Result: $40B wiped out in days                       │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


MODEL 3: FRACTIONAL (FRAX)
──────────────────────────
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Partially collateralized (50-100%)                              │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   To mint 1 FRAX:                                       │    │
│   │                                                         │    │
│   │   If 80% collateralized:                               │    │
│   │   • Deposit $0.80 USDC                                 │    │
│   │   • Deposit $0.20 worth of FXS (burned)                │    │
│   │                                                         │    │
│   │   Collateral ratio adjusts based on demand              │    │
│   │   More demand = lower collateral needed                 │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### 4. Yield-Bearing Stablecoins
Stablecoins that automatically earn yield.

```
┌─────────────────────────────────────────────────────────────────┐
│                    YIELD-BEARING STABLES                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                         sDAI (Spark)                               │
│                                                                    │
│   USER                     DSR CONTRACT                            │
│                                                                    │
│   ┌─────────┐            ┌───────────────┐                        │
│   │ Deposit │            │               │                        │
│   │ 10,000  │───────────▶│   DAI SAVINGS │                        │
│   │ DAI     │            │     RATE      │                        │
│   └─────────┘            │               │                        │
│       │                  │   Rate: 8%    │                        │
│       │                  │   APY         │                        │
│       ▼                  │               │                        │
│   ┌─────────┐            └───────────────┘                        │
│   │ Receive │                                                      │
│   │ 10,000  │   (balance stays same, value increases)             │
│   │ sDAI    │                                                      │
│   └─────────┘                                                      │
│       │                                                            │
│       │   After 1 year:                                            │
│       │   10,000 sDAI = 10,800 DAI                                │
│       │                                                            │
│       │   Use sDAI in DeFi (collateral, LP, etc.)                 │
│       │   While earning yield!                                     │
│       ▼                                                            │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


YIELD SOURCES:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │    sDAI/DSR     │  │    stUSDT       │  │    eUSD         │   │
│  │                 │  │                 │  │                 │   │
│  │ MakerDAO        │  │ Tether yield    │  │ Lybra Finance   │   │
│  │ protocol        │  │ products        │  │ (stETH-backed)  │   │
│  │ revenue         │  │                 │  │                 │   │
│  │                 │  │                 │  │                 │   │
│  │ ~8% APY         │  │ ~4% APY         │  │ ~6% APY         │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Stable | Protocol | Yield Source | APY |
|--------|----------|--------------|-----|
| **sDAI** | Spark/Maker | DSR | ~8% |
| **sfrxETH** | Frax | ETH staking | ~4% |
| **eUSD** | Lybra | stETH yield | ~6% |
| **stUSDT** | Tether | Investment | ~4% |

---

## Peg Maintenance Mechanisms

```
┌───────────────────────────────────────────────────────────────────┐
│                    HOW PEGS ARE MAINTAINED                         │
├─────────────────────┬─────────────────────────────────────────────┤
│                     │                                             │
│  FIAT-BACKED        │  • Direct redemption for $1                │
│  (USDC, USDT)       │  • Arbitrage: Buy at $0.99, redeem for $1  │
│                     │                                             │
├─────────────────────┼─────────────────────────────────────────────┤
│                     │                                             │
│  CRYPTO-BACKED      │  • Over-collateralization buffer           │
│  (DAI, LUSD)        │  • Liquidations restore ratio              │
│                     │  • PSM (Peg Stability Module) - DAI        │
│                     │                                             │
├─────────────────────┼─────────────────────────────────────────────┤
│                     │                                             │
│  ALGORITHMIC        │  • Mint/burn arbitrage                     │
│  (Historical)       │  • Relies on confidence (dangerous)        │
│                     │                                             │
└─────────────────────┴─────────────────────────────────────────────┘


DAI PEG STABILITY MODULE (PSM):
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                                                         │    │
│   │   DAI above $1.00:                                      │    │
│   │   • Deposit USDC → Get DAI at 1:1                      │    │
│   │   • Increases DAI supply → Price down                  │    │
│   │                                                         │    │
│   │   DAI below $1.00:                                      │    │
│   │   • Deposit DAI → Get USDC at 1:1                      │    │
│   │   • Decreases DAI supply → Price up                    │    │
│   │                                                         │    │
│   │   Small fee (0.1%) prevents gaming                     │    │
│   │                                                         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## De-Peg Case Studies

```
┌───────────────────────────────────────────────────────────────────┐
│                    MAJOR DE-PEG EVENTS                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  UST/LUNA COLLAPSE (May 2022)                                     │
│  ─────────────────────────────                                    │
│  • UST: $18B → $0                                                │
│  • LUNA: $40B → $0                                               │
│  • Cause: Death spiral, no real backing                          │
│  • Lesson: Pure algo stables are dangerous                       │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  USDC DEPEG (March 2023)                                         │
│  ───────────────────────                                         │
│  • Dropped to $0.87 briefly                                      │
│  • Cause: SVB bank collapse ($3.3B stuck)                       │
│  • Resolution: Fed backstop, funds recovered                     │
│  • Lesson: Bank risk affects even fiat-backed                    │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  DAI BLACK THURSDAY (March 2020)                                  │
│  ───────────────────────────────                                  │
│  • ETH crashed 50% in hours                                      │
│  • Liquidations failed (0 DAI bids)                              │
│  • $8M in undercollateralized debt                               │
│  • Resolution: Protocol auction, governance                       │
│  • Lesson: Need robust liquidation systems                       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Revenue Models

| Type | Revenue Source | Typical Range |
|------|----------------|---------------|
| **Fiat-backed** | Interest on reserves | 4-5% on reserves |
| **Crypto-backed** | Stability fees | 0.5-8% annual |
| **Yield-bearing** | Yield spread | 0.5-2% |

### Detailed Breakdown:

**Circle (USDC) model:**
```
Revenue Streams:
├── T-bill yield: ~5% on $25B = $1.25B/year
├── Float on pending settlements
├── API/enterprise services
└── Cross-chain fees

Very profitable in high interest rate environment
```

**MakerDAO (DAI) model:**
```
Revenue Streams:
├── Stability fees: Variable % on borrowed DAI
├── Liquidation penalties: 13%
├── RWA yield: Treasury bonds, etc.
├── PSM fees: 0.1%

Example:
├── $5B DAI outstanding
├── 4% average stability fee
├── Revenue: $200M/year + RWA yield
```

---

## Regulatory Landscape

```
┌───────────────────────────────────────────────────────────────────┐
│                    STABLECOIN REGULATION                           │
├─────────────────────┬─────────────────────────────────────────────┤
│ US                  │ Unclear, SEC/CFTC jurisdiction debate       │
│                     │ State money transmitter licenses            │
│                     │ Potential federal stablecoin bill           │
├─────────────────────┼─────────────────────────────────────────────┤
│ EU (MiCA)           │ Clear framework from 2024                   │
│                     │ Reserve requirements                        │
│                     │ Authorized issuer needed                    │
├─────────────────────┼─────────────────────────────────────────────┤
│ Singapore           │ MAS regulated                               │
│                     │ Clear stablecoin framework                  │
├─────────────────────┼─────────────────────────────────────────────┤
│ Japan               │ Banking license required                    │
│                     │ Strict reserve rules                        │
└─────────────────────┴─────────────────────────────────────────────┘
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/web3-projects.git
cd "web3-projects/Stablecoins"

# Explore categories
ls -la
```

---

<p align="center">
  <i>The foundation of DeFi - stable value in a volatile world.</i>
</p>
