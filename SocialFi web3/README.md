# SocialFi Web3 Projects

This folder contains SocialFi (Social Finance) projects organized by functionality. SocialFi combines social media with decentralized finance, enabling users to monetize their social interactions, content, and influence on the blockchain.

## Folder Structure

```
SocialFi web3/
├── Decentralized Social Networks/    <- Farcaster, Lens, Bluesky clones
│   ├── Farcaster clone/
│   ├── Jack Dorsey Bluesky clone/
│   └── Lenster clone/
├── Creator Token Platforms/          <- Friend.tech, Rally.io clones
├── Content Monetization/             <- Mirror, Paragraph clones
├── Social Trading/                   <- Copy trading, social signals
├── Reputation Systems/               <- On-chain identity, credentials
└── Community DAOs/                   <- Social governance platforms
```

---

## The SocialFi Lifecycle

```
CREATE IDENTITY -> BUILD SOCIAL GRAPH -> CREATE CONTENT -> MONETIZE -> GOVERN
       |                  |                    |              |          |
       v                  v                    v              v          v
  Reputation         Decentralized         Content        Creator    Community
   Systems            Networks           Monetization     Tokens       DAOs
```

### Lifecycle Stages:

| Stage | What Happens | Who Does It |
|-------|--------------|-------------|
| **Create Identity** | Build on-chain reputation, verify credentials | Users/Reputation Systems |
| **Build Social Graph** | Connect with others, follow, form communities | Decentralized Networks |
| **Create Content** | Post, share, curate content on-chain | Creators/Users |
| **Monetize** | Earn from content, tips, subscriptions, tokens | Creator Token Platforms |
| **Govern** | Vote on platform decisions, manage communities | Community DAOs |

---

## Detailed Folder Descriptions

### 1. Decentralized Social Networks

Blockchain-based alternatives to Twitter, Instagram, and Facebook with user-owned data and social graphs.

**Examples:** Farcaster, Lens Protocol, Bluesky, Mastodon, DeSo

**What you'd build:**
- Social graph smart contracts
- Decentralized content feeds
- User authentication with wallets
- Cross-platform identity portability

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│               DECENTRALIZED SOCIAL NETWORK                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   USER                                                       │
│     │                                                        │
│     v                                                        │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 WALLET CONNECTION                    │   │
│   │                                                      │   │
│   │   ┌──────────────────────────────────────────────┐  │   │
│   │   │   MetaMask / WalletConnect / Privy           │  │   │
│   │   │                                              │  │   │
│   │   │   Address: 0x1234...5678                     │  │   │
│   │   │   ENS: alice.eth                             │  │   │
│   │   │   Farcaster: @alice                          │  │   │
│   │   └──────────────────────────────────────────────┘  │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│              │                                               │
│              v                                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  SOCIAL GRAPH LAYER                  │   │
│   │                                                      │   │
│   │        ┌─────┐      ┌─────┐      ┌─────┐           │   │
│   │        │Alice│──────│ Bob │──────│Carol│           │   │
│   │        └──┬──┘      └──┬──┘      └──┬──┘           │   │
│   │           │            │            │               │   │
│   │           v            v            v               │   │
│   │    ┌──────────────────────────────────────┐        │   │
│   │    │  ON-CHAIN: Follows, Connections      │        │   │
│   │    │  PORTABLE: Take your graph anywhere  │        │   │
│   │    └──────────────────────────────────────┘        │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│              │                                               │
│              v                                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   CONTENT LAYER                      │   │
│   │                                                      │   │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│   │   │   Posts    │  │  Comments  │  │   Likes    │   │   │
│   │   │  (Casts)   │  │  (Replies) │  │  (Recasts) │   │   │
│   │   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │   │
│   │         │               │               │           │   │
│   │         v               v               v           │   │
│   │   ┌──────────────────────────────────────────────┐  │   │
│   │   │  Storage: IPFS / Arweave / Hub Network       │  │   │
│   │   │  Indexed: The Graph / Neynar / Airstack      │  │   │
│   │   └──────────────────────────────────────────────┘  │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Architecture:**

