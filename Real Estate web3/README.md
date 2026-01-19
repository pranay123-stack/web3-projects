# Real Estate Web3 Projects

This folder contains real estate blockchain projects organized by functionality. The structure is **chain-agnostic** - the same categories apply to Ethereum, Polygon, Solana, Avalanche, and any other blockchain supporting smart contracts.

## Folder Structure

```
Real Estate web3/
├── Tokenized Properties/      <- Fractional ownership, RWA tokenization (ERC-3643)
├── Property Marketplaces/     <- NFT-based property trading platforms
├── REITs on Chain/            <- Blockchain-based Real Estate Investment Trusts
├── Property Management/       <- Rent collection, maintenance, tenant management
├── Title and Deed NFTs/       <- Property ownership records as NFTs
└── Real Estate Lending/       <- Property-backed DeFi loans
```

---

## The Real Estate Tokenization Lifecycle

```
TOKENIZE -> LIST -> TRADE -> MANAGE -> YIELD -> EXIT
    |        |        |         |        |        |
    v        v        v         v        v        v
Tokenized  Property  Property  Property  REITs   Real Estate
Properties Marketplace Trading  Mgmt    on Chain  Lending
                                         |
                                         v
                                 Title & Deed NFTs
```

### Lifecycle Stages:

| Stage | What Happens | Who Does It |
|-------|--------------|-------------|
| **Tokenize** | Convert property ownership to blockchain tokens | Property owners, Tokenization platforms |
| **List** | List tokenized property for sale/investment | Property owners, Marketplaces |
| **Trade** | Buy/sell property tokens or whole properties | Investors, Traders |
| **Manage** | Handle rent, maintenance, tenant relations | Property managers, Smart contracts |
| **Yield** | Distribute rental income to token holders | REITs, Dividend contracts |
| **Exit** | Sell tokens, refinance, or liquidate | Investors, Lending protocols |

---

## Detailed Folder Descriptions

### 1. Tokenized Properties

Platforms for converting real estate ownership into tradeable blockchain tokens with regulatory compliance.

**Examples:** RealT, Lofty AI, Securitize, Polymath

**What you'd build:**
- ERC-3643 (T-REX) security tokens
- Fractional ownership contracts
- KYC/AML identity registry
- Compliance modules
- Dividend distribution system

**Visual Flow:**
```
+-------------------------------------------------------------+
|              PROPERTY TOKENIZATION FLOW                      |
+-------------------------------------------------------------+
|                                                              |
|   PROPERTY OWNER                                             |
|        |                                                     |
|        v                                                     |
|   +-------------+                                            |
|   |  Property   |                                            |
|   |  Valuation  |                                            |
|   |  ($1M)      |                                            |
|   +------+------+                                            |
|          |                                                   |
|          v                                                   |
|   +-----------------------------------------------------+   |
|   |              TOKENIZATION ENGINE                     |   |
|   |                                                      |   |
|   |   Property Value: $1,000,000                        |   |
|   |   Token Supply:   1,000,000 tokens                  |   |
|   |   Price per Token: $1.00                            |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |          TOKEN STRUCTURE                    |   |   |
|   |   |                                             |   |   |
|   |   |   [====================================]    |   |   |
|   |   |   |  1 Token = 0.0001% Ownership        |   |   |   |
|   |   |   |  1000 Tokens = 0.1% Ownership       |   |   |   |
|   |   |   |  10,000 Tokens = 1% Ownership       |   |   |   |
|   |   |   [====================================]    |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|          |                                                   |
|          v                                                   |
|   +-------------+    +-------------+    +-------------+     |
|   |    KYC      |    | Compliance  |    |  Security   |     |
|   |   Check     |--->|   Module    |--->|   Token     |     |
|   | (Identity)  |    | (Transfer   |    |  (ERC-3643) |     |
|   |             |    |  Rules)     |    |             |     |
|   +-------------+    +-------------+    +-------------+     |
|                                               |              |
|                                               v              |
|                                      +-------------+        |
|                                      |  Investor   |        |
|                                      |  Wallets    |        |
|                                      +-------------+        |
|                                                              |
+-------------------------------------------------------------+
```

**Key Mechanics:**

