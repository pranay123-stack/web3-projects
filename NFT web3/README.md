# NFT Web3 Projects

A comprehensive collection of NFT (Non-Fungible Token) projects covering the entire NFT ecosystem from marketplaces to infrastructure.

---

## Folder Structure

```
NFT web3/
├── NFT Marketplaces/           # Buy/sell platforms
├── NFT Launchpads/             # Minting & collection creation
├── NFT Aggregators/            # Multi-marketplace search
├── NFT Analytics/              # Floor tracking, rarity tools
├── NFT Trading Bots/           # Sniping, bidding automation
├── NFT Lending/                # NFT-collateralized loans
├── NFT Fractionalization/      # Shared ownership protocols
└── NFT Infrastructure/         # Metadata, storage, indexing
```

---

## NFT Ecosystem Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NFT ECOSYSTEM LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────────┘

  CREATE           MINT            TRADE           FINANCIALIZE      ANALYZE
    │                │               │                  │               │
    ▼                ▼               ▼                  ▼               ▼
┌────────┐     ┌──────────┐    ┌────────────┐    ┌───────────┐    ┌─────────┐
│ Artist │────▶│Launchpad │───▶│Marketplace │───▶│  Lending  │───▶│Analytics│
│ Creator│     │  Mint    │    │   Trade    │    │ Fraction  │    │ Rarity  │
└────────┘     └──────────┘    └────────────┘    └───────────┘    └─────────┘
                    │               │                  │               │
                    │               ▼                  │               │
                    │        ┌────────────┐            │               │
                    │        │ Aggregator │            │               │
                    │        │   Search   │            │               │
                    │        └────────────┘            │               │
                    │               │                  │               │
                    └───────────────┼──────────────────┘               │
                                    │                                  │
                                    ▼                                  │
                            ┌──────────────┐                          │
                            │ Trading Bots │◀─────────────────────────┘
                            │   Sniping    │
                            └──────────────┘
                                    │
                                    ▼
                            ┌──────────────┐
                            │Infrastructure│
                            │ IPFS/Arweave │
                            └──────────────┘
```

---

## Categories Explained

### 1. NFT Marketplaces
Platforms where users list, buy, sell, and auction NFTs.

```
┌─────────────────────────────────────────────────────────────────┐
│                     NFT MARKETPLACE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

  SELLER                    MARKETPLACE                    BUYER
    │                           │                            │
    │   List NFT + Set Price    │                            │
    │──────────────────────────▶│                            │
    │                           │                            │
    │                           │   Browse/Search NFTs       │
    │                           │◀───────────────────────────│
    │                           │                            │
    │                           │   Display Listings         │
    │                           │───────────────────────────▶│
    │                           │                            │
    │                           │   Place Bid / Buy Now      │
    │                           │◀───────────────────────────│
    │                           │                            │
    │              ┌────────────┴────────────┐               │
    │              │    SETTLEMENT           │               │
    │              │  ┌───────────────────┐  │               │
    │              │  │ Verify Ownership  │  │               │
    │              │  │ Transfer NFT      │  │               │
    │              │  │ Transfer Payment  │  │               │
    │              │  │ Deduct Fees       │  │               │
    │              │  │ Pay Royalties     │  │               │
    │              │  └───────────────────┘  │               │
    │              └─────────────────────────┘               │
    │                           │                            │
    │   Receive Payment - Fees  │   Receive NFT              │
    │◀──────────────────────────│───────────────────────────▶│