```
Farcaster Architecture:
──────────────────────────
┌─────────────────────────────────────────────┐
│              FARCASTER PROTOCOL              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────┐        │
│  │   ID        │    │   Storage   │        │
│  │  Registry   │    │   Registry  │        │
│  │ (On-chain)  │    │ (On-chain)  │        │
│  └──────┬──────┘    └──────┬──────┘        │
│         │                  │               │
│         v                  v               │
│  ┌─────────────────────────────────────┐   │
│  │           HUB NETWORK                │   │
│  │   (Decentralized message storage)    │   │
│  │                                      │   │
│  │  Hub 1 <──> Hub 2 <──> Hub 3        │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│         │                                   │
│         v                                   │
│  ┌─────────────────────────────────────┐   │
│  │           CLIENT APPS                │   │
│  │   Warpcast / Supercast / Farcord    │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2. Creator Token Platforms

Platforms enabling creators to launch personal tokens that fans can buy, creating a direct financial relationship between creators and their audience.

**Examples:** Friend.tech, Rally.io, BitClout, Stars Arena, Friendzy

**What you'd build:**
- Bonding curve token contracts
- Social trading interface
- Creator profile pages
- Token holder benefits system

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                 CREATOR TOKEN PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   CREATOR                              FANS                  │
│      │                                   │                   │
│      v                                   │                   │
│   ┌─────────────┐                        │                   │
│   │  Create     │                        │                   │
│   │  Profile    │                        │                   │
│   │  + Token    │                        │                   │
│   └──────┬──────┘                        │                   │
│          │                               │                   │
│          v                               v                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  BONDING CURVE                       │   │
│   │                                                      │   │
│   │   Price                                              │   │
│   │     ^                                                │   │
│   │     │                         ╭────── $5.00          │   │
│   │     │                    ╭────╯                      │   │
│   │     │               ╭────╯                           │   │
│   │     │          ╭────╯                                │   │
│   │     │     ╭────╯                                     │   │
│   │     │ ────╯  $0.10                                   │   │
│   │     └───────────────────────────────> Keys/Shares    │   │
│   │                                                      │   │
│   │   First buyer: $0.10    100th buyer: $5.00          │   │
│   │                                                      │   │
│   │   BUY = Price goes UP    SELL = Price goes DOWN     │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│          │                               │                   │
│          v                               v                   │
│   ┌─────────────┐              ┌─────────────┐              │
│   │  Holder     │              │   Access    │              │
│   │  Benefits   │              │   Private   │              │
│   │  - Revenue  │              │   Chat      │              │
│   │  - Access   │              │   Group     │              │
│   └─────────────┘              └─────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Friend.tech Token Math:**

```
Friend.tech Bonding Curve:
──────────────────────────────
Price = (Supply)^2 / 16000

Example:
┌──────────────────────────────────────────┐
│  Supply    │  Buy Price   │  Total Value │
├──────────────────────────────────────────┤
│    1       │   0.0000625  │    0.0000625 │
│   10       │   0.00625    │    0.02083   │
│   50       │   0.15625    │    2.604     │
│  100       │   0.625      │   20.83      │
│  500       │   15.625     │  2604.17     │
└──────────────────────────────────────────┘

