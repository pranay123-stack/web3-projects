# Cross-Chain Token Bridge

A production-quality cross-chain token bridge implementation demonstrating KADENA <-> EVM bridge capabilities. This project implements a secure, multi-signature validated bridge for transferring ERC20 tokens between different blockchain networks.

## Overview

This bridge system consists of three main smart contracts:

1. **SourceChainBridge**: Deployed on the source chain to lock tokens when users want to bridge to another chain
2. **DestinationChainBridge**: Deployed on the destination chain to mint wrapped tokens representing the locked assets
3. **WrappedToken**: ERC20 token representing locked assets from the source chain

## Architecture

```
Source Chain                          Destination Chain
+-------------------+                 +----------------------+
|                   |                 |                      |
| SourceChainBridge |                 | DestinationChainBridge|
|                   |                 |                      |
| - lockTokens()    | ----Events---> | - mintWrappedTokens()|
| - unlockTokens()  | <---Events---- | - burnWrappedTokens()|
|                   |                 |                      |
+-------------------+                 +----------------------+
        |                                      |
        v                                      v
+-------------------+                 +-------------------+
|   ERC20 Token     |                 |  WrappedToken     |
|   (Original)      |                 |  (Synthetic)      |
+-------------------+                 +-------------------+
```

## Features

### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks on all external functions
- **Pausable**: Emergency pause functionality for all bridge operations
- **AccessControl**: Role-based permissions for admin functions
- **Multi-signature Validation**: Requires multiple validator signatures for minting/unlocking
- **Nonce Tracking**: Prevents replay attacks
- **Fee Mechanism**: Configurable bridge fees (max 5%)

### Bridge Operations

#### Lock & Mint Flow (Source -> Destination)
1. User calls `lockTokens()` on SourceChainBridge
2. Tokens are transferred to the bridge contract
3. `TokensLocked` event is emitted
4. Validators observe the event and create signatures
5. Relayer calls `mintWrappedTokens()` on DestinationChainBridge with signatures
6. Wrapped tokens are minted to the recipient

#### Burn & Unlock Flow (Destination -> Source)
1. User calls `burnWrappedTokens()` on DestinationChainBridge
2. Wrapped tokens are burned
3. `TokensBurned` event is emitted
4. Validators observe the event and create signatures
5. Relayer calls `unlockTokens()` on SourceChainBridge with signatures
6. Original tokens are transferred to the recipient

## Project Structure

```
cross-chain-token-bridge/
├── contracts/
│   ├── SourceChainBridge.sol      # Lock tokens on source chain
│   ├── DestinationChainBridge.sol # Mint wrapped tokens on destination
│   ├── WrappedToken.sol           # ERC20 wrapped token
│   └── interfaces/
│       └── IBridge.sol            # Bridge interface
├── scripts/
│   ├── deploy.js                  # Deployment script
│   └── bridge-tokens.js           # Demo script for bridge operations
├── test/
│   └── Bridge.test.js             # Comprehensive test suite
├── hardhat.config.js
├── package.json
└── README.md
```

## Installation