```

**Types of Marketplaces:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE TYPES                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   GENERAL       │   CURATED       │   CHAIN-SPECIFIC            │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ OpenSea         │ SuperRare       │ Magic Eden (Solana)         │
│ Blur            │ Foundation      │ Tensor (Solana)             │
│ Rarible         │ Nifty Gateway   │ Trove (Arbitrum)            │
│ LooksRare       │ KnownOrigin     │ tofuNFT (Multi-chain)       │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

**Real Products:**

| Product | Chain | Model | Volume |
|---------|-------|-------|--------|
| **OpenSea** | Multi-chain | 2.5% fee | Largest by listings |
| **Blur** | Ethereum | 0% fee + token incentives | Highest ETH volume |
| **Magic Eden** | Solana/Multi | 2% fee | Top Solana marketplace |
| **Tensor** | Solana | 1.5% fee | Pro traders focus |
| **LooksRare** | Ethereum | 2% fee | LOOKS token rewards |
| **X2Y2** | Ethereum | 0.5% fee | Low fee alternative |

---

### 2. NFT Launchpads
Platforms for creating and minting NFT collections.

```
┌─────────────────────────────────────────────────────────────────┐
│                     NFT LAUNCHPAD FLOW                           │
└─────────────────────────────────────────────────────────────────┘

  CREATOR                                              COLLECTOR
     │                                                      │
     │  1. Upload Art + Metadata                           │
     │─────────────────────┐                               │
     │                     ▼                               │
     │            ┌─────────────────┐                      │
     │            │   LAUNCHPAD     │                      │
     │            │                 │                      │
     │            │ ┌─────────────┐ │                      │
     │            │ │Upload Assets│ │                      │
     │            │ └──────┬──────┘ │                      │
     │            │        ▼        │                      │
     │            │ ┌─────────────┐ │                      │
     │            │ │Store to IPFS│ │                      │
     │            │ └──────┬──────┘ │                      │
     │            │        ▼        │                      │
     │            │ ┌─────────────┐ │                      │
     │            │ │Deploy Smart │ │                      │
     │            │ │  Contract   │ │                      │
     │            │ └──────┬──────┘ │                      │
     │            │        ▼        │                      │
     │            │ ┌─────────────┐ │   2. Mint NFT        │
     │            │ │ Mint Page   │◀├──────────────────────│
     │            │ │  Created    │ │                      │
     │            │ └─────────────┘ │                      │
     │            └─────────────────┘                      │
     │                     │                               │
     │  3. Royalties       │        4. Receive NFT         │
     │◀────────────────────┴──────────────────────────────▶│
```

**Mint Mechanisms:**
```
┌───────────────────────────────────────────────────────────────────┐
│                      MINT MECHANISMS                               │
├───────────────────┬───────────────────┬───────────────────────────┤
│    PUBLIC MINT    │   ALLOWLIST       │      AUCTION              │
├───────────────────┼───────────────────┼───────────────────────────┤
│ First come first  │ Whitelist-only    │ Dutch Auction             │
│ serve (FCFS)      │ access period     │ (Price decreases)         │
│                   │                   │                           │
│ Anyone can mint   │ Merkle proof      │ English Auction           │
│ at fixed price    │ verification      │ (Highest bid wins)        │
│                   │                   │                           │
│ Gas wars common   │ Reduces gas wars  │ Fair price discovery      │
└───────────────────┴───────────────────┴───────────────────────────┘
```

**Real Products:**

| Product | Chain | Features | Notable |
|---------|-------|----------|---------|
| **Manifold** | Ethereum | Custom contracts, royalties | Creator-owned contracts |
| **Zora** | Ethereum/Base | Protocol + marketplace | Open editions |
| **Metaplex** | Solana | Candy Machine, compression | Standard for Solana |
| **thirdweb** | Multi-chain | No-code deploy | Developer SDK |
| **Bueno** | Ethereum | Art generation + deploy | Generative collections |
| **Launchpad.xyz** | Multi-chain | White-label launchpad | B2B solution |

---

### 3. NFT Aggregators
Search and trade across multiple marketplaces in one interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFT AGGREGATOR FLOW                           │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │      USER       │
                        └────────┬────────┘
                                 │
                    Search: "Bored Ape #1234"
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      AGGREGATOR        │
                    │                        │
                    │  ┌──────────────────┐  │
                    │  │  Query All       │  │
                    │  │  Marketplaces    │  │
                    │  └────────┬─────────┘  │
                    └───────────┼────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │  OpenSea   │      │   Blur     │      │ LooksRare  │
    │  150 ETH   │      │  148 ETH   │      │  152 ETH   │
    └─────┬──────┘      └─────┬──────┘      └─────┬──────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                    ┌────────────────────────┐
                    │   DISPLAY RESULTS      │
                    │                        │
                    │   Blur: 148 ETH ✓ BEST │
                    │   OpenSea: 150 ETH     │
                    │   LooksRare: 152 ETH   │
                    │                        │
                    │   [BUY FROM BLUR]      │
                    └────────────────────────┘
```