Protocol Fee: 10% (5% to creator, 5% to protocol)
```

---

### 3. Content Monetization

Platforms for creators to monetize their content through subscriptions, tips, NFTs, and pay-per-view models.

**Examples:** Mirror, Paragraph, Unlock Protocol, Lens Publications, Zora

**What you'd build:**
- Subscription smart contracts
- NFT-gated content
- Tipping/donation systems
- Content publishing tools

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│               CONTENT MONETIZATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   CREATOR                                                    │
│      │                                                       │
│      v                                                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  CREATE CONTENT                      │   │
│   │                                                      │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│   │   │ Articles │  │  Videos  │  │Newsletters│         │   │
│   │   │ (Mirror) │  │ (Zora)   │  │(Paragraph)│         │   │
│   │   └─────┬────┘  └─────┬────┘  └─────┬────┘         │   │
│   │         │             │             │               │   │
│   │         └─────────────┼─────────────┘               │   │
│   │                       │                             │   │
│   │                       v                             │   │
│   │              ┌─────────────┐                        │   │
│   │              │  STORAGE    │                        │   │
│   │              │  Arweave/   │                        │   │
│   │              │   IPFS      │                        │   │
│   │              └──────┬──────┘                        │   │
│   │                     │                               │   │
│   └─────────────────────┼───────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 MONETIZATION OPTIONS                 │   │
│   │                                                      │   │
│   │  ┌───────────────────────────────────────────────┐  │   │
│   │  │                                               │  │   │
│   │  │   1. COLLECT AS NFT                           │  │   │
│   │  │   ┌─────────┐                                 │  │   │
│   │  │   │ Article │   Mint Price: 0.01 ETH         │  │   │
│   │  │   │  #42    │   Collectors: 150               │  │   │
│   │  │   │  NFT    │   Revenue: 1.5 ETH             │  │   │
│   │  │   └─────────┘                                 │  │   │
│   │  │                                               │  │   │
│   │  │   2. SUBSCRIPTION                             │  │   │
│   │  │   ┌─────────────────────────────────────┐    │  │   │
│   │  │   │ Premium Content Access              │    │  │   │
│   │  │   │ Monthly: 5 USDC  │  Annual: 50 USDC│    │  │   │
│   │  │   │ Subscribers: 200 │  MRR: $1000     │    │  │   │
│   │  │   └─────────────────────────────────────┘    │  │   │
│   │  │                                               │  │   │
│   │  │   3. TIPS & DONATIONS                         │  │   │
│   │  │   ┌─────────────────────────────────────┐    │  │   │
│   │  │   │ [1 USDC] [5 USDC] [10 USDC] [Custom]│    │  │   │
│   │  │   └─────────────────────────────────────┘    │  │   │
│   │  │                                               │  │   │
│   │  └───────────────────────────────────────────────┘  │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Mirror Entry Monetization:**

```
Mirror Publication Model:
──────────────────────────────
┌────────────────────────────────────────────┐
│            WRITING NFT FLOW                 │
├────────────────────────────────────────────┤
│                                            │
│  1. Writer publishes article on Mirror     │
│                  │                         │
│                  v                         │
│  2. Article stored on Arweave (permanent)  │
│                  │                         │
│                  v                         │
│  3. Readers can "Collect" as NFT           │
│     ┌────────────────────────────────┐     │
│     │ Edition: Open or Limited       │     │
│     │ Price: Free or Paid            │     │
│     │ Split: Multi-way revenue split │     │
│     └────────────────────────────────┘     │
│                  │                         │
│                  v                         │
│  4. Revenue distributed automatically      │
│     - 97.5% to creator(s)                  │
│     - 2.5% to platform                     │
│                                            │
└────────────────────────────────────────────┘
```

---

### 4. Social Trading

Platforms enabling users to follow and copy trades of successful traders, share trading signals, and build trading-focused social networks.

**Examples:** Farcaster trading channels, Trade Socially, copy.trading protocols

**What you'd build:**
- Copy trading smart contracts
- Social trading feeds
- Performance tracking
- Signal sharing systems

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                   SOCIAL TRADING FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   TOP TRADER                         FOLLOWERS               │
│       │                                  │                   │
│       v                                  │                   │
│   ┌─────────────┐                        │                   │
│   │  Execute    │                        │                   │
│   │  Trade      │                        │                   │
│   │  Buy 1 ETH  │                        │                   │
│   └──────┬──────┘                        │                   │
│          │                               │                   │
│          v                               v                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                COPY TRADING CONTRACT                 │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │  TRADER VAULT                              │    │   │
│   │   │  ┌─────────────────────────────────────┐   │    │   │
│   │   │  │  Trader: whale.eth                  │   │    │   │
│   │   │  │  TVL: $500,000                      │   │    │   │
│   │   │  │  Followers: 150                     │   │    │   │
│   │   │  │  ROI (30d): +25%                    │   │    │   │
│   │   │  │  Win Rate: 72%                      │   │    │   │
│   │   │  └─────────────────────────────────────┘   │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   │   Trade Execution:                                   │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │  Trader buys 1 ETH                         │    │   │
│   │   │           │                                │    │   │
│   │   │           v                                │    │   │
│   │   │  Follower A (10% allocation) -> 0.1 ETH   │    │   │
│   │   │  Follower B (5% allocation)  -> 0.05 ETH  │    │   │
│   │   │  Follower C (20% allocation) -> 0.2 ETH   │    │   │
│   │   │                                            │    │   │
│   │   │  Proportional execution based on deposit   │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│          │                               │                   │
│          v                               v                   │
│   ┌─────────────┐              ┌─────────────┐              │
│   │  Earn       │              │  Automated  │              │
│   │  Performance│              │  Portfolio  │              │
│   │  Fees (20%) │              │  Growth     │              │
│   └─────────────┘              └─────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Performance Metrics:**

```
Social Trading Leaderboard:
──────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Rank │ Trader      │ ROI (30d) │ Win Rate │ Followers │ TVL │
├─────────────────────────────────────────────────────────────┤
│  1   │ whale.eth   │   +45%    │   78%    │    520    │ $2M │
│  2   │ alpha.lens  │   +32%    │   71%    │    340    │ $800K│
│  3   │ degen.fc    │   +28%    │   65%    │    210    │ $400K│
│  4   │ trader.eth  │   +22%    │   69%    │    180    │ $300K│
│  5   │ signal.lens │   +18%    │   74%    │    150    │ $250K│
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Reputation Systems

