# AI Data Marketplace - Demo Video Script

**Duration**: 5 minutes
**Target**: Hackathon judges, AI developers, data scientists
**Tone**: Technical yet accessible, innovation-focused

---

## 🎬 Opening (0:00 - 0:30)

### Visual
- Screen: GitHub repository with 10/10 tests passing
- Transition to: Aptos Explorer showing deployed contract

### Script
> "Welcome to the AI Data Marketplace - the first decentralized platform for tokenizing, licensing, and trading AI training datasets with complete on-chain provenance tracking.
>
> I'm Pranay, and I'm solving one of AI's biggest problems: the broken data economy.
>
> Today's AI data markets are centralized platforms like Kaggle and AWS Data Exchange. They charge 20-30% fees, offer inflexible all-or-nothing licensing, and provide zero transparency when your dataset trains a commercial AI model.
>
> We're changing that with blockchain technology on Aptos."

**[Duration: 30 seconds]**

---

## 🎯 Problem Statement (0:30 - 1:00)

### Visual
- Slide with statistics:
  - "$150B AI training data market by 2030"
  - "30% platform fees on centralized marketplaces"
  - "No provenance tracking for AI models"
  - "All-or-nothing licensing"

### Script
> "The AI training data market faces four critical challenges:
>
> **First**, centralization. Platforms like Kaggle and AWS Data Exchange take 20-30% fees and lock you into their ecosystem.
>
> **Second**, inflexible licensing. You buy the whole dataset or nothing. No monthly subscriptions, no pay-per-use, no training-only licenses.
>
> **Third**, zero provenance. When your carefully curated medical imaging dataset trains a $100 million commercial AI model, there's no record. No attribution. No royalties.
>
> **Fourth**, quality uncertainty. You can't verify data quality or see ratings from other AI developers before purchasing.
>
> This $150 billion market needs decentralization, transparency, and fair compensation for data providers."

**[Duration: 30 seconds]**

---

## 💡 Solution Overview (1:00 - 1:45)

### Visual
- Architecture diagram showing:
  - 4 modules: Data Asset, Marketplace, Access Control, AI Model Registry
  - Flow: Upload → Tokenize → License → Access → Train → Register Model

### Script
> "Our solution uses four integrated smart contract modules built entirely in Move:
>
> **Module 1: Data Asset** - We tokenize datasets as NFTs with comprehensive metadata: category, size, quality metrics, and encryption hash. This creates true digital ownership.
>
> **Module 2: Data Marketplace** - We support four pricing models: one-time purchase, monthly subscription, pay-per-use, and tiered pricing. Data providers choose what works for their business.
>
> **Module 3: Access Control** - Think of this as on-chain JWT tokens. When someone licenses your data, they get an access token with time limits, usage limits, and an encryption key. All enforced by smart contracts, not hoping users follow license terms.
>
> **Module 4: AI Model Registry** - This is the innovation. AI developers register their trained models on-chain, linking them to the datasets used for training. This creates transparent, immutable provenance from data to AI.
>
> The entire system runs on Aptos, with all 10 out of 10 tests passing."

**[Duration: 45 seconds]**

---

## 🎮 Live Demo (1:45 - 4:00)

### Part 1: Testnet Deployment (1:45 - 2:00)

#### Visual
- Aptos Explorer: Account page showing 4 deployed modules
- URL: `https://explorer.aptoslabs.com/account/0x7a5aae...`

#### Script
> "Let me show you the live deployment on Aptos testnet.
>
> Here's our contract address. You can see all four modules deployed:
> - data_asset: 313 lines
> - data_marketplace: 441 lines
> - access_control: 409 lines
> - ai_model_registry: 456 lines
>
> That's 1,619 lines of production-quality Move code, all tested and deployed.
>
> The deployment transaction shows success with minimal gas costs - under $0.10 total thanks to Aptos's efficiency."

**[Duration: 15 seconds]**

---

### Part 2: Dataset Tokenization (2:00 - 2:30)

#### Visual
- Show transactions:
  - Initialize marketplace
  - Create dataset NFT
  - Show dataset metadata in explorer