**Aggregator Features:**
```
┌───────────────────────────────────────────────────────────────────┐
│                   AGGREGATOR FEATURES                              │
├─────────────────────┬─────────────────────────────────────────────┤
│ Price Comparison    │ Find best price across all marketplaces     │
├─────────────────────┼─────────────────────────────────────────────┤
│ Sweep Floor         │ Buy multiple NFTs in single transaction     │
├─────────────────────┼─────────────────────────────────────────────┤
│ Portfolio Tracking  │ Track all NFTs across wallets               │
├─────────────────────┼─────────────────────────────────────────────┤
│ Gas Optimization    │ Batch transactions to save gas              │
├─────────────────────┼─────────────────────────────────────────────┤
│ Collection Bidding  │ Place bids on entire collections            │
└─────────────────────┴─────────────────────────────────────────────┘
```

**Real Products:**

| Product | Chains | Key Feature | Fee |
|---------|--------|-------------|-----|
| **Blur** | Ethereum | Aggregator + Marketplace | 0% |
| **Reservoir** | Multi-chain | Aggregator Protocol/API | Developer tool |
| **Uniswap NFT** | Ethereum | Swap tokens + NFTs | No extra fee |
| **Gem** (now Blur) | Ethereum | Batch buying pioneer | Acquired |

---

### 4. NFT Analytics
Tools for tracking floor prices, rarity, whale movements, and market data.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFT ANALYTICS STACK                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │Blockchain│  │Marketplace│  │  Social  │  │   Metadata   │    │
│  │  Events  │  │   APIs   │  │  Signals │  │    IPFS      │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
└───────┼─────────────┼────────────┼────────────────┼────────────┘
        │             │            │                │
        └─────────────┴────────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYTICS ENGINE                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │    │