```
Fractional Ownership Structure:
--------------------------------
$1M Property = 1,000,000 Tokens

Investor A buys 10,000 tokens ($10,000)
  -> Owns 1% of property
  -> Receives 1% of rental income
  -> Can sell anytime on secondary market

Token Benefits:
  + Low entry barrier ($50-100 minimum)
  + Instant liquidity (trade 24/7)
  + Automatic dividend distribution
  + Transparent ownership records
```

**Compliance Features:**

| Feature | Description |
|---------|-------------|
| **KYC Registry** | Verify investor identity before purchase |
| **Accreditation Check** | Ensure investor meets SEC requirements |
| **Transfer Restrictions** | Block transfers to non-compliant wallets |
| **Holding Period** | Enforce minimum hold time (e.g., 12 months) |
| **Country Restrictions** | Block investors from certain jurisdictions |
| **Max Investor Limit** | Cap number of token holders (e.g., 99 for Reg D) |

---

### 2. Property Marketplaces

Decentralized marketplaces for buying, selling, and trading tokenized real estate.

**Examples:** Propy, RealtyBits, Fraction, Meridio

**What you'd build:**
- Property NFT minting
- Listing and auction mechanisms
- Escrow contracts
- Offer/bid systems
- Multi-currency payments

**Visual Flow:**
```
+-------------------------------------------------------------+
|              PROPERTY MARKETPLACE FLOW                       |
+-------------------------------------------------------------+
|                                                              |
|   SELLER                           BUYER                     |
|     |                                |                       |
|     v                                |                       |
|   +-------------+                    |                       |
|   |   Mint      |                    |                       |
|   |  Property   |                    |                       |
|   |    NFT      |                    |                       |
|   +------+------+                    |                       |
|          |                           |                       |
|          v                           |                       |
|   +-------------+                    |                       |
|   |   List on   |                    |                       |
|   | Marketplace |                    |                       |
|   | ($500,000)  |                    |                       |
|   +------+------+                    |                       |
|          |                           |                       |
|          |     +-----------------+   |                       |
|          +---->|                 |<--+                       |
|                |  MARKETPLACE   |                            |
|                |                 |                            |
|   +-----------------------------------------------------+   |
|   |                                                      |   |
|   |   +-------------+    +-------------+                |   |
|   |   |   FIXED     |    |   AUCTION   |                |   |
|   |   |   PRICE     |    |   BIDDING   |                |   |
|   |   | Buy Now     |    | Start: $400K|                |   |
|   |   | $500,000    |    | Current:$475K|               |   |
|   |   +-------------+    +-------------+                |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |              ESCROW CONTRACT                |   |   |
|   |   |                                             |   |   |
|   |   |   1. Buyer deposits funds                   |   |   |
|   |   |   2. Inspection period (7 days)            |   |   |
|   |   |   3. Title verification                    |   |   |
|   |   |   4. Funds released to seller              |   |   |
|   |   |   5. NFT transferred to buyer              |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                           |                                  |
|                           v                                  |
|                  +------------------+                        |
|                  |  NFT Ownership   |                        |
|                  |   Transferred    |                        |
|                  +------------------+                        |
|                                                              |
+-------------------------------------------------------------+
```

**Marketplace Features:**

| Feature | Description |
|---------|-------------|
| **Fixed Price** | Instant purchase at listed price |
| **English Auction** | Ascending bid, highest wins |
| **Dutch Auction** | Price decreases until buyer accepts |
| **Offer System** | Make offers on any listed property |
| **Escrow** | Secure fund holding during transaction |
| **Multi-token Payment** | Pay with ETH, USDC, USDT, DAI |

---

### 3. REITs on Chain

Blockchain-based Real Estate Investment Trusts for pooled property investment.

**Examples:** RealtyMogul, RedSwan, SolidBlock, AssetBlock

**What you'd build:**
- REIT token contracts
- Property portfolio management
- Automated dividend distribution
- NAV (Net Asset Value) calculation
- Governance voting

