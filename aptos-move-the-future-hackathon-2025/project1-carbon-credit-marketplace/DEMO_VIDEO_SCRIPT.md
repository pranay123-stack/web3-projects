# Carbon Credit RWA Marketplace - Demo Video Script

**Duration**: 5 minutes
**Target**: Hackathon judges and potential users
**Tone**: Professional, impactful, solution-focused

---

## 🎬 Opening (0:00 - 0:30)

### Visual
- Screen: GitHub repository homepage
- Transition to: Aptos Explorer showing deployed contract

### Script
> "Hi, I'm Pranay, and I'm excited to present the Carbon Credit RWA Marketplace - a blockchain solution that's transforming how we fight climate change.
>
> The voluntary carbon market is broken. It's centralized, expensive, and lacks transparency. A single audit costs up to $50,000, and credits can only be purchased in bulk, excluding individuals and small businesses.
>
> We're fixing this with blockchain technology on Aptos."

**[Duration: 30 seconds]**

---

## 🎯 Problem Statement (0:30 - 1:00)

### Visual
- Slide/Screen with statistics:
  - "$2 billion voluntary carbon market"
  - "High barriers: minimum 1 tonne purchases"
  - "Expensive verification: $5k-$50k"
  - "Risk of double-counting"

### Script
> "Today's carbon markets have three critical problems:
>
> **First**, accessibility. Carbon credits are only sold in large quantities - minimum 1 tonne. Regular people can't offset their flights or daily carbon footprint.
>
> **Second**, transparency. There's no public record of who retired which credits, leading to double-counting and fraud.
>
> **Third**, verification costs. Small carbon offset projects can't afford the $5,000 to $50,000 verification fees, so they never reach the market.
>
> This leaves billions of dollars of climate action on the table."

**[Duration: 30 seconds]**

---

## 💡 Solution Overview (1:00 - 1:45)

### Visual
- Architecture diagram showing:
  - 3 modules: NFT, Marketplace, Verification
  - Flow: Project → Verification → Tokenization → Trading → Retirement

### Script
> "Our solution brings carbon credits on-chain as Real-World Assets using three smart contract modules:
>
> **Module 1: Carbon Credit NFT** - We tokenize verified carbon offset projects as Aptos Digital Asset NFTs. Each NFT contains complete metadata: the project ID, vintage year, credit amount, verification standard like Verra or Gold Standard, and a unique serial number.
>
> **Module 2: Marketplace** - Credits can be traded in two ways: fixed-price listings or time-based auctions. This creates true price discovery and market liquidity.
>
> **Module 3: On-Chain Verification** - We've built a decentralized registry where multiple authorized verifiers can approve projects. This eliminates the single point of failure and reduces costs.
>
> Everything happens on Aptos blockchain, leveraging Move's resource safety and parallel execution for efficiency."

**[Duration: 45 seconds]**

---

## 🎮 Live Demo (1:45 - 4:00)

### Part 1: Testnet Deployment (1:45 - 2:00)

#### Visual
- Aptos Explorer: Account page showing deployed modules
- URL: `https://explorer.aptoslabs.com/account/0x7a5aae...`

#### Script
> "Let me show you our live testnet deployment.
>
> Here's our contract address on Aptos testnet. You can see all three modules deployed: carbon_credit_nft, marketplace, and verification.
>
> This deployment transaction was successful, and the contract has been initialized with zero gas issues - thanks to Aptos's efficient Move VM."

**[Duration: 15 seconds]**

---

### Part 2: Project Verification (2:00 - 2:30)

#### Visual
- Show transaction: Verifier registration
- Show transaction: Project submission
- Show transaction: Project approval

#### Script
> "Let me walk you through the complete workflow, starting with verification.
>
> **Step 1**: We register an authorized verifier - in this case, Verra, the world's leading carbon standard. You can see the transaction here on-chain.
>
> **Step 2**: A project developer submits their carbon offset project - let's say a solar farm in Indonesia. All project details are stored on-chain: location, project type, estimated carbon credits.
>
> **Step 3**: The verifier reviews the documentation off-chain and approves the project on-chain. Notice the approval transaction includes the exact number of credits authorized - 95,000 tonnes in this example.
>
> This entire verification process is transparent and auditable by anyone."