│  │   │   Rarity    │    │    Floor    │    │   Whale   │  │    │
│  │   │  Calculator │    │   Tracker   │    │  Tracker  │  │    │
│  │   └─────────────┘    └─────────────┘    └───────────┘  │    │
│  │                                                         │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │    │
│  │   │   Wash      │    │   Holder    │    │   Mint    │  │    │
│  │   │  Detection  │    │  Analysis   │    │  Tracker  │  │    │
│  │   └─────────────┘    └─────────────┘    └───────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER OUTPUTS                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Dashboards  │  │   Alerts    │  │        API Access       │  │
│  │ & Charts    │  │   & Bots    │  │   (for trading bots)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Rarity Calculation:**
```
┌───────────────────────────────────────────────────────────────────┐
│                    RARITY SCORING METHODS                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   STATISTICAL RARITY:                                             │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │ Trait Rarity = (# with trait) / (total supply)          │    │
│   │                                                         │    │
│   │ Example: Gold Background                                │    │
│   │ 50 NFTs have gold / 10,000 total = 0.5% = RARE         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│   RARITY SCORE:                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │ Score = Sum of (1 / trait_rarity) for all traits        │    │
│   │                                                         │    │
│   │ Higher score = More rare combination                    │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Product | Focus | Features | Pricing |
|---------|-------|----------|---------|
| **NFTGo** | Analytics | Rarity, whales, portfolio | Free + Pro |
| **Rarity Sniper** | Rarity | Rankings, alerts | Free |
| **Icy Tools** | Trading | Real-time, alpha | $99-299/mo |
| **Dune Analytics** | Custom | SQL queries on NFT data | Free + Teams |
| **Nansen** | Whale tracking | Smart money, labels | $150-2500/mo |
| **CryptoSlam** | Rankings | Volume, sales tracking | Free |

---

### 5. NFT Trading Bots
Automated tools for sniping, bidding, and trading NFTs.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFT SNIPING BOT FLOW                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     MEMPOOL MONITORING                           │
│                                                                  │
│    Pending Tx: "List BAYC #1234 for 50 ETH"                     │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BOT EVALUATION                               │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. Check rarity score: #1234 = Rank 152 (TOP 2%)       │   │
│   │ 2. Check floor price: Collection floor = 65 ETH         │   │
│   │ 3. Calculate profit: 65 - 50 = 15 ETH potential        │   │
│   │ 4. Risk assessment: High liquidity = LOW RISK          │   │
│   │ 5. Decision: BUY ✓                                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXECUTE SNIPE                                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ • Set gas price: 150 gwei (higher than listing tx)     │   │
│   │ • Submit buy transaction                                │   │
│   │ • Monitor for confirmation                              │   │
│   │ • If fail → retry with higher gas                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     POST-SNIPE ACTION                            │
│                                                                  │
│   Option A: HODL for appreciation                               │
│   Option B: Instant flip at floor (15 ETH profit - gas)         │
│   Option C: List slightly below floor for quick sale            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Bot Types:**
```
┌───────────────────────────────────────────────────────────────────┐
│                      NFT BOT TYPES                                 │
├─────────────────┬─────────────────────────────────────────────────┤
│ SNIPING BOT     │ Buy underpriced listings instantly              │
├─────────────────┼─────────────────────────────────────────────────┤
│ BIDDING BOT     │ Auto-place collection offers, manage bids       │
├─────────────────┼─────────────────────────────────────────────────┤
│ MINT BOT        │ Auto-mint new collections at launch             │
├─────────────────┼─────────────────────────────────────────────────┤
│ SWEEP BOT       │ Buy multiple floor NFTs quickly                 │
├─────────────────┼─────────────────────────────────────────────────┤
│ TRAIT SNIPER    │ Target specific rare traits below value         │
├─────────────────┼─────────────────────────────────────────────────┤
│ ARBITRAGE BOT   │ Buy on one marketplace, sell on another         │
└─────────────────┴─────────────────────────────────────────────────┘
```

**Key Components:**
```
NFT Trading Bot Architecture:
├── Data Layer
│   ├── Marketplace APIs (OpenSea, Blur, etc.)
│   ├── Rarity data feeds
│   └── Price history database
├── Analysis Engine
│   ├── Fair value calculator
│   ├── Rarity scorer
│   └── Profit estimator
├── Execution Layer
│   ├── Gas optimizer
│   ├── Multi-marketplace executor
│   └── Retry logic
└── Risk Management
    ├── Position limits
    ├── Loss limits
    └── Liquidity checks