**Visual Flow:**
```
+-------------------------------------------------------------+
|                    REIT ON CHAIN FLOW                        |
+-------------------------------------------------------------+
|                                                              |
|   INVESTORS                                                  |
|   +------+  +------+  +------+  +------+                    |
|   |Inv A |  |Inv B |  |Inv C |  |Inv D |                    |
|   |$10K  |  |$50K  |  |$25K  |  |$15K  |                    |
|   +--+---+  +--+---+  +--+---+  +--+---+                    |
|      |         |         |         |                        |
|      +----+----+----+----+----+----+                        |
|           |                                                  |
|           v                                                  |
|   +-----------------------------------------------------+   |
|   |                   REIT POOL                          |   |
|   |                   Total: $100K                       |   |
|   |                                                      |   |
|   |   +-----------+  +-----------+  +-----------+       |   |
|   |   | Property 1|  | Property 2|  | Property 3|       |   |
|   |   | Apartment |  | Office    |  | Retail    |       |   |
|   |   | $500K     |  | $750K     |  | $300K     |       |   |
|   |   | Yield: 8% |  | Yield: 6% |  | Yield: 9% |       |   |
|   |   +-----------+  +-----------+  +-----------+       |   |
|   |                                                      |   |
|   |   Portfolio Value: $1,550,000                       |   |
|   |   Average Yield: 7.3%                               |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|           |                                                  |
|           v                                                  |
|   +-----------------------------------------------------+   |
|   |              DIVIDEND DISTRIBUTION                   |   |
|   |                                                      |   |
|   |   Monthly Rental Income: $9,500                     |   |
|   |   - Management Fee (10%): -$950                     |   |
|   |   - Maintenance Reserve: -$500                      |   |
|   |   ---------------------------------                 |   |
|   |   Distributable: $8,050                             |   |
|   |                                                      |   |
|   |   Investor A (10%): $805                            |   |
|   |   Investor B (50%): $4,025                          |   |
|   |   Investor C (25%): $2,012.50                       |   |
|   |   Investor D (15%): $1,207.50                       |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
```

**REIT Token Mechanics:**

```
NAV Calculation:
----------------
Property Value:     $1,550,000
+ Cash Reserves:       $50,000
- Liabilities:       -$100,000
= Net Asset Value:  $1,500,000

Token Supply: 1,500,000
NAV per Token: $1.00

Token price may trade at premium/discount to NAV
```

---

### 4. Property Management

On-chain systems for managing rental properties, collecting rent, and handling maintenance.

**Examples:** ManageGo, Rentberry, Rentible

**What you'd build:**
- Rent collection contracts
- Security deposit escrow
- Maintenance request system
- Tenant reputation scoring
- Lease agreement NFTs

**Visual Flow:**
```
+-------------------------------------------------------------+
|              PROPERTY MANAGEMENT FLOW                        |
+-------------------------------------------------------------+
|                                                              |
|   PROPERTY OWNER          TENANT                            |
|        |                     |                               |
|        v                     v                               |
|   +-------------+    +-------------+                        |
|   |   Create    |    |   Apply     |                        |
|   |   Listing   |    |   for Rent  |                        |
|   +------+------+    +------+------+                        |
|          |                  |                                |
|          +--------+---------+                                |
|                   |                                          |
|                   v                                          |
|   +-----------------------------------------------------+   |
|   |              SMART LEASE CONTRACT                    |   |
|   |                                                      |   |
|   |   Property: 123 Main St, Apt 4B                     |   |
|   |   Monthly Rent: $2,000 USDC                         |   |
|   |   Security Deposit: $4,000 USDC (Escrowed)         |   |
|   |   Lease Term: 12 months                             |   |
|   |   Due Date: 1st of each month                       |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |           AUTOMATED ACTIONS                 |   |   |
|   |   |                                             |   |   |
|   |   |   Day 1:  Rent due reminder                |   |   |
|   |   |   Day 1:  Auto-debit if approved           |   |   |
|   |   |   Day 5:  Late fee ($100) if unpaid        |   |   |
|   |   |   Day 15: Notice to landlord               |   |   |
|   |   |   Day 30: Initiate eviction process        |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                   |                                          |
|                   v                                          |
|   +-----------------------------------------------------+   |
|   |              MAINTENANCE SYSTEM                      |   |
|   |                                                      |   |
|   |   +-------------+    +-------------+                |   |
|   |   |   Tenant    |    | Contractor  |                |   |
|   |   |   Request   |--->|   Assigned  |                |   |
|   |   |  (Broken AC)|    | (HVAC Pro)  |                |   |
|   |   +-------------+    +------+------+                |   |
|   |                             |                        |   |
|   |                             v                        |   |
|   |                      +-------------+                |   |
|   |                      |   Payment   |                |   |
|   |                      |   Release   |                |   |
|   |                      |   ($500)    |                |   |
|   |                      +-------------+                |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
```