On-chain identity and reputation systems that track user credentials, achievements, and social standing across protocols.

**Examples:** Gitcoin Passport, Galxe, Layer3, POAP, Sismo, Worldcoin

**What you'd build:**
- Soulbound token contracts
- Credential verification
- Reputation scoring
- Identity aggregation

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                   REPUTATION SYSTEM FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   USER IDENTITY                                              │
│        │                                                     │
│        v                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                IDENTITY AGGREGATION                  │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │              alice.eth                      │    │   │
│   │   ├────────────────────────────────────────────┤    │   │
│   │   │                                            │    │   │
│   │   │   Wallets:                                 │    │   │
│   │   │   ├── 0x1234...5678 (Main)                │    │   │
│   │   │   ├── 0xabcd...efgh (Trading)             │    │   │
│   │   │   └── 0x9876...4321 (NFTs)                │    │   │
│   │   │                                            │    │   │
│   │   │   Social:                                  │    │   │
│   │   │   ├── Farcaster: @alice (5000 followers)  │    │   │
│   │   │   ├── Lens: alice.lens (2000 followers)   │    │   │
│   │   │   └── Twitter: @alice (verified)          │    │   │
│   │   │                                            │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        v                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                CREDENTIAL COLLECTION                 │   │
│   │                                                      │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│   │   │  POAPs   │  │ Badges   │  │  SBTs    │         │   │
│   │   │ (Events) │  │ (Galxe)  │  │(Soulbound)│        │   │
│   │   └────┬─────┘  └────┬─────┘  └────┬─────┘         │   │
│   │        │             │             │                │   │
│   │        v             v             v                │   │
│   │   ┌────────────────────────────────────────────┐   │   │
│   │   │                                            │   │   │
│   │   │  CREDENTIAL VAULT                          │   │   │
│   │   │  ┌──────────────────────────────────────┐ │   │   │
│   │   │  │ [x] ETHGlobal Hacker (2024)          │ │   │   │
│   │   │  │ [x] Gitcoin Donor (Round 18)         │ │   │   │
│   │   │  │ [x] Uniswap Early User               │ │   │   │
│   │   │  │ [x] ENS Domain Owner                 │ │   │   │
│   │   │  │ [x] 1000+ on-chain transactions      │ │   │   │
│   │   │  │ [x] DAO Voter (3+ DAOs)              │ │   │   │
│   │   │  └──────────────────────────────────────┘ │   │   │
│   │   │                                            │   │   │
│   │   └────────────────────────────────────────────┘   │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        v                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 REPUTATION SCORE                     │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │                                            │    │   │
│   │   │   TRUST SCORE: 847 / 1000                 │    │   │
│   │   │   ████████████████████░░░░░ 85%           │    │   │
│   │   │                                            │    │   │
│   │   │   Breakdown:                               │    │   │
│   │   │   ├── On-chain Activity:  180/200         │    │   │
│   │   │   ├── Social Presence:    170/200         │    │   │
│   │   │   ├── Credentials:        195/200         │    │   │
│   │   │   ├── Financial History:  162/200         │    │   │
│   │   │   └── Community Contrib:  140/200         │    │   │
│   │   │                                            │    │   │
│   │   │   Benefits Unlocked:                       │    │   │
│   │   │   [x] Reduced collateral for loans        │    │   │
│   │   │   [x] Whitelist for token launches        │    │   │
│   │   │   [x] Enhanced DAO voting power           │    │   │
│   │   │                                            │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Gitcoin Passport Scoring:**

