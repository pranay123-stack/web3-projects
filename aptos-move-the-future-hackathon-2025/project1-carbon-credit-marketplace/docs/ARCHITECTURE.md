# Carbon Credit Marketplace - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Homepage  │  │ Marketplace │  │ Portfolio│  │Verification│ │
│  └────────────┘  └─────────────┘  └──────────┘  └────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │  Aptos Wallet       │
                 │  Adapter Layer      │
                 └──────────┬──────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Aptos Blockchain                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Smart Contract Modules (Move)                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  NFT Module  │  │  Marketplace │  │ Verification │   │  │
│  │  │              │  │    Module    │  │    Module    │   │  │
│  │  │ - Mint       │  │ - Listings   │  │ - Verifiers  │   │  │
│  │  │ - Transfer   │  │ - Purchases  │  │ - Projects   │   │  │
│  │  │ - Retire     │  │ - Auctions   │  │ - Approval   │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Global State Storage                        │  │
│  │  - CarbonCreditCollection                                │  │
│  │  - MarketplaceState                                      │  │
│  │  - VerificationSystem                                    │  │
│  │  - Individual CarbonCredit Objects                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### Module: `carbon_credit_nft.move`

**Purpose**: Tokenize carbon offset credits as Aptos Digital Assets (NFTs)

**Key Structs**:

```move
struct CarbonCreditCollection has key {
    extend_ref: ExtendRef,
    total_credits_minted: u64,
    total_credits_retired: u64,
}

struct CarbonCredit has key {
    project_id: String,
    vintage_year: u64,
    credit_amount: u64,
    verification_standard: String,
    is_retired: bool,
    serial_number: String,
    location: String,
    project_type: String,
    extend_ref: ExtendRef,
}
```

**Public Functions**:

| Function | Type | Description |
|----------|------|-------------|
| `initialize_collection` | entry | Create carbon credit NFT collection |
| `mint_carbon_credit` | entry | Mint new carbon credit NFT with metadata |
| `transfer_carbon_credit` | entry | Transfer credit to another address |
| `retire_carbon_credit` | entry | Mark credit as retired (used) |
| `get_credit_details` | view | Query credit metadata |
| `is_credit_retired` | view | Check retirement status |
| `get_credit_amount` | view | Get credit amount in tonnes |

**Events**:

- `CarbonCreditMinted`: Emitted when new credit is created
- `CarbonCreditRetired`: Emitted when credit is burned/used
- `CarbonCreditTransferred`: Emitted on ownership transfer

---

### Module: `marketplace.move`

**Purpose**: Enable decentralized trading of carbon credits

**Key Structs**:

```move
struct Listing has store, drop {
    token_address: address,
    seller: address,
    price: u64,
    listing_type: u8,  // FIXED_PRICE or AUCTION
    expiration: u64,
    highest_bid: u64,
    highest_bidder: address,
    auction_end_time: u64,
    is_active: bool,
}

struct MarketplaceState has key {
    listings: vector<Listing>,
    total_volume: u64,
    total_credits_traded: u64,
    fee_basis_points: u64,
    fee_recipient: address,
}
```

**Public Functions**:

| Function | Type | Description |
|----------|------|-------------|
| `initialize_marketplace` | entry | Set up marketplace with fee structure |
| `create_listing` | entry | List credit at fixed price |
| `create_auction` | entry | Start auction for credit |
| `place_bid` | entry | Bid on auctioned credit |
| `finalize_auction` | entry | Close auction and determine winner |
| `purchase_credit` | entry | Buy credit at fixed price |
| `cancel_listing` | entry | Remove active listing |
| `get_marketplace_stats` | view | Query total volume and trades |
| `get_listing` | view | Get specific listing details |
| `get_active_listings_count` | view | Count active listings |

**Trading Flow**:

1. **Fixed Price**: Seller → List → Buyer purchases → Transfer + Payment
2. **Auction**: Seller → Start auction → Bidders compete → Finalize → Transfer to winner