**Management Features:**

| Feature | Description |
|---------|-------------|
| **Auto Rent Collection** | Scheduled USDC/ETH transfers |
| **Late Fee Automation** | Automatic penalty for late payments |
| **Security Deposit Escrow** | Funds locked until lease end |
| **Maintenance Escrow** | Pay contractors upon completion |
| **Tenant Scoring** | On-chain payment history reputation |
| **Lease NFTs** | Transferable lease agreements |

---

### 5. Title and Deed NFTs

NFT-based property ownership records and title management.

**Examples:** Propy, Landshare, Tezos Title Records

**What you'd build:**
- Title/Deed NFT contracts
- Ownership history tracking
- Lien recording system
- Title insurance integration
- Government registry bridges

**Visual Flow:**
```
+-------------------------------------------------------------+
|                  TITLE AND DEED NFT FLOW                     |
+-------------------------------------------------------------+
|                                                              |
|   TRADITIONAL TITLE                 BLOCKCHAIN TITLE         |
|                                                              |
|   +---------------------+     +---------------------------+  |
|   |   Paper Deed        |     |      Title NFT            |  |
|   |   (County Records)  |     |                           |  |
|   |                     |     |   Token ID: #12345        |  |
|   |   - Filed manually  |     |   Property: 123 Main St   |  |
|   |   - Slow to verify  |     |   Owner: 0x7a3b...9f2c   |  |
|   |   - Can be forged   |     |   Recorded: Block #1234   |  |
|   |   - $500+ title     |     |                           |  |
|   |     search          |     |   +-------------------+   |  |
|   |                     |     |   | OWNERSHIP HISTORY |   |  |
|   +---------------------+     |   |                   |   |  |
|                               |   | 2024: 0x7a3b...   |   |  |
|                               |   | 2020: 0x4c2d...   |   |  |
|                               |   | 2015: 0x8e1f...   |   |  |
|                               |   | 2008: 0x2a9b...   |   |  |
|                               |   +-------------------+   |  |
|                               |                           |  |
|                               +---------------------------+  |
|                                                              |
|   +-----------------------------------------------------+   |
|   |              TITLE TRANSFER PROCESS                  |   |
|   |                                                      |   |
|   |   SELLER                    BUYER                   |   |
|   |     |                         |                      |   |
|   |     v                         v                      |   |
|   |   +-------+    +-------+    +-------+    +-------+  |   |
|   |   | List  |--->|Escrow |--->|Verify |--->|Transfer| |   |
|   |   | NFT   |    |Funds  |    |Title  |    |NFT     | |   |
|   |   +-------+    +-------+    +-------+    +-------+  |   |
|   |                               |                      |   |
|   |                               v                      |   |
|   |                        +-------------+              |   |
|   |                        |   CHECKS    |              |   |
|   |                        |             |              |   |
|   |                        | - No liens  |              |   |
|   |                        | - Clear     |              |   |
|   |                        |   ownership |              |   |
|   |                        | - No        |              |   |
|   |                        |   disputes  |              |   |
|   |                        +-------------+              |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                                                              |
|   +-----------------------------------------------------+   |
|   |                    LIEN SYSTEM                       |   |
|   |                                                      |   |
|   |   Title NFT #12345                                  |   |
|   |   +---------------------------------------------+   |   |
|   |   |                                             |   |   |
|   |   |   LIENS ATTACHED:                           |   |   |
|   |   |   +---------------------------------------+ |   |   |
|   |   |   | Mortgage Lien                         | |   |   |
|   |   |   | Holder: 0xBank...                     | |   |   |
|   |   |   | Amount: $300,000                      | |   |   |
|   |   |   | Priority: 1                           | |   |   |
|   |   |   +---------------------------------------+ |   |   |
|   |   |   | Property Tax Lien                     | |   |   |
|   |   |   | Holder: 0xCounty...                   | |   |   |
|   |   |   | Amount: $5,000                        | |   |   |
|   |   |   | Priority: 2                           | |   |   |
|   |   |   +---------------------------------------+ |   |   |
|   |   |                                             |   |   |
|   |   |   Transfer blocked until liens cleared     |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
```