#### Script
> "Let's walk through a real-world example. Meet Dr. Sarah - she's collected 50,000 annotated medical images for AI training.
>
> **Step 1: Marketplace Initialization** - First transaction sets up the platform with 2.5% fee (much lower than centralized platforms' 30%).
>
> **Step 2: Dataset Minting** - Dr. Sarah mints her dataset as an NFT. Look at this metadata stored on-chain:
> - Name: 'Medical Dermatology Dataset v2'
> - Category: Healthcare
> - Size: 50,000 images
> - Quality score: 95/100 (from peer reviews)
> - Encryption hash: Points to IPFS/Arweave storage
> - License terms: Embedded in the NFT
>
> This NFT represents true ownership. Dr. Sarah controls access, pricing, and licensing - not a centralized platform."

**[Duration: 30 seconds]**

---

### Part 3: Flexible Licensing (2:30 - 3:00)

#### Visual
- Show transactions:
  - Set up subscription pricing
  - License purchase
  - Access token issuance

#### Script
> "Now comes the magic - flexible, multi-tier licensing.
>
> **Transaction 1**: Dr. Sarah sets up pricing:
> - Monthly subscription: 500 APT
> - One-time purchase: 5,000 APT
> - Training-only license: 300 APT (can't use for commercial deployment)
>
> **Transaction 2**: VisionAI, a startup, purchases a monthly subscription for 500 APT.
>
> **Transaction 3**: The smart contract automatically issues an access token. Let me show you what's in this token:
> - Token ID: Unique identifier
> - User: VisionAI's address
> - Expires: 30 days from now (block timestamp)
> - Usage limit: Unlimited during subscription
> - Encryption key: For decrypting the dataset
> - Is active: True
>
> This token is checked on every data access request. When it expires, access automatically revokes. No human intervention needed."

**[Duration: 30 seconds]**

---

### Part 4: AI Provenance Tracking (3:00 - 3:40)

#### Visual
- Show transactions:
  - Model registration
  - Link datasets to model
  - Record performance metrics

#### Script
> "Here's where we go beyond every existing platform - AI provenance tracking.
>
> **30 days later**: VisionAI has trained a food recognition model using Dr. Sarah's medical data... wait, that doesn't make sense for food recognition. Let me use a better example.
>
> Actually, VisionAI trains a skin condition classifier using the dermatology dataset.
>
> **Transaction 1: Register Model** - VisionAI registers their model on-chain:
> - Model name: 'SkinClassifier v1.0'
> - Architecture: CNN
> - Version: 1.0
> - Purpose: Medical diagnosis
>
> **Transaction 2: Link Training Data** - The smart contract records that this model was trained using Dataset ID 1 (Dr. Sarah's data). This link is permanent and public.
>
> **Transaction 3: Performance Metrics** - VisionAI adds accuracy: 94.5%, F1 score: 92.3%, training time: 48 hours.
>
> Now anyone can see:
> - Which datasets trained this AI model
> - Who provided those datasets (Dr. Sarah)
> - How well the model performs
> - When it was trained
>
> This creates transparent attribution. If VisionAI's AI generates $1 million in revenue, Dr. Sarah has proof her data contributed to its success. She can negotiate royalties or include this in her portfolio."

**[Duration: 40 seconds]**

---

### Part 5: Quality & Reputation (3:40 - 4:00)

#### Visual
- Show transactions:
  - Rate dataset
  - Quality score update
  - Revenue distribution

#### Script
> "The final piece: quality and reputation.
>
> **Transaction**: After training, VisionAI rates Dr. Sarah's dataset 5 out of 5 stars. They praise the annotation quality and consistency.
>
> This rating is permanently on-chain. Future AI developers see:
> - 5.0 average rating
> - Used to train 3 successful models
> - Generated 150,000 APT in total revenue
>
> Dr. Sarah's reputation grows. Her next dataset commands higher prices.
>
> And look at this revenue distribution transaction - the platform fee (2.5%) automatically splits to the treasury. Dr. Sarah gets 97.5%. No intermediaries taking 30%."

**[Duration: 20 seconds]**

---

## 🏆 Innovation & Impact (4:00 - 4:30)

### Visual
- Slide with key differentiators:
  - "First on-chain AI provenance system"
  - "4 pricing models vs. 1 (buy-only)"
  - "2.5% fees vs. 30% (traditional)"
  - "10/10 tests passing"

### Script
> "Why is this revolutionary?
>
> **For Data Providers**:
> - Keep 97.5% of revenue vs. 70%
> - Flexible licensing creates recurring revenue
> - Provenance tracking enables royalty negotiations
> - On-chain reputation builds credibility
>
> **For AI Developers**:
> - Pay for what you need (monthly, not $50k upfront)
> - Verify data quality before purchase (ratings)
> - Transparent licensing terms in smart contracts
> - Build on proven datasets (performance metrics)
>
> **For the AI Ecosystem**:
> - Transparent attribution prevents data theft
> - Quality reputation incentivizes better datasets
> - Lower costs democratize AI development
> - Provenance enables AI governance and compliance
>
> This addresses a $150 billion market growing to $500 billion by 2030.
>
> Built on Aptos because we need:
> - Low gas fees (datasets = large metadata)
> - Parallel execution (multiple licenses simultaneously)
> - Move's safety (protecting valuable IP)"

**[Duration: 30 seconds]**

---

## 🚀 Future & Closing (4:30 - 5:00)

### Visual
- Roadmap slide
- Test results: 10/10 passing
- GitHub repository

### Script
> "Our roadmap includes:
>
> **Q1 2026**: Frontend dashboard and dataset preview functionality
> **Q2 2026**: Integration with Hugging Face and Kaggle for easy migration
> **Q3 2026**: Automated royalty distribution to data contributors
> **Q4 2026**: Cross-chain AI model registry (Ethereum, Polygon)
>
> This project targets three prizes:
> - **Best Data Economy/AI Application**: First decentralized AI data marketplace
> - **Best Move Smart Contract**: 1,619 lines, 10/10 tests, innovative provenance tracking
> - **Grand Prize**: Solving a $150B market problem with complete technical execution
>
> All code is open source. All tests passing. Deployed on Aptos testnet right now.
>
> Verify everything at our GitHub repository or explore the live contracts on Aptos Explorer.
>
> Thank you. Let's build a fair, transparent AI economy together."

**[Duration: 30 seconds]**

---

## 🎥 Production Notes

### Technical Setup
- **Screen Recording**: OBS Studio at 1080p, 60fps
- **Audio**: USB condenser mic, noise suppression enabled
- **Browser**: Chrome with extensions disabled for clean UI
- **Multiple Tabs**: Pre-load all Aptos Explorer pages in order

### Visual Assets Needed
1. Title slide: "AI Data Marketplace on Aptos"
2. Problem statement infographic (4 problems)
3. Architecture diagram (4 modules with flow)
4. Live demo: 8+ transaction recordings from Aptos Explorer
5. Comparison table: Traditional vs. Our Platform
6. Roadmap slide (4 phases)
7. Closing slide with GitHub URL and testnet address

### Delivery Tips
- **Technical Balance**: Use analogies for complex concepts (e.g., "on-chain JWT")
- **Energy**: Enthusiastic about innovation, especially provenance tracking
- **Pacing**: Slow down during technical demo (let viewers process)
- **Screen Highlights**: Use cursor/annotation to emphasize important data
- **Transitions**: "Now watch this", "Here's the innovation", "This is crucial"

### Time Allocation
| Section | Time | Purpose |
|---------|------|---------|
| Opening | 0:30 | Hook + Credibility |
| Problem | 0:30 | Market need |
| Solution | 0:45 | Architecture overview |
| Live Demo | 2:15 | Proof it works (most important!) |
| Innovation | 0:30 | Differentiation |
| Future | 0:30 | Vision + CTA |
| **Total** | **5:00** | **Perfect** |

### Key Points to Emphasize
1. ✅ **First AI provenance system** - unique innovation
2. ✅ **10/10 tests passing** - production quality
3. ✅ **4 modules, 1,619 lines** - comprehensive solution
4. ✅ **Live on testnet** - not vaporware
5. ✅ **Aptos advantages** - low fees, parallel execution

### Unique Selling Points to Highlight
- 🎯 **Provenance tracking** - No competitor has this
- 🎯 **Multi-tier licensing** - Most flexible in the market
- 🎯 **On-chain access control** - Enforceable, not honor system
- 🎯 **Quality reputation** - Transparent, gamification-resistant
- 🎯 **2.5% fees** - 10x cheaper than competition

---

## 📋 Pre-Recording Checklist

- [ ] Load all Aptos Explorer transactions in separate tabs
- [ ] Test transaction load times (cache if slow)
- [ ] Prepare architecture diagram in high resolution
- [ ] Export comparison table as image
- [ ] Clear browser cookies/cache for clean UI
- [ ] Disable OS notifications during recording
- [ ] Test microphone with practice recording
- [ ] Practice pronunciation: "provenance" (PROV-uh-nence)
- [ ] Time each section in practice run
- [ ] Have backup video clips in case live demo freezes
- [ ] Prepare slides in Google Slides (faster loading)
- [ ] Screenshot all key transactions as backup

---

## 🎯 Success Metrics

A successful demo video will:
1. ✅ Clearly explain AI data market problem in first 60 seconds
2. ✅ Demonstrate all 4 modules working on testnet
3. ✅ Show complete user journey (tokenize → license → train → register)
4. ✅ Emphasize provenance tracking as unique innovation
5. ✅ Highlight technical execution (10/10 tests, 1,619 lines)
6. ✅ Stay within 5:00 time limit
7. ✅ Maintain professional A/V quality throughout
8. ✅ Include clear GitHub/Explorer links in closing

---

## 💡 Judge Appeal Strategy

**For Technical Judges**:
- Emphasize 10/10 test coverage
- Show clean architecture (4 modular contracts)
- Highlight Move-specific features (resource safety for IP)

**For Business Judges**:
- Focus on $150B → $500B market opportunity
- Stress 97.5% revenue share vs. 70% on traditional platforms
- Show clear monetization (2.5% platform fee)

**For Innovation Judges**:
- **Provenance tracking** - First in the world for AI data
- Multi-tier licensing innovation
- On-chain enforceable access control

---

**This script showcases your AI Data Marketplace as a complete, innovative, production-ready solution that addresses a massive market with cutting-edge blockchain technology.** 🤖📊🚀
