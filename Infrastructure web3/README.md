# Infrastructure Web3 Projects

A comprehensive collection of Web3 infrastructure tools covering RPC providers, indexers, developer SDKs, and smart contract tooling.

---

## Folder Structure

```
Infrastructure web3/
├── RPC Providers/               # Node access
├── Indexers & Data/             # Query blockchain data
├── Developer SDKs/              # Web3 libraries
├── Smart Contract Tools/        # Deploy, verify, debug
├── Testing & Simulation/        # Forks, testnets
├── Monitoring & Alerts/         # Track transactions
├── Gas Management/              # Estimation, optimization
└── Multi-chain Deployment/      # Deploy across chains
```

---

## Infrastructure Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WEB3 INFRASTRUCTURE STACK                           │
└─────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │   APPLICATION   │
                           │    (dApp)       │
                           └────────┬────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER TOOLS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   SDKs      │  │  Testing    │  │  Monitoring │  │   Deploy    │  │
│  │ ethers.js   │  │  Hardhat    │  │  Tenderly   │  │  thirdweb   │  │
│  │ viem        │  │  Foundry    │  │  Forta      │  │  Hardhat    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                       INDEXERS                                  │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │  │
│  │  │ The Graph │  │ Subsquid  │  │  Goldsky  │  │  Custom   │   │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        RPC LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    RPC PROVIDERS                                │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │  │
│  │  │  Alchemy  │  │ QuickNode │  │  Infura   │  │   Ankr    │   │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Ethereum  │  │  Polygon  │  │  Solana   │  │  Other Chains     │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Categories Explained

### 1. RPC Providers
Connect your dApp to blockchain nodes.

```
┌─────────────────────────────────────────────────────────────────┐
│                       RPC REQUEST FLOW                           │
└─────────────────────────────────────────────────────────────────┘

   dApp                      RPC Provider                 Blockchain
     │                           │                            │
     │  eth_getBalance           │                            │
     │──────────────────────────▶│                            │
     │                           │                            │
     │              ┌────────────┴────────────┐               │
     │              │   LOAD BALANCER         │               │
     │              │                         │               │
     │              │  Route to fastest node  │               │
     │              └────────────┬────────────┘               │
     │                           │                            │
     │                           │  Query node                │
     │                           │───────────────────────────▶│
     │                           │                            │
     │                           │  Return data               │
     │                           │◀───────────────────────────│
     │                           │                            │
     │  Balance: 1.5 ETH         │                            │
     │◀──────────────────────────│                            │


RPC TYPES:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  STANDARD RPC              ARCHIVE NODE              WEBSOCKET    │
│  ┌─────────────────┐      ┌─────────────────┐      ┌───────────┐ │
│  │ Recent blocks   │      │ Full history    │      │ Real-time │ │
│  │ Current state   │      │ Any block query │      │ Events    │ │
│  │ Cheaper         │      │ More expensive  │      │ Subscribe │ │
│  └─────────────────┘      └─────────────────┘      └───────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Provider | Free Tier | Chains | Strengths |
|----------|-----------|--------|-----------|
| **Alchemy** | 300M CU/mo | 30+ | Enhanced APIs, NFT APIs |
| **QuickNode** | 10M credits | 25+ | Speed, addons |
| **Infura** | 100K req/day | 15+ | Reliability, IPFS |
| **Ankr** | 1M req/mo | 45+ | Cheapest, decentralized |
| **Blast** | 40 req/sec | 20+ | Builder-focused |
| **Chainstack** | 3M req/mo | 30+ | Enterprise |

---

### 2. Indexers & Data
Query historical blockchain data efficiently.

```
┌─────────────────────────────────────────────────────────────────┐
│                     INDEXER ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        THE GRAPH                                   │
│                                                                    │
│   BLOCKCHAIN          INDEXER              SUBGRAPH      QUERY    │
│       │                  │                    │            │      │
│       │  New Block       │                    │            │      │
│       │─────────────────▶│                    │            │      │
│       │                  │                    │            │      │
│       │         ┌────────┴────────┐           │            │      │
│       │         │  PROCESS BLOCK  │           │            │      │
│       │         │                 │           │            │      │
│       │         │ • Decode events │           │            │      │
│       │         │ • Run handlers  │           │            │      │
│       │         │ • Update store  │           │            │      │
│       │         └────────┬────────┘           │            │      │
│       │                  │                    │            │      │
│       │                  │  Store entities    │            │      │
│       │                  │───────────────────▶│            │      │
│       │                  │                    │            │      │
│       │                  │                    │  GraphQL   │      │
│       │                  │                    │◀───────────│      │
│       │                  │                    │            │      │
│       │                  │                    │  Results   │      │
│       │                  │                    │───────────▶│      │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘


WHY INDEXERS?
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  WITHOUT INDEXER:                   WITH INDEXER:                 │
│  ┌─────────────────────────┐       ┌─────────────────────────┐   │
│  │ Query each block        │       │ Query indexed database  │   │
│  │ Slow (minutes/hours)    │       │ Fast (milliseconds)     │   │
│  │ Expensive (RPC calls)   │       │ Cheap (single query)    │   │
│  │ Complex code            │       │ Simple GraphQL          │   │
│  └─────────────────────────┘       └─────────────────────────┘   │
│                                                                   │
│  Example: "Get all transfers for address X in last year"          │
│  • Without: Scan 2.6M blocks × $0.0001 = $260 + hours            │
│  • With: Single query = $0.001 + 100ms                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Product | Query Language | Hosting | Best For |
|---------|----------------|---------|----------|
| **The Graph** | GraphQL | Decentralized | DeFi, NFT data |
| **Subsquid** | GraphQL/SQL | Cloud/Self | High performance |
| **Goldsky** | Mirror + Index | Managed | Real-time |
| **Envio** | HyperIndex | Managed | Speed |
| **Ponder** | SQL | Self-hosted | Simple |

---

### 3. Developer SDKs
Libraries for building dApps.

```
┌─────────────────────────────────────────────────────────────────┐
│                     SDK COMPARISON                               │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ETHERS.JS                          VIEM                          │
│  ┌─────────────────────────┐       ┌─────────────────────────┐   │
│  │ • Most popular          │       │ • TypeScript-first      │   │
│  │ • Battle-tested         │       │ • Better types          │   │
│  │ • Large ecosystem       │       │ • Smaller bundle        │   │
│  │ • Provider pattern      │       │ • Tree-shakeable        │   │
│  │ • v6 major update       │       │ • Modern APIs           │   │
│  └─────────────────────────┘       └─────────────────────────┘   │
│                                                                   │
│  WEB3.JS                            WAGMI                         │
│  ┌─────────────────────────┐       ┌─────────────────────────┐   │
│  │ • Legacy standard       │       │ • React hooks           │   │
│  │ • Ethereum Foundation   │       │ • Built on viem         │   │
│  │ • Large install base    │       │ • Best for React dApps  │   │
│  │ • Plugin system         │       │ • Wallet connection     │   │
│  └─────────────────────────┘       └─────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


SDK USAGE FLOW:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  import { createPublicClient } from 'viem'                      │
│                                                                 │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  dApp   │────▶│     SDK     │────▶│    RPC Provider     │   │
│  │  Code   │     │   (viem)    │     │    (Alchemy)        │   │
│  └─────────┘     └─────────────┘     └─────────────────────┘   │
│       │                │                      │                │
│       │                │                      ▼                │
│       │                │              ┌───────────────┐        │
│       │                │              │  Blockchain   │        │
│       │                │              └───────────────┘        │
│       │                │                      │                │
│       │◀───────────────┴──────────────────────┘                │
│                    Response                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| SDK | Language | Bundle Size | Use Case |
|-----|----------|-------------|----------|
| **ethers.js** | JS/TS | 120kb | General purpose |
| **viem** | TypeScript | 35kb | Modern apps |
| **web3.js** | JS | 150kb | Legacy apps |
| **wagmi** | React | 50kb | React dApps |
| **web3.py** | Python | N/A | Python backends |
| **Solana Web3.js** | JS | 80kb | Solana apps |

---

### 4. Smart Contract Tools
Compile, deploy, verify, and debug contracts.

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

   WRITE              COMPILE            TEST              DEPLOY
     │                   │                 │                  │
     ▼                   ▼                 ▼                  ▼
┌─────────┐        ┌─────────┐       ┌─────────┐       ┌─────────┐
│ Solidity│───────▶│  solc   │──────▶│ Foundry │──────▶│ Deploy  │
│  .sol   │        │ Compile │       │  Tests  │       │ Script  │
└─────────┘        └─────────┘       └─────────┘       └─────────┘
                        │                 │                  │
                        ▼                 ▼                  ▼
                  ┌─────────┐       ┌─────────┐       ┌─────────┐
                  │   ABI   │       │  Fork   │       │ Verify  │
                  │Bytecode │       │ Mainnet │       │Etherscan│
                  └─────────┘       └─────────┘       └─────────┘


FOUNDRY vs HARDHAT:
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  FOUNDRY (forge)                    HARDHAT                       │
│  ┌─────────────────────────┐       ┌─────────────────────────┐   │
│  │ • Written in Rust       │       │ • Written in JS/TS      │   │
│  │ • Tests in Solidity     │       │ • Tests in JS/TS        │   │
│  │ • Extremely fast        │       │ • Large plugin ecosystem│   │
│  │ • Built-in fuzzing      │       │ • More tutorials        │   │
│  │ • Gas snapshots         │       │ • Easier for JS devs    │   │
│  │ • Preferred by pros     │       │ • Industry standard     │   │
│  └─────────────────────────┘       └─────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Tool | Language | Speed | Best For |
|------|----------|-------|----------|
| **Foundry** | Rust/Solidity | Very Fast | Pro developers |
| **Hardhat** | JavaScript | Medium | Most projects |
| **Remix** | Browser | Instant | Learning, quick tests |
| **Brownie** | Python | Medium | Python developers |
| **Anchor** | Rust | Fast | Solana programs |

---

### 5. Testing & Simulation
Fork mainnet, run testnets, simulate transactions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAINNET FORKING                               │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  MAINNET STATE                    LOCAL FORK                      │
│  ┌─────────────────────────┐     ┌─────────────────────────┐     │
│  │                         │     │                         │     │
│  │  Uniswap: $2B TVL       │────▶│  Uniswap: $2B TVL      │     │
│  │  USDC: $25B supply      │     │  USDC: $25B supply      │     │
│  │  Your wallet: 10 ETH    │     │  Your wallet: 10 ETH    │     │
│  │                         │     │  + impersonate anyone   │     │
│  │  Block: 18,500,000      │     │  + infinite gas         │     │
│  │                         │     │  + time travel          │     │
│  └─────────────────────────┘     └─────────────────────────┘     │
│                                          │                        │
│                                          ▼                        │
│                                  ┌───────────────┐               │
│                                  │ Test against  │               │
│                                  │ real state    │               │
│                                  │ safely!       │               │
│                                  └───────────────┘               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘


TENDERLY SIMULATION:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   BEFORE SUBMITTING TX:                                         │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   1. Simulate transaction                               │  │
│   │   2. See all state changes                              │  │
│   │   3. View gas usage breakdown                           │  │
│   │   4. Check for reverts                                  │  │
│   │   5. Trace execution path                               │  │
│   │                                                         │  │
│   │   Result: Safe to submit ✓ or Will fail ✗              │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Tool | Features | Pricing |
|------|----------|---------|
| **Tenderly** | Simulate, debug, fork | Free tier + paid |
| **Anvil** | Local fork (Foundry) | Free |
| **Ganache** | Local chain | Free |
| **Hardhat Network** | Built-in fork | Free |

---

### 6. Monitoring & Alerts
Track transactions, detect threats, get alerts.

```
┌─────────────────────────────────────────────────────────────────┐
│                   MONITORING STACK                               │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        FORTA NETWORK                               │
│                                                                    │
│   BLOCKCHAIN              DETECTION BOTS           ALERTS          │
│       │                        │                      │           │
│       │  Every transaction     │                      │           │
│       │───────────────────────▶│                      │           │
│       │                        │                      │           │
│       │              ┌─────────┴─────────┐           │           │
│       │              │   BOT ANALYSIS    │           │           │
│       │              │                   │           │           │
│       │              │ • Reentrancy?     │           │           │
│       │              │ • Price manip?    │           │           │
│       │              │ • Flash loan?     │           │           │
│       │              │ • Unusual access? │           │           │
│       │              └─────────┬─────────┘           │           │
│       │                        │                      │           │
│       │                        │  Alert: CRITICAL     │           │
│       │                        │─────────────────────▶│           │
│       │                        │                      │           │
│       │                        │              ┌───────┴───────┐  │
│       │                        │              │ Slack/Discord │  │
│       │                        │              │ PagerDuty     │  │
│       │                        │              │ Webhook       │  │
│       │                        │              └───────────────┘  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