```

---

### 6. NFT Lending
Platforms for borrowing against NFTs or lending to earn yield.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFT LENDING MODELS                            │
└─────────────────────────────────────────────────────────────────┘

MODEL 1: PEER-TO-PEER (NFTfi)
─────────────────────────────
┌──────────┐                              ┌──────────┐
│ BORROWER │                              │  LENDER  │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  1. List NFT as collateral              │
     │──────────────────┐                      │
     │                  ▼                      │
     │         ┌───────────────┐               │
     │         │   PROTOCOL    │               │
     │         │               │               │
     │         │ NFT escrowed  │◀──────────────│
     │         │               │   2. Make     │
     │         │ Loan terms:   │      loan     │
     │         │ • 50 ETH      │      offer    │
     │         │ • 30 days     │               │
     │         │ • 20% APR     │               │
     │         └───────────────┘               │
     │                  │                      │
     │◀─────────────────│──────────────────────│
     │   3. Accept offer, receive 50 ETH       │
     │                                         │
     │   4a. Repay 50 ETH + interest           │
     │──────────────────┬─────────────────────▶│
     │                  │                      │
     │   Get NFT back   │    Receive repayment │
     │◀─────────────────┘                      │
     │                                         │
     │   4b. DEFAULT (don't repay)             │
     │                  │                      │
     │   Lose NFT       │    Claim NFT         │
     │                  └─────────────────────▶│


MODEL 2: PEER-TO-POOL (BendDAO)
───────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   LENDERS                        BORROWERS                       │
│   ┌─────┐ ┌─────┐ ┌─────┐       ┌─────┐ ┌─────┐ ┌─────┐        │
│   │ ETH │ │ ETH │ │ ETH │       │ NFT │ │ NFT │ │ NFT │        │
│   └──┬──┘ └──┬──┘ └──┬──┘       └──┬──┘ └──┬──┘ └──┬──┘        │
│      │       │       │             │       │       │            │
│      └───────┼───────┘             └───────┼───────┘            │
│              │                             │                    │
│              ▼                             ▼                    │
│      ┌───────────────┐            ┌───────────────┐            │
│      │  LENDING POOL │            │  NFT COLLAT   │            │
│      │   100 ETH     │◀──────────▶│   VAULT       │            │
│      └───────────────┘  Borrow    └───────────────┘            │
│              │          against                                 │
│              ▼          floor                                   │
│      ┌───────────────┐                                         │
│      │ Interest Rate │                                         │
│      │ Based on      │                                         │
│      │ Utilization   │                                         │
│      └───────────────┘                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


MODEL 3: BUY NOW PAY LATER (Blur Blend)
───────────────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   BUYER                           SELLER                         │
│     │                               │                            │
│     │  Want to buy NFT: 100 ETH     │                            │
│     │  Only have: 50 ETH            │                            │
│     │                               │                            │
│     │           ┌───────────────────┴─────────────┐              │
│     │           │         BLEND PROTOCOL          │              │
│     │           │                                 │              │
│     │           │  1. Buyer puts 50 ETH down      │              │
│     │           │  2. Protocol lends 50 ETH       │              │
│     │           │  3. Seller gets 100 ETH         │              │
│     │           │  4. Buyer gets NFT (escrowed)   │              │
│     │           │  5. Buyer repays over time      │              │
│     │           │                                 │              │
│     │           └─────────────────────────────────┘              │
│     │                                                            │
│     │  If default → NFT liquidated                               │
│     │                                                            │
└──────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Product | Model | LTV | Interest | Chain |
|---------|-------|-----|----------|-------|
| **NFTfi** | Peer-to-Peer | Negotiated | 20-100% APR | Ethereum |
| **Blur Blend** | BNPL | Up to 100% | Variable | Ethereum |
| **BendDAO** | Peer-to-Pool | 30-40% floor | Dynamic | Ethereum |
| **Arcade** | P2P + Bundles | Negotiated | Market rate | Ethereum |
| **Sharky** | P2P | Up to 50% | Market rate | Solana |
| **Citrus** | P2P | Variable | Market rate | Solana |

---

### 7. NFT Fractionalization
Split NFT ownership into tradeable tokens.

```
┌─────────────────────────────────────────────────────────────────┐
│                  NFT FRACTIONALIZATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

STEP 1: LOCK NFT
────────────────
┌──────────┐         ┌─────────────────┐
│  Owner   │────────▶│   Fractional    │
│          │  Lock   │    Protocol     │
│ BAYC#123 │  NFT    │                 │
└──────────┘         │  ┌───────────┐  │
                     │  │ NFT Vault │  │
                     │  │ BAYC#123  │  │
                     │  └───────────┘  │
                     └─────────────────┘

STEP 2: MINT FRACTIONS
──────────────────────
┌─────────────────┐
│   Fractional    │
│    Protocol     │
│                 │
│  ┌───────────┐  │
│  │ Create    │  │       ┌─────────────────────────────────┐
│  │ 10,000    │──┼──────▶│         FRACTION TOKENS         │
│  │ $BAYC123  │  │       │                                 │
│  │ tokens    │  │       │  [1000] [1000] [1000] ... [1000]│
│  └───────────┘  │       │                                 │
│                 │       │   Each token = 0.01% ownership  │
└─────────────────┘       └─────────────────────────────────┘

STEP 3: TRADE FRACTIONS
───────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                         DEX / AMM                                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              $BAYC123 / ETH POOL                        │   │
│   │                                                         │   │
│   │    Anyone can buy/sell fractions                        │   │
│   │    Price determined by market                           │   │
│   │                                                         │   │
│   │    1 token = 0.01 ETH → Full NFT implied = 100 ETH     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