```
Passport Stamp Categories:
──────────────────────────────
┌─────────────────────────────────────────────────┐
│ Category        │ Stamps           │ Max Score │
├─────────────────────────────────────────────────┤
│ Social          │ Twitter, Discord │    5.0    │
│ Biometric       │ Worldcoin, BrightID│  10.0   │
│ Financial       │ Coinbase, Binance│    5.0    │
│ On-chain        │ ENS, Lens, NFTs  │   10.0    │
│ Developer       │ GitHub, GitPOAP  │    5.0    │
├─────────────────────────────────────────────────┤
│ TOTAL           │                  │   35.0+   │
└─────────────────────────────────────────────────┘

Score Thresholds:
- 15+: Basic humanity verification
- 20+: Enhanced platform access
- 25+: Whitelist eligibility
- 30+: Full trust status
```

---

### 6. Community DAOs

Decentralized organizations for managing social communities, content moderation, and collective decision-making.

**Examples:** Friends With Benefits (FWB), Bankless DAO, Cabin DAO, Seed Club

**What you'd build:**
- Governance smart contracts
- Token-gated communities
- Proposal/voting systems
- Treasury management

**Visual Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                     COMMUNITY DAO FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    MEMBERSHIP                        │   │
│   │                                                      │   │
│   │   Entry Requirements:                                │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │ Option A: Hold 75 $FWB tokens              │    │   │
│   │   │ Option B: Earn membership through contrib  │    │   │
│   │   │ Option C: Be invited by existing member    │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   │   Member Tiers:                                      │   │
│   │   ┌──────────────────────────────────────────────┐  │   │
│   │   │  Tier      │ Tokens │ Benefits               │  │   │
│   │   ├──────────────────────────────────────────────┤  │   │
│   │   │  Observer  │   5    │ Read-only Discord      │  │   │
│   │   │  Member    │  75    │ Full Discord + Events  │  │   │
│   │   │  Core      │ 500    │ Governance + Treasury  │  │   │
│   │   │  Council   │ 1000+  │ Leadership roles       │  │   │
│   │   └──────────────────────────────────────────────┘  │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        v                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    GOVERNANCE                        │   │
│   │                                                      │   │
│   │   Proposal Lifecycle:                                │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │                                            │    │   │
│   │   │   IDEA ──> DISCUSSION ──> PROPOSAL ──>    │    │   │
│   │   │     │          │            │              │    │   │
│   │   │     v          v            v              │    │   │
│   │   │  Discord    Forum      Snapshot            │    │   │
│   │   │                            │              │    │   │
│   │   │                            v              │    │   │
│   │   │                      ┌─────────┐          │    │   │
│   │   │                      │  VOTE   │          │    │   │
│   │   │                      └────┬────┘          │    │   │
│   │   │                           │               │    │   │
│   │   │              ┌────────────┼────────────┐  │    │   │
│   │   │              v            v            v  │    │   │
│   │   │           PASSED      REJECTED     QUORUM │    │   │
│   │   │              │                     NOT MET│    │   │
│   │   │              v                            │    │   │
│   │   │         EXECUTION                         │    │   │
│   │   │                                            │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│        │                                                     │
│        v                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                     TREASURY                         │   │
│   │                                                      │   │
│   │   ┌────────────────────────────────────────────┐    │   │
│   │   │                                            │    │   │
│   │   │   COMMUNITY TREASURY                       │    │   │
│   │   │   ┌──────────────────────────────────────┐│    │   │
│   │   │   │ Total: $2,500,000                    ││    │   │
│   │   │   │ ├── ETH:    $1,500,000 (60%)        ││    │   │
│   │   │   │ ├── USDC:   $500,000 (20%)          ││    │   │
│   │   │   │ └── $FWB:   $500,000 (20%)          ││    │   │
│   │   │   └──────────────────────────────────────┘│    │   │
│   │   │                                            │    │   │
│   │   │   Spending Categories:                     │    │   │
│   │   │   ├── Grants: 40%                         │    │   │
│   │   │   ├── Events: 25%                         │    │   │
│   │   │   ├── Operations: 20%                     │    │   │
│   │   │   └── Marketing: 15%                      │    │   │
│   │   │                                            │    │   │
│   │   └────────────────────────────────────────────┘    │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Real Products Reference