**Title NFT Benefits:**

| Traditional | Blockchain |
|-------------|------------|
| Days to verify | Instant verification |
| $500+ title search | Near-zero cost lookup |
| Paper can be forged | Cryptographically secure |
| Manual record keeping | Automatic history |
| Multiple databases | Single source of truth |
| Title insurance required | Reduced insurance needs |

---

### 6. Real Estate Lending

DeFi protocols for property-backed loans and mortgages.

**Examples:** Centrifuge, TrueFi, Goldfinch, Credix

**What you'd build:**
- Mortgage origination contracts
- Property collateral vaults
- Interest rate models
- Loan-to-value monitoring
- Liquidation mechanisms

**Visual Flow:**
```
+-------------------------------------------------------------+
|                REAL ESTATE LENDING FLOW                      |
+-------------------------------------------------------------+
|                                                              |
|   BORROWER                      LENDER POOL                  |
|     |                               |                        |
|     v                               v                        |
|   +-------------+            +-------------+                |
|   |  Property   |            |   Deposit   |                |
|   |  NFT/Token  |            |   USDC      |                |
|   |  ($500K)    |            |   ($1M)     |                |
|   +------+------+            +------+------+                |
|          |                          |                        |
|          +------------+-------------+                        |
|                       |                                      |
|                       v                                      |
|   +-----------------------------------------------------+   |
|   |              LENDING PROTOCOL                        |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |            LOAN PARAMETERS                  |   |   |
|   |   |                                             |   |   |
|   |   |   Collateral Value:  $500,000              |   |   |
|   |   |   Max LTV:           70%                   |   |   |
|   |   |   Max Loan Amount:   $350,000              |   |   |
|   |   |   Interest Rate:     8% APR               |   |   |
|   |   |   Loan Term:         12 months            |   |   |
|   |   |   Monthly Payment:   $30,416              |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |           COLLATERAL VAULT                  |   |   |
|   |   |                                             |   |   |
|   |   |   +---------------+    +---------------+   |   |   |
|   |   |   |  Property NFT |    |  USDC Loan    |   |   |   |
|   |   |   |    LOCKED     |--->|   DISBURSED   |   |   |   |
|   |   |   |   ($500K)     |    |   ($350K)     |   |   |   |
|   |   |   +---------------+    +---------------+   |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                       |                                      |
|                       v                                      |
|   +-----------------------------------------------------+   |
|   |              HEALTH MONITORING                       |   |
|   |                                                      |   |
|   |   Current LTV: 65%      [=========>           ]     |   |
|   |   Health Factor: 1.08   (Healthy)                   |   |
|   |                                                      |   |
|   |   Warning at: 75% LTV                               |   |
|   |   Liquidation at: 85% LTV                           |   |
|   |                                                      |   |
|   |   +---------------------------------------------+   |   |
|   |   |           PRICE SCENARIOS                   |   |   |
|   |   |                                             |   |   |
|   |   |   If property drops to $450K:              |   |   |
|   |   |     LTV = 78% -> WARNING                   |   |   |
|   |   |                                             |   |   |
|   |   |   If property drops to $400K:              |   |   |
|   |   |     LTV = 88% -> LIQUIDATION               |   |   |
|   |   |                                             |   |   |
|   |   +---------------------------------------------+   |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                       |                                      |
|                       v                                      |
|   +-----------------------------------------------------+   |
|   |              REPAYMENT / LIQUIDATION                 |   |
|   |                                                      |   |
|   |   OPTION A: Successful Repayment                    |   |
|   |   +-------+    +-------+    +-------+               |   |
|   |   |Repay  |--->|Interest|--->|Unlock |               |   |
|   |   |$365K  |    |to Pool |    |NFT    |               |   |
|   |   +-------+    +-------+    +-------+               |   |
|   |                                                      |   |
|   |   OPTION B: Liquidation                             |   |
|   |   +-------+    +-------+    +-------+               |   |
|   |   |LTV >  |--->|Auction |--->|Repay  |               |   |
|   |   |85%    |    |NFT     |    |Lenders|               |   |
|   |   +-------+    +-------+    +-------+               |   |
|   |                                                      |   |
|   +-----------------------------------------------------+   |
|                                                              |
+-------------------------------------------------------------+
```