```bash
# Clone the repository
cd cross-chain-token-bridge

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Local Development

```bash
# Start a local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy:local
```

### Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_rpc_url

# Deploy to Sepolia
npm run deploy:sepolia
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer's private key |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint |
| `GOERLI_RPC_URL` | Goerli RPC endpoint |
| `ETHERSCAN_API_KEY` | Etherscan API key for verification |
| `COINMARKETCAP_API_KEY` | CoinMarketCap API key for gas reporting |
| `REPORT_GAS` | Enable gas reporting |

### Bridge Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `bridgeFee` | 30 bps (0.3%) | Fee charged on bridge operations |
| `signatureThreshold` | 2 | Minimum signatures required |
| `MAX_FEE_BPS` | 500 (5%) | Maximum allowed fee |

## Contract Roles

### SourceChainBridge
- `DEFAULT_ADMIN_ROLE`: Pause/unpause, emergency withdraw
- `VALIDATOR_ADMIN_ROLE`: Add/remove validators
- `BRIDGE_ADMIN_ROLE`: Update fees, thresholds, supported tokens/chains

### DestinationChainBridge
- `DEFAULT_ADMIN_ROLE`: Pause/unpause
- `VALIDATOR_ADMIN_ROLE`: Add/remove validators
- `BRIDGE_ADMIN_ROLE`: Update fees, thresholds, supported chains
- `TOKEN_DEPLOYER_ROLE`: Deploy/register wrapped tokens

### WrappedToken
- `DEFAULT_ADMIN_ROLE`: Full admin access
- `MINTER_ROLE`: Mint tokens (bridge contract)
- `BURNER_ROLE`: Burn tokens (bridge contract)
- `PAUSER_ROLE`: Pause/unpause token

## API Reference

### SourceChainBridge

```solidity
// Lock tokens to bridge to destination chain
function lockTokens(
    address token,
    uint256 amount,
    address recipient,
    uint256 destinationChainId
) external returns (uint256 nonce);

// Unlock tokens with validator signatures
function unlockTokens(
    address token,
    uint256 amount,
    address recipient,
    uint256 nonce,
    uint256 sourceChainId,
    bytes[] calldata signatures
) external;
```

### DestinationChainBridge

```solidity
// Mint wrapped tokens with validator signatures
function mintWrappedTokens(
    address originalToken,
    uint256 amount,
    address recipient,
    uint256 nonce,
    uint256 sourceChainId,
    bytes[] calldata signatures
) external;

// Burn wrapped tokens to unlock on source chain
function burnWrappedTokens(
    address wrappedToken,
    uint256 amount,
    address recipient,
    uint256 sourceChainId
) external returns (uint256 nonce);
```

## Events

### TokensLocked
```solidity
event TokensLocked(
    address indexed sender,
    address indexed recipient,
    address indexed token,
    uint256 amount,
    uint256 nonce,
    uint256 destinationChainId,
    uint256 timestamp
);
```

### TokensUnlocked
```solidity
event TokensUnlocked(
    address indexed recipient,
    address indexed token,
    uint256 amount,
    uint256 nonce,
    uint256 sourceChainId
);
```

### TokensMinted
```solidity
event TokensMinted(
    address indexed recipient,
    address indexed token,
    uint256 amount,
    uint256 nonce,
    uint256 sourceChainId
);
```

### TokensBurned
```solidity
event TokensBurned(
    address indexed sender,
    address indexed recipient,
    address indexed token,
    uint256 amount,
    uint256 nonce,
    uint256 sourceChainId
);
```

## Security Considerations

1. **Validator Security**: Validators' private keys must be secured. Compromise of enough validators to meet the threshold would allow unauthorized minting/unlocking.

2. **Nonce Management**: Each transfer has a unique nonce to prevent replay attacks. Nonces are tracked globally.

3. **Signature Verification**: The bridge verifies that signatures come from registered validators and deduplicates them.

4. **Emergency Controls**: The bridge can be paused by admins, and emergency withdrawal is available when paused.

5. **Fee Limits**: Maximum fee is capped at 5% to prevent excessive fees.

## KADENA Integration Notes

While this implementation uses EVM/Solidity, the architecture is designed to be compatible with KADENA Pact smart contracts:

1. **Event-Based Communication**: The bridge relies on events for cross-chain communication, which maps well to Pact's event system
2. **Signature Verification**: ECDSA signatures can be verified in Pact using the `verify-signature` function
3. **State Management**: Nonce tracking and balance management translate directly to Pact's capability-based model
4. **Access Control**: Role-based access control maps to Pact's capability system

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## Disclaimer

This code is provided for educational and demonstration purposes. Use at your own risk. Always conduct thorough security audits before deploying to production.
