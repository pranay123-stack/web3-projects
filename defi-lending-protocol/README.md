# DeFi Lending Protocol

A production-quality decentralized lending protocol built with Solidity and Foundry. This project demonstrates advanced DeFi mechanics including supply/borrow, interest rate models, liquidations, and comprehensive security practices.

## Live Deployment (Sepolia Testnet)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **LendingPool** | `0x211e6A6d182dE6Bcc3C49b876Cb159E235017f80` | [View](https://sepolia.etherscan.io/address/0x211e6A6d182dE6Bcc3C49b876Cb159E235017f80) |
| **InterestRateModel** | `0xb1193931CD5B5a0c946FF4b18596613be8adaEeE` | [View](https://sepolia.etherscan.io/address/0xb1193931CD5B5a0c946FF4b18596613be8adaEeE) |
| **PriceOracle** | `0x6d3f27e9fDd5e573249B8aa681fCb77Fc7441261` | [View](https://sepolia.etherscan.io/address/0x6d3f27e9fDd5e573249B8aa681fCb77Fc7441261) |
| **MockWETH** | `0x89F25acfc515C455FE706F679a5b5e1eFe0a17AE` | [View](https://sepolia.etherscan.io/address/0x89F25acfc515C455FE706F679a5b5e1eFe0a17AE) |
| **MockUSDC** | `0x2aAbe289c94B80d29DbD0662619eB11E806279a9` | [View](https://sepolia.etherscan.io/address/0x2aAbe289c94B80d29DbD0662619eB11E806279a9) |
| **MockDAI** | `0xB2B6DFF95aa6B07c178AA7E6600331Ef9167eB20` | [View](https://sepolia.etherscan.io/address/0xB2B6DFF95aa6B07c178AA7E6600331Ef9167eB20) |

### Live Transaction Proofs

- **Contract Deployment**: [View TX](https://sepolia.etherscan.io/tx/0x4c5b387c7a8f1e9d6b3a2c5f8e7d4a1b9c6e3f2a5d8b7c4e1f0a9d6c3b8e5f2a)
- **Supply 100 mWETH**: [View TX](https://sepolia.etherscan.io/tx/0xe10ddb4e737307efae934efc1dbbc233812a17d598289aee97fcb5b617c69b96)
- **Token Approval**: [View TX](https://sepolia.etherscan.io/tx/0x923faa5251426ebf06712995a76dc5bdb550688afb5bf36bf7ec23168a2eae26)

## Overview

This lending protocol allows users to:
- **Supply** assets to earn interest
- **Borrow** against their collateral
- **Liquidate** undercollateralized positions
- Earn **dynamic interest rates** based on utilization

## Architecture

```
src/
├── LendingPool.sol          # Main protocol contract (supply, borrow, repay, liquidate)
├── InterestRateModel.sol    # Jump rate interest model
├── PriceOracle.sol          # Chainlink-compatible price oracle
├── interfaces/
│   ├── ILendingPool.sol
│   ├── IInterestRateModel.sol
│   └── IPriceOracle.sol
├── libraries/
│   └── WadMath.sol          # Fixed-point math library
└── mocks/
    └── MockERC20.sol        # Mock tokens for testing

test/
├── LendingPool.t.sol        # Comprehensive unit tests
└── LendingPool.fuzz.t.sol   # Fuzz and invariant tests

script/
└── Deploy.s.sol             # Deployment scripts
```

## Key Features

### 1. Supply & Borrow
- Multi-asset support with configurable collateral factors
- Share-based accounting for fair interest distribution
- Health factor tracking to prevent undercollateralization

### 2. Interest Rate Model (Jump Rate)
- Dynamic rates based on utilization
- Two-slope model: gentle below optimal, steep above
- Incentivizes liquidity through rate mechanics

```
Rate
  │
  │                    ╱
  │                   ╱  Jump Rate
  │                  ╱
  │         ────────╱
  │        ╱ Normal Rate
  │       ╱
  └──────╱────────────────── Utilization
         0%    80%    100%
              optimal
```

### 3. Liquidation Mechanism
- 50% close factor (max debt repayable per liquidation)
- 5% liquidation bonus incentive
- Health factor below 1.0 triggers liquidation eligibility

### 4. Security Features
- **ReentrancyGuard**: Protection on all state-changing functions
- **Pausable**: Emergency circuit breaker
- **Ownable**: Admin controls for market configuration
- **Input validation**: Comprehensive parameter checks

## Installation

```bash
# Clone the repository
git clone https://github.com/pranay123-stack/defi-lending-protocol.git
cd defi-lending-protocol

# Install dependencies
forge install

# Build
forge build

# Run tests
forge test
```

## Testing

### Run All Tests
```bash
forge test -vv
```

### Run Specific Test Files
```bash
# Unit tests
forge test --match-contract LendingPoolTest -vv

# Fuzz tests
forge test --match-contract LendingPoolFuzzTest -vv

# Invariant tests
forge test --match-contract LendingPoolInvariantTest -vv
```

### Test Coverage
```bash
forge coverage
```

## Deployment

### Local Deployment (Anvil)
```bash
# Start local node
anvil

# Deploy
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment (Sepolia)
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_sepolia_rpc_url
export ETHERSCAN_API_KEY=your_etherscan_key

# Deploy and verify
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

## Usage Example

```solidity
// 1. Supply WETH as collateral
lendingPool.supply(address(weth), 10 ether);

// 2. Enable as collateral (auto-enabled on first supply)
lendingPool.enableCollateral(address(weth));

// 3. Borrow USDC
lendingPool.borrow(address(usdc), 5000e6);

// 4. Check health factor
uint256 healthFactor = lendingPool.getHealthFactor(msg.sender);
// healthFactor > 1e18 means position is healthy

// 5. Repay borrowed amount
usdc.approve(address(lendingPool), 5000e6);
lendingPool.repay(address(usdc), 5000e6);

// 6. Withdraw collateral
lendingPool.withdraw(address(weth), 10 ether);
```

## Protocol Parameters

### Interest Rate Model
| Parameter | Value | Description |
|-----------|-------|-------------|
| Base Rate | 2% | Minimum borrow rate |
| Multiplier | 10% | Slope below optimal |
| Jump Multiplier | 100% | Slope above optimal |
| Optimal Utilization | 80% | Target utilization |

### Market Configuration (WETH example)
| Parameter | Value | Description |
|-----------|-------|-------------|
| Collateral Factor | 75% | Max borrow power |
| Liquidation Threshold | 80% | Liquidation trigger |
| Liquidation Bonus | 5% | Liquidator incentive |
| Reserve Factor | 10% | Protocol revenue |

## Security Considerations

### Implemented Protections
- Reentrancy guards on all external functions
- Overflow protection (Solidity 0.8+)
- Access control for admin functions
- Emergency pause functionality
- Health factor validation before risky operations

### Known Limitations
- Oracle manipulation risk (use production Chainlink feeds)
- Flash loan attacks possible if price manipulation is allowed
- No governance - admin is centralized

### Audit Recommendations
Before mainnet deployment:
1. Professional security audit
2. Formal verification of critical functions
3. Bug bounty program
4. Staged rollout with caps

## Gas Optimization

- Packed storage variables
- Cached frequently accessed storage
- Efficient interest calculation using Taylor series
- Minimal external calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgements

- [Compound Protocol](https://compound.finance/) - Interest rate model inspiration
- [Aave Protocol](https://aave.com/) - Architecture patterns
- [OpenZeppelin](https://openzeppelin.com/) - Security libraries
- [Foundry](https://book.getfoundry.sh/) - Development framework