**Lending Mechanics:**

```
Loan-to-Value (LTV) Calculation:
--------------------------------
LTV = (Loan Amount / Collateral Value) x 100

Example:
  Loan: $350,000
  Property: $500,000
  LTV = 70%

Risk Tiers:
  0-65% LTV  = Low Risk (Green)
  65-75% LTV = Medium Risk (Yellow)
  75-85% LTV = High Risk (Orange)
  85%+ LTV   = Liquidation (Red)
```

---

## Real Products Reference

| Category | Examples | Description |
|----------|----------|-------------|
| **Tokenized Properties** | RealT, Lofty AI, Securitize, Republic | Fractional property ownership tokens |
| **Property Marketplaces** | Propy, RealtyBits, Fraction | Buy/sell properties as NFTs |
| **REITs on Chain** | RealtyMogul, RedSwan, AssetBlock | Pooled real estate investment |
| **Property Management** | ManageGo, Rentberry, Rentible | On-chain rent and maintenance |
| **Title and Deed NFTs** | Propy, Tezos Title, Landshare | Blockchain property records |
| **Real Estate Lending** | Centrifuge, Goldfinch, Credix, TrueFi | Property-backed DeFi loans |

### Platform Comparison:

| Platform | Type | Blockchain | Min Investment | Target Yield |
|----------|------|------------|----------------|--------------|
| **RealT** | Tokenization | Ethereum/Gnosis | $50 | 8-12% |
| **Lofty AI** | Tokenization | Algorand | $50 | 6-10% |
| **Propy** | Marketplace | Ethereum | Full property | N/A |
| **Centrifuge** | Lending | Polkadot | $5,000 | 8-15% |
| **RedSwan** | REIT | Ethereum | $1,000 | 7-10% |

---

## Key Concepts

### Fractional Ownership
```
Traditional Real Estate:
  - Buy entire property: $500,000
  - High barrier to entry
  - Illiquid (months to sell)
  - Single investor risk

Tokenized Real Estate:
  - Buy fraction: $50 minimum
  - Low barrier to entry
  - Liquid (sell in minutes)
  - Diversified risk
```

### Real World Assets (RWA) Tokenization
```
Physical Asset          Digital Token
      |                       |
      v                       v
+-------------+       +-------------+
|   Property  |       |  Security   |
|   Deed      | ====> |  Token      |
|   (Legal)   |       |  (ERC-3643) |
+-------------+       +-------------+
      |                       |
      v                       v
- Slow transfer          - Instant transfer
- Paper records          - On-chain records
- Manual dividends       - Auto dividends
- Limited investors      - Global access
```

### ERC-3643 (T-REX) Standard
```
Security Token Standard for Compliant Real Estate:

+---------------------------------------------+
|            ERC-3643 ARCHITECTURE            |
+---------------------------------------------+
|                                             |
|   +-------------+    +-------------+        |
|   |   Identity  |    | Compliance  |        |
|   |   Registry  |--->|   Module    |        |
|   | (KYC/AML)   |    | (Rules)     |        |
|   +-------------+    +------+------+        |
|                             |               |
|                             v               |
|                      +-------------+        |
|                      |   Token     |        |
|                      |   Contract  |        |
|                      |  (ERC-20)   |        |
|                      +-------------+        |
|                             |               |
|                             v               |
|   Transfer only if:                         |
|   - Sender is verified                      |
|   - Receiver is verified                    |
|   - Compliance rules pass                   |
|                                             |
+---------------------------------------------+
```

### Property NFTs vs Security Tokens

| Aspect | Property NFT (ERC-721) | Security Token (ERC-3643) |
|--------|------------------------|---------------------------|
| **Ownership** | Whole property | Fractional shares |
| **Compliance** | Minimal | Full KYC/AML |
| **Divisibility** | No | Yes |
| **Dividends** | Manual | Automatic |
| **Investor Limit** | None | Configurable |
| **Transfer Rules** | Open | Restricted |
| **Use Case** | Property trading | Investment platform |