**Real Products:**

| Product | Focus | Pricing |
|---------|-------|---------|
| **Forta** | Threat detection | Per-bot fees |
| **Tenderly** | Tx monitoring | SaaS plans |
| **OpenZeppelin Defender** | Security monitoring | $0-500/mo |
| **Chainlink Automation** | Keeper/trigger | Per execution |

---

## Revenue Models

| Category | Revenue Source | Typical Range |
|----------|----------------|---------------|
| **RPC Providers** | API calls, compute units | $49-10K+/mo |
| **Indexers** | Query fees, hosting | $0-500/mo |
| **Dev Tools** | SaaS subscriptions | $0-1000/mo |
| **Monitoring** | Alert volume, features | $0-500/mo |

### Detailed Breakdown:

**RPC Provider (Alchemy model):**
```
Revenue Streams:
├── Compute Unit pricing
│   ├── Free: 300M CU/month
│   ├── Growth: $49/mo + overages
│   ├── Scale: $199/mo + overages
│   └── Enterprise: Custom
├── Enhanced APIs (NFT, Token, etc.)
└── Premium support

Example customer mix:
├── 80% free tier (funnel)
├── 15% growth ($49-199/mo)
├── 5% enterprise ($5K-100K/mo)
```

**Indexer (The Graph model):**
```
Revenue Streams:
├── Query fees (GRT tokens)
│   └── ~$0.00004 per query
├── Hosted service (deprecated)
└── Subgraph studio

Decentralized economics:
├── Indexers stake GRT
├── Earn query fees
├── Curators signal quality
└── Delegators share rewards
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/web3-projects.git
cd "web3-projects/Infrastructure web3"

# Explore categories
ls -la
```

---

<p align="center">
  <i>The backbone of Web3 - from nodes to SDKs to monitoring.</i>
</p>