**[Duration: 30 seconds]**

---

### Part 3: Credit Minting & Trading (2:30 - 3:15)

#### Visual
- Show transaction: Minting carbon credit NFT
- Show transaction: Listing on marketplace
- Show transaction: Purchase
- Show NFT metadata in explorer

#### Script
> "Now the exciting part - tokenization and trading.
>
> **Minting**: The project developer mints carbon credits as NFTs. Each NFT represents 1 tonne of CO2 offset. Let me show you the metadata: project ID, vintage year 2024, verification standard, serial number - everything needed for compliance.
>
> **Listing**: Credits can be listed for sale. This transaction shows a fixed-price listing at 12 APT per credit - about $10 at current prices. We also support auctions for price discovery.
>
> **Purchase**: Here's a buyer purchasing a credit. The smart contract automatically:
> - Deducts the 1% platform fee
> - Transfers payment to the seller
> - Transfers the NFT to the buyer
> - Emits events for complete transparency
>
> All of this happens atomically in a single transaction - no escrow needed thanks to Move's resource model."

**[Duration: 45 seconds]**

---

### Part 4: Credit Retirement (3:15 - 3:45)

#### Visual
- Show transaction: Retirement
- Show retired credit metadata (is_retired = true)

#### Script
> "The final step is retirement - the whole point of carbon offsetting.
>
> When a user wants to offset their carbon footprint, they retire the credit. This transaction permanently marks the NFT as retired. You can see here: `is_retired` is now `true`.
>
> Retired credits cannot be transferred or traded ever again. This creates an immutable, transparent proof of carbon offsetting that's publicly verifiable on the blockchain.
>
> No central authority needed. No possibility of double-counting. Just math and code.
>
> A corporation can include these transaction hashes in their ESG reports. An auditor can verify them directly on-chain. An insurance company can check them instantly."

**[Duration: 30 seconds]**

---

### Part 5: Frontend Demo (3:45 - 4:00)

#### Visual
- Show React frontend (if available):
  - Home page
  - Marketplace page with listings
  - Wallet connection (Petra)
  - My Credits page

#### Script
> "We've also built a complete frontend using React and the Aptos Wallet Adapter.
>
> Users can connect their Petra wallet, browse the marketplace, purchase credits, and retire them - all through a simple, intuitive interface.
>
> This isn't just a smart contract - it's a complete, production-ready platform."

**[Duration: 15 seconds]**

---

## 🏆 Impact & Innovation (4:00 - 4:30)

### Visual
- Slide with key metrics:
  - "10x cheaper than traditional audits"
  - "Fractional ownership (planned)"
  - "100% transparent"
  - "Instant settlement"

### Script
> "Why does this matter?
>
> **Accessibility**: We're planning fractional credits in Phase 2. Buy 0.1 tonnes for your weekly commute, not a full tonne.
>
> **Affordability**: On-chain verification costs a fraction of traditional audits. More projects can participate.
>
> **Transparency**: Every credit, every retirement, every transaction - publicly verifiable forever.
>
> **Speed**: Instant settlement. No waiting weeks for clearinghouse confirmations.
>
> This addresses a $2 billion market with room to grow to $50 billion by 2030 according to McKinsey.
>
> And it's built on Aptos, where parallel execution means multiple marketplace trades can happen simultaneously, and gas fees stay under a penny per transaction."

**[Duration: 30 seconds]**

---

## 🚀 Future & Closing (4:30 - 5:00)

### Visual
- Roadmap slide
- GitHub repository
- Contact information