**Fee Structure**:

- Configurable platform fee (basis points)
- Fee = (Price × fee_basis_points) / 10,000
- Example: 2.5% fee = 250 basis points
- Seller receives: Price - Fee
- Platform receives: Fee

---

### Module: `verification.move`

**Purpose**: On-chain registry and verification workflow for carbon offset projects

**Key Structs**:

```move
struct Verifier has store, drop, copy {
    address: address,
    organization: String,
    is_active: bool,
    verified_count: u64,
    authorized_at: u64,
}

struct Project has store, drop {
    project_id: String,
    name: String,
    developer: address,
    standard: String,
    location: String,
    project_type: String,
    total_credits_approved: u64,
    credits_issued: u64,
    status: u8,  // PENDING, VERIFIED, REJECTED, SUSPENDED
    verified_by: address,
    verified_at: u64,
    metadata_uri: String,
}

struct VerificationSystem has key {
    admin: address,
    verifiers: vector<Verifier>,
    projects: vector<Project>,
    total_verified_projects: u64,
}
```

**Public Functions**:

| Function | Type | Description |
|----------|------|-------------|
| `initialize_verification_system` | entry | Set up verification registry |
| `add_verifier` | entry | Authorize new verifier (admin only) |
| `remove_verifier` | entry | Revoke verifier access (admin only) |
| `submit_project` | entry | Developer submits project for review |
| `verify_project` | entry | Verifier approves project (verifiers only) |
| `reject_project` | entry | Verifier rejects project |
| `record_credits_issued` | entry | Track credit minting against approved amount |
| `get_project` | view | Query project details |
| `get_system_stats` | view | Get verification statistics |
| `is_verifier` | view | Check if address is authorized verifier |

**Verification Workflow**:

```
Developer          Verifier           System
    │                  │                 │
    │──Submit Project──►│                 │
    │                  │                 │
    │                  │──Review──────►  │
    │                  │                 │
    │                  │──Approve/Reject─►│
    │                  │                 │
    │◄─Notification────┤                 │
    │                  │                 │
    │──Mint Credits────┼────────────────►│
    │                  │                 │
    │                  │──Track Issuance─►│
```

---

## Data Flow

### Carbon Credit Lifecycle

```
┌────────────────┐
│  Project       │
│  Submission    │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Verifier      │
│  Review        │
└───────┬────────┘
        │
        ▼
┌────────────────┐      ┌────────────────┐
│  Approved      │─────►│  Mint Credit   │
│  Project       │      │  NFT           │
└────────────────┘      └───────┬────────┘
                                │
                                ▼
                        ┌────────────────┐
                        │  List on       │
                        │  Marketplace   │
                        └───────┬────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  Trade    │   │  Hold     │   │  Retire   │
        └───────────┘   └───────────┘   └───────────┘
```

### Purchase Transaction Flow

```
Buyer Initiates Purchase
        │
        ▼
┌──────────────────────┐
│  Verify Listing      │  ← Check active, not expired
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Calculate Fee       │  ← fee = price × fee_bp / 10000
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Transfer Payment    │  ← Buyer → Seller (price - fee)
│  to Seller           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Transfer Fee        │  ← Buyer → Platform (fee)
│  to Platform         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Transfer NFT        │  ← Seller → Buyer
│  to Buyer            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Update Stats &      │  ← Increment volume, emit events
│  Emit Events         │
└──────────────────────┘
```

---

## Security Considerations

### Access Control

1. **Ownership Verification**
   ```move
   assert!(object::owner(token) == signer::address_of(seller), E_NOT_AUTHORIZED);
   ```

2. **Verifier Authorization**
   ```move
   assert!(is_authorized_verifier(&verifiers, verifier_addr), E_NOT_AUTHORIZED);
   ```

3. **Admin-Only Functions**
   ```move
   assert!(system.admin == signer::address_of(admin), E_NOT_AUTHORIZED);
   ```

### State Integrity