STEP 4: BUYOUT MECHANISM
────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│                      BUYOUT AUCTION                              │
│                                                                  │
│   Buyer wants whole NFT:                                         │
│   1. Start buyout at reserve price (e.g., 120 ETH)              │
│   2. Fraction holders can:                                       │
│      a) Accept → sell fractions at buyout price                 │
│      b) Reject → vote against, raise reserve                    │
│   3. If buyout succeeds → NFT released to buyer                 │
│   4. Fraction holders receive ETH proportionally                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Use Cases:**
```
┌───────────────────────────────────────────────────────────────────┐
│                FRACTIONALIZATION USE CASES                         │
├─────────────────────┬─────────────────────────────────────────────┤
│ Affordable Access   │ Own part of expensive blue-chip NFTs        │
├─────────────────────┼─────────────────────────────────────────────┤
│ Price Discovery     │ Market determines fair value continuously   │
├─────────────────────┼─────────────────────────────────────────────┤
│ Liquidity           │ Trade fractions 24/7 vs. illiquid NFT      │
├─────────────────────┼─────────────────────────────────────────────┤
│ DAO Treasury        │ DAOs can collectively own valuable NFTs     │
├─────────────────────┼─────────────────────────────────────────────┤
│ Collateralization   │ Use fractions as DeFi collateral           │
└─────────────────────┴─────────────────────────────────────────────┘
```

**Real Products:**

| Product | Status | Model | Chain |
|---------|--------|-------|-------|
| **Tessera** (fka Fractional) | Shut down 2023 | Vault + ERC20 | Ethereum |
| **Unicly** | Active | uToken collections | Ethereum |
| **NFTX** | Active | Vault + index token | Ethereum |
| **Bridgesplit** | Active | Fractions + lending | Solana |

---

### 8. NFT Infrastructure
Backend services, storage, and developer tools.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFT INFRASTRUCTURE STACK                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                          │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│   │Marketplace│  │ Portfolio │  │  Minting  │  │  Trading  │   │
│   │   dApp    │  │  Tracker  │  │   dApp    │  │    Bot    │   │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
└─────────┼──────────────┼──────────────┼──────────────┼──────────┘
          │              │              │              │
          └──────────────┴──────────────┴──────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    NFT DATA APIs                        │   │
│   │                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│   │  │  SimpleHash │  │  Reservoir  │  │   Alchemy   │    │   │
│   │  │   NFT API   │  │  Protocol   │  │   NFT API   │    │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       INDEXING LAYER                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      INDEXERS                           │   │
│   │                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│   │  │  The Graph  │  │   Subsquid  │  │  Custom     │    │   │
│   │  │  Subgraphs  │  │   Squids    │  │  Indexer    │    │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  DECENTRALIZED STORAGE                  │   │
│   │                                                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│   │  │    IPFS     │  │   Arweave   │  │  Filecoin   │    │   │
│   │  │  (Pinata)   │  │  (Permanent)│  │  (Compute)  │    │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                            │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│   │  Ethereum   │  │   Solana    │  │    L2s (Base,       │    │
│   │  ERC-721    │  │   Metaplex  │  │    Arbitrum, etc.)  │    │
│   │  ERC-1155   │  │   Standard  │  │                     │    │
│   └─────────────┘  └─────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Infrastructure Components:**

| Component | What It Does | Products |
|-----------|--------------|----------|
| **Metadata Storage** | Store images, attributes | IPFS, Arweave, Pinata |
| **NFT APIs** | Query NFT data | SimpleHash, Alchemy, Moralis |
| **Indexers** | Track on-chain events | The Graph, Subsquid |
| **Rendering** | Display NFT images | Cloudinary, imgix |
| **Standards** | Token contracts | ERC-721, ERC-1155, Metaplex |
| **Royalty Enforcement** | On-chain royalties | Limit Break, OpenSea |

---

## Chain Compatibility