| Category | Examples | Key Features |
|----------|----------|--------------|
| **Decentralized Social Networks** | Farcaster, Lens Protocol, Bluesky, DeSo | Portable social graphs, user-owned data |
| **Creator Token Platforms** | Friend.tech, Rally.io, Stars Arena | Bonding curves, social speculation |
| **Content Monetization** | Mirror, Paragraph, Zora | NFT articles, subscriptions, permanent storage |
| **Social Trading** | Farcaster channels, Trade socially | Copy trading, social signals, leaderboards |
| **Reputation Systems** | Gitcoin Passport, Galxe, POAP | Soulbound tokens, credentials, scores |
| **Community DAOs** | FWB, Bankless DAO, Cabin | Token-gated access, governance, treasuries |

---

## Key Concepts

### Social Graph Portability
```
Traditional Social Media:
─────────────────────────
┌─────────────┐    ┌─────────────┐
│  Twitter    │    │  Instagram  │
│  Followers  │    │  Followers  │
│   (Owned    │    │   (Owned    │
│  by Twitter)│    │by Instagram)│
└─────────────┘    └─────────────┘
      X                  X
  (Not portable)    (Not portable)

Decentralized Social (Lens/Farcaster):
──────────────────────────────────────
┌─────────────────────────────────────┐
│         YOUR SOCIAL GRAPH           │
│         (On-chain, you own it)      │
│                                     │
│   ┌─────┐  ┌─────┐  ┌─────┐       │
│   │App 1│  │App 2│  │App 3│       │
│   └──┬──┘  └──┬──┘  └──┬──┘       │
│      └────────┼────────┘           │
│               v                     │
│      SAME FOLLOWERS EVERYWHERE      │
└─────────────────────────────────────┘
```