### Script
> "Our roadmap is ambitious:
>
> **Q1 2026**: Fractional credits and batch minting
> **Q2 2026**: Integration with real carbon registries like Verra's API
> **Q3 2026**: Mainnet launch after professional security audit
> **Q4 2026**: Corporate carbon accounting dashboard and mobile apps
>
> This project targets three hackathon prizes:
> - **Best RWA Application**: Carbon credits as tokenized real-world assets
> - **Social Impact Prize**: Direct contribution to climate action
> - **Grand Prize**: Innovation + technical execution + ecosystem impact
>
> All code is open source on GitHub. The contracts are live on Aptos testnet. Everything you saw today is verifiable right now.
>
> Thank you for watching. Let's move the future toward a sustainable, transparent carbon market.
>
> Together, we can make climate action accessible to everyone."

**[Duration: 30 seconds]**

---

## 🎥 Production Notes

### Technical Setup
- **Screen Recording**: Use OBS Studio or Loom (1080p, 60fps)
- **Audio**: Clear microphone (USB condenser mic recommended)
- **Editing**: DaVinci Resolve or Camtasia for transitions
- **Background Music**: Subtle, professional (Epidemic Sound or Artlist)

### Visual Assets Needed
1. Title slide with project logo
2. Problem statement infographic
3. Architecture diagram (already created)
4. Live demo: Aptos Explorer screenshots/recording
5. Roadmap slide
6. Closing slide with GitHub URL

### Delivery Tips
- **Pace**: Speak clearly at ~150 words per minute
- **Energy**: Enthusiastic but professional
- **Pauses**: Brief pause after key statistics for emphasis
- **Transitions**: Use "Now", "Let me show you", "Here's the key part" for flow
- **Screen Pointer**: Highlight important elements as you discuss them

### Time Allocation Breakdown
| Section | Time | Purpose |
|---------|------|---------|
| Opening | 0:30 | Hook + Problem intro |
| Problem Statement | 0:30 | Establish need |
| Solution Overview | 0:45 | Architecture + approach |
| Live Demo | 2:15 | Show it working (most important!) |
| Impact & Innovation | 0:30 | Value proposition |
| Future & Closing | 0:30 | Vision + CTA |
| **Total** | **5:00** | **Perfect timing** |

### Key Points to Emphasize
1. ✅ **Live on testnet** - not just slides, it's real
2. ✅ **Complete solution** - smart contracts + frontend
3. ✅ **Real-world problem** - $3.8B in hacks, climate crisis
4. ✅ **Aptos advantages** - parallel execution, low fees, Move safety
5. ✅ **Production ready** - comprehensive testing, deployment, docs

### Common Pitfalls to Avoid
- ❌ Don't spend too long on technical details judges won't understand
- ❌ Don't rush through the demo - that's what they want to see
- ❌ Don't forget to show the actual transactions on Aptos Explorer
- ❌ Don't skip the "why Aptos" explanation
- ❌ Don't end without clear call-to-action (GitHub, testnet links)

---

## 📋 Pre-Recording Checklist

- [ ] Test all Aptos Explorer links (ensure they load quickly)
- [ ] Prepare browser tabs in order of demo flow
- [ ] Clear browser history/bookmarks for clean screenshots
- [ ] Test microphone levels
- [ ] Close unnecessary applications (notifications off)
- [ ] Have backup screen recordings of transactions in case live demo lags
- [ ] Practice full run-through at least 3 times
- [ ] Time each section to ensure staying within 5:00
- [ ] Prepare slides in Google Slides or PowerPoint
- [ ] Export slides as images for faster loading during recording

---

## 🎯 Success Metrics

A successful demo video will:
1. ✅ Clearly explain the problem in first 60 seconds
2. ✅ Show live, working code on Aptos testnet
3. ✅ Demonstrate complete user workflow (verification → minting → trading → retirement)
4. ✅ Highlight Aptos-specific advantages
5. ✅ Stay within 5:00 time limit
6. ✅ Have professional audio and video quality
7. ✅ Include clear call-to-action (GitHub, Explorer links)
8. ✅ Be engaging and easy to understand for non-technical judges

---

**Good luck with your recording! This script is designed to maximize your presentation score and showcase the innovation, technical execution, and real-world impact of your Carbon Credit RWA Marketplace.** 🌍🚀
