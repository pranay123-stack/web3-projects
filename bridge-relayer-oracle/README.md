# Bridge Relayer and Oracle System

A production-quality cross-chain bridge implementation featuring an oracle system for state verification and a Node.js relayer for message passing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Bridge Oracle System                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Source Chain                              Destination Chain                 │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │  MessageBridge  │                      │  MessageBridge  │               │
│  │                 │    State Root        │                 │               │
│  │  sendMessage()  │ ─────────────────►   │ executeMessage()│               │
│  └────────┬────────┘                      └────────▲────────┘               │
│           │                                        │                         │
│           │ MessageSent                            │ Proof                   │
│           │ Event                                  │ Verification            │
│           ▼                                        │                         │
│  ┌─────────────────┐                      ┌───────┴─────────┐               │
│  │                 │    Merkle Proof      │                 │               │
│  │    Relayer      │ ─────────────────►   │  BridgeOracle   │               │
│  │   (Node.js)     │                      │                 │               │
│  └─────────────────┘                      └───────┬─────────┘               │
│           │                                        │                         │
│           │                               Validator │ Consensus              │
│           │                                        ▼                         │
│           │                               ┌─────────────────┐               │
│           └──────────────────────────────►│ValidatorRegistry│               │
│                                           └─────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Smart Contracts

#### ValidatorRegistry.sol
- Validator registration with stake requirements
- Stake increase/decrease functionality
- Slashing mechanism with proposal and approval system
- Validator activity tracking
- Inactivity detection and deactivation

#### BridgeOracle.sol
- Cross-chain state root storage and verification
- Merkle proof verification
- Multi-validator consensus mechanism
- Threshold signature verification
- Support for multiple chains

#### MessageBridge.sol
- Generic cross-chain message passing
- Message queue with sequence numbers
- Fee estimation and management
- Relayer authorization system
- Pausable for emergency situations

#### MerkleProof.sol (Library)
- Standard merkle proof verification
- Index-based proof verification
- Sparse merkle tree support
- Batch verification
- On-chain root computation

### Relayer (Node.js)

#### Event Listener
- WebSocket and polling-based event listening
- Multi-chain support
- Automatic reconnection with exponential backoff
- Event queuing and parsing

#### Proof Generator
- Merkle tree construction
- Proof generation and caching
- Support for sparse merkle trees
- Memory management with pruning

#### Transaction Submitter
- Gas price management and estimation
- Nonce management
- Retry logic with exponential backoff
- Transaction replacement (speed up)
- Transaction cancellation

## Installation

### Prerequisites
- Node.js v18+
- npm or yarn

### Setup

```bash
# Install root dependencies
npm install

# Install relayer dependencies
cd relayer && npm install && cd ..
```

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy Contracts

```bash
# Start local node
npm run node

# In another terminal, deploy
npm run deploy:local
```

### Run Simulation

```bash
npm run simulate
```

### Start Relayer

```bash
cd relayer

# Configure environment (copy and edit .env)
cp ../.env.example .env

# Start relayer
npm start
```

## Configuration

### Environment Variables

```env
# RPC URLs
ETH_MAINNET_RPC=https://mainnet.infura.io/v3/YOUR_KEY
GOERLI_RPC=https://goerli.infura.io/v3/YOUR_KEY
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
LOCAL_RPC=http://127.0.0.1:8545

# Contract Addresses
LOCAL_BRIDGE=0x...
LOCAL_ORACLE=0x...

# Relayer Configuration
RELAYER_PRIVATE_KEY=0x...
MAX_GAS_PRICE=100000000000
GAS_PRICE_MULTIPLIER=1.1
MAX_RETRIES=3
RETRY_DELAY=5000
BATCH_SIZE=10
BATCH_INTERVAL=60000
HEALTH_CHECK_PORT=3000
LOG_LEVEL=info
```

### Contract Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| minimumStake | 0.1 ETH | Minimum validator stake |
| maximumValidators | 100 | Maximum number of validators |
| consensusThreshold | 66% | Required consensus for decisions |
| confirmationBlocks | 6 | Blocks to wait before finalization |
| updateTimeout | 1 hour | State root update timeout |
| baseFee | 0.001 ETH | Base fee for message sending |

## API Reference

### MessageBridge

#### Send Message
```solidity
function sendMessage(
    uint256 destChainId,
    address target,
    bytes calldata data,
    uint256 gasLimit
) external payable returns (bytes32 messageHash)
```

#### Estimate Fee
```solidity
function estimateFee(
    uint256 destChainId,
    uint256 gasLimit
) external view returns (uint256 fee)
```

### BridgeOracle

#### Verify Proof
```solidity
function verifyProof(
    uint256 chainId,
    uint256 blockNumber,
    bytes32[] calldata proof,
    bytes32 leaf
) external view returns (bool)
```

### ValidatorRegistry

#### Register Validator
```solidity
function registerValidator(
    bytes calldata publicKey
) external payable
```

## Testing

The test suite covers:
- Validator registration and management
- Stake management (increase/decrease)
- Slashing proposals and execution
- State root proposals and finalization
- Merkle proof verification
- Message sending and fee calculation
- Relayer authorization
- Full integration scenarios

Run specific test suites:

```bash
# All tests
npm test

# With gas reporting
REPORT_GAS=true npm test

# Specific test file
npx hardhat test test/Oracle.test.js
```

## Security Considerations

1. **Validator Security**: Validators must secure their private keys and maintain uptime to avoid slashing.

2. **Relayer Security**: The relayer private key should be stored securely and have limited funds.

3. **Proof Verification**: All cross-chain messages require valid merkle proofs before execution.

4. **Emergency Pause**: The bridge can be paused in case of detected exploits.

5. **Threshold Signatures**: Multiple validator signatures are required for state root finalization.

## Project Structure

```
bridge-relayer-oracle/
├── contracts/
│   ├── BridgeOracle.sol         # Oracle for state verification
│   ├── MessageBridge.sol        # Cross-chain message bridge
│   ├── ValidatorRegistry.sol    # Validator management
│   └── libraries/
│       └── MerkleProof.sol      # Merkle proof library
├── relayer/
│   ├── src/
│   │   ├── index.js             # Main entry point
│   │   ├── eventListener.js     # Event monitoring
│   │   ├── proofGenerator.js    # Merkle proof generation
│   │   ├── transactionSubmitter.js # TX management
│   │   └── config.js            # Configuration
│   └── package.json
├── scripts/
│   ├── deploy.js                # Deployment script
│   └── simulate-bridge.js       # Bridge simulation
├── test/
│   └── Oracle.test.js           # Comprehensive tests
├── hardhat.config.js
├── package.json
└── README.md
```

## License

MIT