### Creator Tokens / Social Tokens
```
Creator Token Economics:
────────────────────────────
┌─────────────────────────────────────────────────┐
│                                                 │
│   Creator launches token (bonding curve)        │
│                  │                              │
│                  v                              │
│   Early supporters buy cheap                    │
│                  │                              │
│                  v                              │
│   Creator grows audience                        │
│                  │                              │
│                  v                              │
│   More demand → Price rises                     │
│                  │                              │
│                  v                              │
│   Token holders benefit from creator's success  │
│                                                 │
│   Benefits for holders:                         │
│   ├── Access to private chat/community          │
│   ├── Early access to content                   │
│   ├── IRL event tickets                         │
│   └── Revenue sharing                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Decentralized Identity
```
Web2 Identity:                Web3 Identity:
─────────────────            ─────────────────
┌─────────────┐              ┌─────────────┐
│ Email/Pass  │              │   Wallet    │
│ per platform│              │  Address    │
└─────────────┘              └──────┬──────┘
                                    │
                             ┌──────┴──────┐
                             │             │
                        ┌────┴────┐   ┌────┴────┐
                        │  ENS    │   │  Lens   │
                        │alice.eth│   │alice.lens│
                        └─────────┘   └─────────┘
                             │             │
                        ┌────┴─────────────┴────┐
                        │  ONE IDENTITY         │
                        │  ACROSS ALL APPS      │
                        └───────────────────────┘
```

### Content Ownership
```
Traditional Platforms:           Decentralized Platforms:
──────────────────────          ──────────────────────────
┌──────────────────┐            ┌──────────────────────────┐
│  Platform owns   │            │  Creator owns content    │
│  your content    │            │  stored on Arweave/IPFS  │
│                  │            │                          │
│  Can be:         │            │  Permanent storage       │
│  - Deleted       │            │  Censorship resistant    │
│  - Hidden        │            │  Monetizable forever     │
│  - Demonetized   │            │  Portable between apps   │
└──────────────────┘            └──────────────────────────┘
```

---

## Revenue Models

| Category | Revenue Source | Typical Range |
|----------|----------------|---------------|
| **Decentralized Social Networks** | Protocol fees, premium features | 0-5% fees, $5-20/mo premium |
| **Creator Token Platforms** | Trading fees on bonding curve | 5-10% per trade |
| **Content Monetization** | Platform cut of sales/subscriptions | 2.5-15% of creator earnings |
| **Social Trading** | Performance fees, subscription | 10-20% of profits, $20-100/mo |
| **Reputation Systems** | API access, verification fees | $0.01-1 per verification |
| **Community DAOs** | Membership tokens, treasury yield | Varies by DAO |

### Detailed Breakdown:

**Friend.tech Model (Creator Tokens):**
```
Revenue Streams:
├── Trading fee: 10% per trade
│   ├── 5% to creator (subject)
│   └── 5% to protocol
├── Volume drives revenue
└── Speculation creates activity

Example Calculation:
├── User buys 1 key at $10
│   └── Fee: $1 (10%)
│       ├── Creator gets: $0.50
│       └── Protocol gets: $0.50
│
├── Daily volume: $5,000,000
│   └── Daily protocol revenue: $250,000
│
└── Peak metrics (Aug 2023):
    ├── TVL: $50M+
    └── Daily fees: $1M+
```

**Farcaster Model (Decentralized Social):**
```
Revenue Streams:
├── Warps (in-app currency): Platform cut
├── Frame transactions: Potential fee layer
├── Premium subscriptions (future)
└── Enterprise/API access

Current Model:
├── Free to use (subsidized growth)
├── Hub operators pay for infrastructure
└── Monetization through ecosystem:
    ├── Client apps (Warpcast premium)
    └── Third-party integrations

Future Monetization:
├── Verified badges: $10-50/year
├── Enhanced analytics: $20-100/month
└── API access tiers: $100-1000/month
```

**Lens Protocol Model (Social Graph):**
```
Revenue Streams:
├── Collect fees: Creators set prices
│   └── Platform can add protocol fee
├── Follow fees: Optional paid follows
├── Module marketplace: Premium features
└── Enterprise integrations