---

## Revenue Models

| Category | Revenue Source | Typical Range |
|----------|----------------|---------------|
| **Tokenized Properties** | Platform fees, management fees, token spread | 1-3% of property value + 1% annual |
| **Property Marketplaces** | Listing fees, transaction fees, premium listings | 1-3% per transaction |
| **REITs on Chain** | Management fees, performance fees, entry/exit fees | 1-2% annual + 10-20% carry |
| **Property Management** | Monthly subscription, transaction fees | $10-100/unit/month |
| **Title and Deed NFTs** | Minting fees, transfer fees, verification fees | $50-500 per transaction |
| **Real Estate Lending** | Origination fees, interest spread, liquidation fees | 1-3% origination + 2-5% spread |

### Detailed Breakdown:

**Tokenized Properties (RealT model):**
```
Revenue Streams:
+-- Platform fee: 1-3% of property value at tokenization
+-- Management fee: 1% annual of property value
+-- Token trading spread: 0.5-1% per trade
+-- Dividend processing: 0.1% of distributions

Example: $1M Property Tokenization
+-- Upfront fee: $30,000 (3%)
+-- Annual management: $10,000 (1%)
+-- Trading fees (est): $5,000/year
+-- Total Year 1: $45,000
```

**Property Marketplaces (Propy model):**
```
Revenue Streams:
+-- Listing fee: $99-499 per property
+-- Transaction fee: 1-2% of sale price
+-- Premium placement: $500-2,000/month
+-- Title/escrow services: 0.5-1% of value

Example: $500K Property Sale
+-- Listing fee: $299
+-- Transaction fee: $10,000 (2%)
+-- Title services: $2,500
+-- Total: $12,799
```

**REITs on Chain (RedSwan model):**
```
Revenue Streams:
+-- Entry fee: 0.5-2% of investment
+-- Management fee: 1-2% annual AUM
+-- Performance fee: 10-20% of profits above hurdle
+-- Exit fee: 0-1% of withdrawal

Example: $10M REIT AUM
+-- Entry fees (new capital): $100,000
+-- Management fee: $150,000/year
+-- Performance fee (8% return): $160,000
+-- Total annual: $410,000
```

**Real Estate Lending (Centrifuge model):**
```
Revenue Streams:
+-- Origination fee: 1-3% of loan amount
+-- Interest spread: Protocol takes 2-5% of interest
+-- Liquidation fee: 5-10% of liquidation value
+-- Late payment fees: 1-5% penalty

Example: $1M in Loans at 10% APR
+-- Origination: $20,000 (2%)
+-- Interest spread: $30,000 (3% of 10%)
+-- Total annual: $50,000 per $1M loaned
```

---

## Chain Compatibility

This structure works across all major blockchains:

| Chain | Best For | Example Projects | Token Standards |
|-------|----------|------------------|-----------------|
| **Ethereum** | High-value properties, compliance | RealT, Propy | ERC-3643, ERC-721 |
| **Polygon** | Lower fees, more transactions | Lofty, RealtyBits | ERC-3643, ERC-721 |
| **Gnosis** | Micro-payments, dividends | RealT secondary | ERC-20 |
| **Avalanche** | Fast finality, subnets | Intella X | ARC-20 |
| **Solana** | High throughput | Parcl | SPL Tokens |
| **Algorand** | Green, compliant | Lofty AI | ASA |

---

## Getting Started

### Project 1 - NFT Marketplace
```bash
cd "Property Marketplaces/project1-nft-marketplace"
npm install
npm test
npm run deploy:amoy  # Deploy to Polygon Amoy testnet
```

### Project 2 - RWA Tokenization
```bash
cd "Tokenized Properties/project2-rwa-tokenization"
npm install
npm test
npm run deploy:amoy  # Deploy to Polygon Amoy testnet
```

---

## Test Results

| Project | Tests | Status |
|---------|-------|--------|
| NFT Marketplace | 37 | All Passing |
| RWA Tokenization | 24 | All Passing |

---

## Network Support

Both projects support:
- Hardhat local network
- Polygon Amoy testnet
- Ethereum Sepolia testnet

---

## License

MIT