| Chain | Standard | Top Marketplace | Launchpad |
|-------|----------|-----------------|-----------|
| **Ethereum** | ERC-721/1155 | Blur, OpenSea | Manifold, Zora |
| **Solana** | Metaplex | Tensor, Magic Eden | Candy Machine |
| **Polygon** | ERC-721/1155 | OpenSea | thirdweb |
| **Base** | ERC-721/1155 | OpenSea, Zora | Zora |
| **Arbitrum** | ERC-721/1155 | Trove | thirdweb |
| **Bitcoin** | Ordinals | Magic Eden | Various |

---

## Revenue Models

| Category | Revenue Source | Typical Range |
|----------|----------------|---------------|
| **Marketplaces** | Trading fees, royalties | 0-2.5% per sale |
| **Launchpads** | Minting fees, % of mint | 2-5% of mint revenue |
| **Aggregators** | Referral fees, premium features | 0-0.5% |
| **Analytics** | Subscriptions, API access | $20-500/month |
| **Trading Bots** | Subscription, % of profits | $50-500/month |
| **Lending** | Interest spread, origination fees | 5-20% of interest |
| **Fractionalization** | Vault fees, buyout fees | 2-5% |
| **Infrastructure** | API calls, storage fees | Usage-based |

### Detailed Breakdown:

**Marketplaces (OpenSea model):**
```
Revenue Streams:
├── Trading fee: 2.5% on every sale
├── Optional creator royalties (enforced)
└── Featured/promoted listings

Example: OpenSea
├── 2.5% fee on $100M monthly volume = $2.5M/month
└── At peak: $3B+ monthly volume = $75M+/month
```

**NFT Lending (NFTfi model):**
```
Revenue Streams:
├── Origination fee: 5% of interest paid
├── Protocol fee on liquidations
└── Governance token value

Example: NFTfi
├── $10M in loans, avg 30% APR
├── Interest: $3M annually
├── Protocol take: 5% = $150K/year
└── Plus liquidation revenue
```

**Analytics (Icy Tools model):**
```
Revenue Streams:
├── Subscription tiers: $99-299/month
├── API access: Usage-based pricing
├── Whale alerts: Premium feature
└── Trading signals: Alpha calls

Example:
├── 1000 premium users × $150/month = $150K/month
├── API customers: $50K/month
└── Total: ~$200K/month
```

**NFT APIs (SimpleHash model):**
```
Revenue Streams:
├── Free tier: Limited calls
├── Starter: $99/month (100K calls)
├── Growth: $499/month (1M calls)
├── Enterprise: Custom pricing
└── Overage fees

Example:
├── 100 Growth customers × $499 = $49,900/month
├── Enterprise deals: $100K+/month
└── Growing with NFT ecosystem
```

---

## Key Technical Concepts

### NFT Standards
```
ERC-721 (Ethereum)
├── One token = One unique NFT
├── Each token has unique ID
└── Standard: ownerOf(), transferFrom(), approve()

ERC-1155 (Ethereum)
├── Multi-token standard
├── Fungible + Non-fungible in same contract
└── Batch transfers (gas efficient)

Metaplex (Solana)
├── Metadata accounts
├── Candy Machine (minting)
├── Compressed NFTs (cNFTs)
└── Programmable NFTs (pNFTs)
```

### Royalty Enforcement
```
Traditional (Optional):
├── Royalty set in metadata
├── Marketplaces honor voluntarily
└── Easy to bypass (transfer vs. sale)

Enforced (Limit Break / OpenSea):
├── On-chain transfer restrictions
├── Only approved operators can transfer
├── Royalties paid automatically
└── Tradeoff: Less composability
```

### Compressed NFTs (Solana)
```
Traditional NFT:
├── Each mint = new on-chain account
├── Cost: ~0.01 SOL per NFT
└── 1M NFTs = 10,000 SOL (~$1M)

Compressed NFT (cNFT):
├── Merkle tree stores data
├── Only root hash on-chain
├── Cost: ~0.00001 SOL per NFT
└── 1M NFTs = 10 SOL (~$1,000)
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/web3-projects.git
cd "web3-projects/NFT web3"

# Explore categories
ls -la

# Each subfolder will contain:
# - Smart contracts
# - Backend services
# - Frontend code
# - Documentation
```

---

<p align="center">
  <i>From minting to trading to DeFi integration - the complete NFT stack.</i>
</p>