Example Flows:
┌─────────────────────────────────────┐
│ FREE POST → Collect as NFT ($5)    │
│ ├── Creator: $4.75 (95%)           │
│ └── Protocol: $0.25 (5%)           │
│                                     │
│ PAID FOLLOW → $2/month             │
│ ├── Creator: $1.80 (90%)           │
│ └── Protocol: $0.20 (10%)          │
└─────────────────────────────────────┘
```

**Mirror Model (Content Monetization):**
```
Revenue Streams:
├── Writing NFT mints: 2.5% platform fee
├── Splits feature: Free (drives adoption)
└── Premium features: Future

Example:
┌─────────────────────────────────────┐
│ Article published on Mirror         │
│ ├── Open edition: 0.01 ETH         │
│ ├── 500 collectors                 │
│ └── Total: 5 ETH (~$10,000)        │
│                                     │
│ Revenue split:                      │
│ ├── Writer: 4.875 ETH (97.5%)      │
│ └── Mirror: 0.125 ETH (2.5%)       │
└─────────────────────────────────────┘
```

**Galxe/POAP Model (Reputation):**
```
Revenue Streams:
├── Campaign creation fees: $0-500+
├── NFT minting (gas subsidized by brands)
├── API/Enterprise: Custom pricing
└── Token (GAL) ecosystem value

Enterprise Pricing:
┌─────────────────────────────────────────┐
│ Tier          │ Price     │ Features   │
├─────────────────────────────────────────┤
│ Free          │ $0        │ Basic      │
│ Pro           │ $199/mo   │ Analytics  │
│ Enterprise    │ Custom    │ Full API   │
└─────────────────────────────────────────┘
```

**Community DAO Model (FWB example):**
```
Revenue Streams:
├── Token appreciation: Members hold $FWB
├── Membership fees: Entry via token purchase
├── Event tickets: IRL gatherings
├── Merchandise: Community brand
└── Treasury yield: DeFi strategies

Token Economics:
┌─────────────────────────────────────┐
│ $FWB Token                          │
│ ├── Required for membership (75+)  │
│ ├── Governance voting rights       │
│ ├── Treasury share                 │
│ └── Access to exclusive content    │
│                                     │
│ Treasury Allocation:                │
│ ├── Stablecoin yield: 5-10% APY   │
│ ├── ETH staking: 4-5% APY         │
│ └── Strategic investments          │
└─────────────────────────────────────┘
```

---

## SocialFi vs Traditional Social Media

```
┌────────────────────────────────────────────────────────────────────┐
│                    COMPARISON TABLE                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Aspect         │ Traditional        │ SocialFi                   │
│   ───────────────┼────────────────────┼───────────────────────────│
│   Data Ownership │ Platform owns      │ User owns (on-chain)      │
│   Monetization   │ Platform decides   │ Direct creator-fan        │
│   Identity       │ Platform-specific  │ Portable (wallet)         │
│   Censorship     │ Platform controls  │ Censorship resistant      │
│   Social Graph   │ Locked to platform │ Portable across apps      │
│   Revenue Split  │ 55% YouTube, etc   │ 90-100% to creators       │
│   Governance     │ Corporate control  │ Community/DAO control     │
│   Content        │ Can be deleted     │ Permanent (Arweave)       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

1. **Explore Decentralized Social**: Sign up for Farcaster (Warpcast) or Lens (Hey.xyz)
2. **Try Creator Tokens**: Experiment with Friend.tech on Base
3. **Publish Content**: Write on Mirror or Paragraph
4. **Build Reputation**: Collect POAPs and Galxe badges
5. **Join a DAO**: Apply to communities like FWB or Bankless

---

## Resources

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Lens Protocol Docs](https://docs.lens.xyz/)
- [Friend.tech](https://friend.tech/)
- [Mirror.xyz](https://mirror.xyz/)
- [Galxe](https://galxe.com/)
- [Gitcoin Passport](https://passport.gitcoin.co/)