1. **Retirement Check**: Prevent trading of retired credits
2. **Double-Spending Prevention**: Move's resource model prevents duplication
3. **Auction Finalization**: Verify auction has ended before finalizing
4. **Credit Issuance Limits**: Track issued vs. approved credits

### Input Validation

```move
assert!(credit_amount > 0, E_INVALID_CREDIT_AMOUNT);
assert!(string::length(&project_id) > 0, E_INVALID_PROJECT_DATA);
assert!(price > 0, E_INVALID_PRICE);
```

### Event Emission

All state-changing operations emit events for:
- Off-chain indexing
- Audit trail
- Transparency
- Analytics

---

## Gas Optimization

### Parallel Execution

Aptos Block-STM enables parallel transaction execution:
- Multiple independent purchases can execute concurrently
- No conflict on different NFT objects
- Marketplace throughput scales with validators

### Efficient Storage

- Use `vector` for listings (dynamic sizing)
- Store only active listings in state
- Minimize on-chain storage with IPFS for documents

### Batching Opportunities

- Batch minting for project developers
- Bulk retirement for corporate offsetting
- Multi-credit marketplace operations

---

## Frontend Integration

### Aptos SDK Usage

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const aptos = new Aptos(new AptosConfig({
  network: Network.TESTNET
}));

// Call smart contract
const transaction = await aptos.transaction.build.simple({
  sender: account.address,
  data: {
    function: 'carbon_marketplace::marketplace::purchase_credit',
    typeArguments: [],
    functionArguments: [listingIndex],
  },
});

const response = await signAndSubmitTransaction({ transaction });
```

### Wallet Integration

```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { account, signAndSubmitTransaction } = useWallet();
```

### Event Listening

```typescript
// Query events
const events = await aptos.getAccountEventsByEventType({
  accountAddress: moduleAddress,
  eventType: `${moduleAddress}::carbon_credit_nft::CarbonCreditMinted`,
});
```

---

## Deployment Strategy

### Testnet Deployment

```bash
aptos move publish \
  --named-addresses carbon_marketplace=0xYOUR_ADDRESS \
  --network testnet \
  --assume-yes
```

### Mainnet Deployment

1. **Security Audit**: Review all smart contracts
2. **Multi-sig**: Use multi-sig wallet for deployment
3. **Gradual Rollout**: Start with limited verifiers
4. **Monitoring**: Set up event indexing and analytics

### Upgrade Strategy

- Public function signatures are immutable
- Use upgrade policies for controlled updates
- Test on testnet before mainnet upgrades
- Community governance for major changes

---

## Performance Metrics

### Target Performance

- **Transaction Finality**: < 1 second
- **Gas Cost**: ~0.001 APT per transaction
- **Throughput**: 100+ TPS for marketplace operations
- **Concurrent Users**: Unlimited (parallel execution)

### Monitoring

- Total credits minted
- Trading volume (APT)
- Active listings count
- Retirement statistics
- Verifier activity

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Fractional Credits**: Split 1-tonne credits into smaller units
2. **Price Oracle**: Real-time price feeds from external sources
3. **Batch Operations**: Mint/trade multiple credits in one transaction
4. **Royalty System**: Developer royalties on secondary sales

### Phase 3: Ecosystem Integration

1. **Cross-chain Bridge**: Enable credits from other blockchains
2. **API Integration**: Connect with Verra registry API
3. **Corporate Dashboard**: B2B carbon accounting tools
4. **Mobile App**: React Native application

### Phase 4: Governance

1. **DAO Structure**: Community governance for platform decisions
2. **Staking**: Stake APT for governance rights
3. **Dispute Resolution**: Decentralized arbitration for issues
4. **Protocol Fees**: Community-controlled fee structure

---

## Conclusion

This architecture leverages Aptos Move's unique features:
- **Object Standard** for efficient NFT management
- **Parallel Execution** for high throughput
- **Resource Model** for security guarantees
- **Event System** for transparency

The modular design allows independent development and testing of each component while maintaining clear interfaces between modules.
