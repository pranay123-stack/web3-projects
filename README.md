# Web3 Projects Portfolio

[![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Move](https://img.shields.io/badge/Move-00ADD8?style=flat&logo=aptos&logoColor=white)](https://aptos.dev/)
[![PACT](https://img.shields.io/badge/PACT-ED1C24?style=flat&logo=kadena&logoColor=white)](https://www.kadena.io/)

A comprehensive collection of production-ready Web3 and blockchain projects spanning multiple ecosystems including **Solana**, **Ethereum/EVM**, **Sui**, **Aptos**, and **Kadena**.

---

## Overview

| Metric | Value |
|--------|-------|
| **Total Projects** | 13 |
| **Blockchains** | 5 (Solana, EVM, Sui, Aptos, Kadena) |
| **Languages** | Solidity, Rust, Move, PACT, TypeScript |
| **Categories** | DeFi, Bridges, Security Tools, Trading Bots |

---

## Projects

### DeFi Protocols

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [**defi-lending-protocol**](./defi-lending-protocol) | Full lending protocol with supply/borrow/liquidate, jump rate interest model. Deployed on Sepolia. | Solidity, Foundry |
| [**pump-fun-clone**](./pump-fun-clone) | Solana token launchpad with bonding curve AMM, real-time trading, and Raydium graduation | Rust/Anchor, Next.js, MongoDB |
| [**sui-smart-contract-projects**](./sui-smart-contract-projects) | DeFi suite on Sui: Lending Protocol, AMM DEX, Token Vault. 27/27 tests passing. | Move, Sui SDK |

### Cross-Chain & Bridges

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [**cross-chain-token-bridge**](./cross-chain-token-bridge) | ERC20 bridge with lock/mint mechanism, multi-sig validation, replay protection | Solidity, Hardhat |
| [**bridge-relayer-oracle**](./bridge-relayer-oracle) | Oracle system with merkle proof verification, validator registry, Node.js relayer | Solidity, Node.js |
| [**0x-settler**](./0x-settler) | 0x Protocol settlement contracts using Permit2 for gasless swaps | Solidity, Foundry |

### Security & Analysis Tools

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [**solana-smart-contract-auditor**](./solana-smart-contract-auditor) | Automated security auditor with bytecode analysis, 10+ vulnerability patterns | TypeScript, Solana |
| [**solana-scam-detection-agent**](./solana-scam-detection-agent) | Real-time monitoring for scam tokens, honeypots, rug pulls with ML classification | TypeScript, SQLite |
| [**solana-token-risk-analyzer**](./solana-token-risk-analyzer) | Risk scoring API analyzing holder concentration, liquidity, deployer history | TypeScript, REST API |

### Trading & Automation

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [**Uniswap_sniper_bot**](./Uniswap_sniper_bot) | Multi-agent sniper bot for Uniswap V3/V4 on Base with mempool monitoring | TypeScript, ethers.js |
| [**chainlink-community-tools**](./chainlink-community-tools) | CCIP Fee Estimator, Price Feed Monitor, VRF Manager, Automation Health Checker | TypeScript, Chainlink |

### Multi-Chain Smart Contracts

| Project | Description | Tech Stack |
|---------|-------------|------------|
| [**aptos-move-the-future-hackathon-2025**](./aptos-move-the-future-hackathon-2025) | Hackathon projects: Carbon Credit RWA, AI Data Marketplace, Move Security Analyzer | Move, Aptos SDK |
| [**kadena-pact-token**](./kadena-pact-token) | Fungible token with minting, burning, transfers, guard rotation | PACT |

---

## Architecture Highlights

### DeFi Lending Protocol
```
┌─────────────────────────────────────────────────────────┐
│                     LendingPool                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │
│  │ Supply  │  │ Borrow  │  │  Repay  │  │ Liquidate │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬─────┘  │
│       └────────────┴───────────┴──────────────┘        │
│                         │                               │
│            ┌────────────┼────────────┐                 │
│            ▼            ▼            ▼                 │
│   ┌─────────────┐ ┌───────────┐ ┌─────────────┐       │
│   │ Interest    │ │   Price   │ │   Collateral │       │
│   │ Rate Model  │ │   Oracle  │ │    Manager   │       │
│   └─────────────┘ └───────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Cross-Chain Bridge
```
Source Chain                    Destination Chain
┌──────────────┐               ┌──────────────────┐
│ Lock Tokens  │ ──Events───▶  │ Mint Wrapped     │
│              │               │                  │
│ Unlock       │ ◀──Events──   │ Burn Wrapped     │
└──────────────┘               └──────────────────┘
       │                              │
       ▼                              ▼
  Multi-Sig              Validator Consensus
  Validation               & Merkle Proofs
```

### Uniswap Sniper Bot
```
┌─────────────────────────────────────────────────────────┐
│                  Coordinator Agent                       │
└────────────────────────┬────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
┌─────────┐        ┌──────────┐        ┌─────────┐
│ Mempool │        │   Pool   │        │ Safety  │
│  Agent  │        │ Detector │        │  Agent  │
└────┬────┘        └────┬─────┘        └────┬────┘
     └──────────────────┼───────────────────┘
                        ▼
                 ┌────────────┐
                 │   Sniper   │
                 │   Agent    │
                 └────────────┘
```

---

## Deployments

### Ethereum (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| LendingPool | `0x211e6A6d182dE6Bcc3C49b876Cb159E235017f80` |
| InterestRateModel | `0xb1193931CD5B5a0c946FF4b18596613be8adaEeE` |
| PriceOracle | `0x6d3f27e9fDd5e573249B8aa681fCb77Fc7441261` |

### 0x Settler Registry

| Chain | Deployer Registry |
|-------|-------------------|
| All Chains | `0x00000000000004533Fe15556B1E086BB1A72cEae` |

---

## Security Features

All projects implement industry-standard security practices:

- **ReentrancyGuard** - Protection against reentrancy attacks
- **Access Control** - Role-based permissions (RBAC)
- **Pausable** - Emergency circuit breakers
- **Input Validation** - Comprehensive parameter checks
- **Nonce Tracking** - Replay attack prevention
- **Multi-Sig** - Multi-signature validation for critical operations
- **Slashing** - Economic penalties for malicious actors

---

## Vulnerability Detection

The Solana Smart Contract Auditor detects:

| Vulnerability | Severity | Category |
|---------------|----------|----------|
| Missing Signer Verification | CRITICAL | Access Control |
| Missing Owner Verification | CRITICAL | Access Control |
| Arbitrary CPI | CRITICAL | External Calls |
| Integer Overflow | HIGH | Arithmetic |
| Unsafe PDA Derivation | HIGH | PDA Validation |
| Duplicate Mutable Accounts | HIGH | Account Validation |
| Uninitialized Account Access | HIGH | Initialization |
| Upgrade Authority Not Revoked | HIGH | Configuration |

---

## Tech Stack

### Languages
- **Solidity** - Ethereum/EVM smart contracts
- **Rust** - Solana programs (Anchor framework)
- **Move** - Sui & Aptos contracts
- **PACT** - Kadena smart contracts
- **TypeScript** - Backend services, bots, APIs

### Frameworks & Tools
- **Foundry** - Solidity development & testing
- **Hardhat** - Ethereum development environment
- **Anchor** - Solana program framework
- **Next.js** - Frontend applications
- **Express.js** - REST APIs

### Infrastructure
- **Chainlink** - Oracles, CCIP, VRF, Automation
- **MongoDB** - Database for off-chain data
- **SQLite** - Lightweight local storage
- **WebSocket** - Real-time data streams

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/web3-projects.git
cd web3-projects

# Navigate to any project
cd defi-lending-protocol

# Install dependencies (varies by project)
npm install   # For TypeScript projects
forge install # For Foundry projects

# Run tests
npm test      # TypeScript
forge test    # Solidity
sui move test # Sui Move
```

---

## Project Structure

```
web3-projects/
├── 0x-settler/                      # 0x Protocol settlement contracts
├── aptos-move-the-future-hackathon-2025/
│   ├── project1-carbon-credit-marketplace/
│   ├── project2-ai-data-marketplace/
│   └── project3-move-security-analyzer/
├── bridge-relayer-oracle/           # Cross-chain oracle & relayer
├── chainlink-community-tools/       # Chainlink developer toolkit
├── cross-chain-token-bridge/        # ERC20 lock/mint bridge
├── defi-lending-protocol/           # Lending protocol (Sepolia)
├── kadena-pact-token/               # Kadena fungible token
├── pump-fun-clone/                  # Solana token launchpad
├── solana-scam-detection-agent/     # ML-powered scam detector
├── solana-smart-contract-auditor/   # Security audit tool
├── solana-token-risk-analyzer/      # Token risk scoring API
├── sui-smart-contract-projects/     # Sui DeFi contracts
└── Uniswap_sniper_bot/              # Uniswap V3/V4 sniper
```

---

## Web3 Revenue Models

| Category | Project Type | Revenue Source | Typical Range |
|----------|--------------|----------------|---------------|
| **DeFi - Lending** | Aave, Compound clones | Interest spread, liquidation fees | 0.1-1% spread |
| **DeFi - DEX/AMM** | Uniswap, Raydium clones | Swap fees | 0.1-0.3% per swap |
| **DeFi - Aggregators** | 0x, 1inch clones | Positive slippage, referral fees | 0.1-0.5% |
| **Bridges** | Cross-chain bridges | Bridge fees | 0.1-0.5% per transfer |
| **MEV/Trading Bots** | Sniper, arbitrage bots | Trading profits | Variable |
| **Token Launchpads** | pump.fun clones | Launch fees, trading fees | 1-2% per trade |
| **NFT Marketplaces** | OpenSea clones | Marketplace fees | 2-5% per sale |
| **Gaming Guilds** | YGG clones | Profit share from scholars | 20-40% of earnings |
| **P2E Games** | Axie clones | NFT sales, marketplace fees | Variable |
| **Move-to-Earn** | StepN clones | NFT sales, premium features | $50-500 per NFT |
| **Casino/Gambling** | Rollbit clones | House edge | 1-5% edge |
| **Prediction Markets** | Polymarket clones | Trading fees, resolution fees | 1-2% |
| **Security Tools** | Auditors, analyzers | SaaS subscription, per-audit fees | $500-50K per audit |
| **Oracles** | Chainlink tools | Data feed subscriptions | Usage-based |
| **Infrastructure** | SDKs, APIs | SaaS fees, usage fees | $99-999/month |

---

## License

Each project may have its own license. See individual project directories for details.

---

## Contact

**Pranay** - Web3 Smart Contract Engineer

[![GitHub](https://img.shields.io/badge/GitHub-pranay123--stack-181717?style=flat&logo=github)](https://github.com/pranay123-stack)

---

<p align="center">
  <i>Building the decentralized future, one smart contract at a time.</i>
</p>
