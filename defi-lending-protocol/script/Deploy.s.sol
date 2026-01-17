// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import { LendingPool } from "../src/LendingPool.sol";
import { InterestRateModel } from "../src/InterestRateModel.sol";
import { PriceOracle } from "../src/PriceOracle.sol";
import { MockERC20 } from "../src/mocks/MockERC20.sol";

/**
 * @title DeployScript
 * @notice Deployment script for the lending protocol
 * @dev Deploys all contracts and sets up initial configuration
 *
 * Usage:
 *   forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
 */
contract DeployScript is Script {
    // Deployed contract addresses
    LendingPool public lendingPool;
    InterestRateModel public interestRateModel;
    PriceOracle public priceOracle;

    // Mock tokens (for testnet)
    MockERC20 public mockWETH;
    MockERC20 public mockUSDC;
    MockERC20 public mockDAI;

    // Interest rate model parameters
    uint256 constant BASE_RATE = 0.02e18; // 2% base rate
    uint256 constant MULTIPLIER = 0.1e18; // 10% slope below optimal
    uint256 constant JUMP_MULTIPLIER = 1e18; // 100% slope above optimal
    uint256 constant OPTIMAL_UTILIZATION = 0.8e18; // 80% optimal utilization

    // Market parameters
    uint256 constant WETH_COLLATERAL_FACTOR = 0.75e18; // 75%
    uint256 constant WETH_LIQUIDATION_THRESHOLD = 0.8e18; // 80%
    uint256 constant USDC_COLLATERAL_FACTOR = 0.8e18; // 80%
    uint256 constant USDC_LIQUIDATION_THRESHOLD = 0.85e18; // 85%
    uint256 constant LIQUIDATION_BONUS = 1.05e18; // 5% bonus
    uint256 constant RESERVE_FACTOR = 0.1e18; // 10% reserve

    // Chainlink price feed addresses (Sepolia)
    address constant SEPOLIA_ETH_USD_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Interest Rate Model
        console.log("\n1. Deploying InterestRateModel...");
        interestRateModel = new InterestRateModel(
            BASE_RATE,
            MULTIPLIER,
            JUMP_MULTIPLIER,
            OPTIMAL_UTILIZATION
        );
        console.log("   InterestRateModel deployed at:", address(interestRateModel));

        // 2. Deploy Price Oracle
        console.log("\n2. Deploying PriceOracle...");
        priceOracle = new PriceOracle();
        console.log("   PriceOracle deployed at:", address(priceOracle));

        // 3. Deploy Lending Pool
        console.log("\n3. Deploying LendingPool...");
        lendingPool = new LendingPool(address(interestRateModel), address(priceOracle));
        console.log("   LendingPool deployed at:", address(lendingPool));

        // 4. Deploy Mock Tokens (for testnet demonstration)
        console.log("\n4. Deploying Mock Tokens...");
        mockWETH = new MockERC20("Mock Wrapped Ether", "mWETH", 18);
        mockUSDC = new MockERC20("Mock USD Coin", "mUSDC", 6);
        mockDAI = new MockERC20("Mock Dai", "mDAI", 18);
        console.log("   MockWETH deployed at:", address(mockWETH));
        console.log("   MockUSDC deployed at:", address(mockUSDC));
        console.log("   MockDAI deployed at:", address(mockDAI));

        // 5. Configure Price Oracle
        console.log("\n5. Configuring Price Oracle...");

        // For testnet, use manual prices (in production, use Chainlink feeds)
        priceOracle.setManualPrice(address(mockWETH), 2000e8, 18); // $2000
        priceOracle.setManualPrice(address(mockUSDC), 1e8, 6); // $1
        priceOracle.setManualPrice(address(mockDAI), 1e8, 18); // $1

        // Uncomment for mainnet/with real Chainlink feeds:
        // priceOracle.setPriceFeed(address(mockWETH), SEPOLIA_ETH_USD_FEED, 18, 1 hours);

        console.log("   Prices configured");

        // 6. List Markets
        console.log("\n6. Listing Markets...");

        lendingPool.listMarket(
            address(mockWETH),
            WETH_COLLATERAL_FACTOR,
            WETH_LIQUIDATION_THRESHOLD,
            LIQUIDATION_BONUS,
            RESERVE_FACTOR
        );
        console.log("   WETH market listed");

        lendingPool.listMarket(
            address(mockUSDC),
            USDC_COLLATERAL_FACTOR,
            USDC_LIQUIDATION_THRESHOLD,
            LIQUIDATION_BONUS,
            RESERVE_FACTOR
        );
        console.log("   USDC market listed");

        lendingPool.listMarket(
            address(mockDAI),
            0.75e18, // 75% collateral factor
            0.8e18, // 80% liquidation threshold
            LIQUIDATION_BONUS,
            RESERVE_FACTOR
        );
        console.log("   DAI market listed");

        // 7. Mint initial tokens for testing
        console.log("\n7. Minting initial tokens for deployer...");
        mockWETH.mint(deployer, 1000 ether);
        mockUSDC.mint(deployer, 1_000_000e6);
        mockDAI.mint(deployer, 1_000_000e18);
        console.log("   Minted 1000 mWETH, 1M mUSDC, 1M mDAI to deployer");

        vm.stopBroadcast();

        // Print summary
        _printDeploymentSummary();
    }

    function _printDeploymentSummary() internal view {
        console.log("\n");
        console.log("==============================================");
        console.log("       DEPLOYMENT SUMMARY");
        console.log("==============================================");
        console.log("");
        console.log("Core Contracts:");
        console.log("  LendingPool:       ", address(lendingPool));
        console.log("  InterestRateModel: ", address(interestRateModel));
        console.log("  PriceOracle:       ", address(priceOracle));
        console.log("");
        console.log("Mock Tokens:");
        console.log("  MockWETH:          ", address(mockWETH));
        console.log("  MockUSDC:          ", address(mockUSDC));
        console.log("  MockDAI:           ", address(mockDAI));
        console.log("");
        console.log("==============================================");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Approve tokens for LendingPool");
        console.log("3. Supply tokens to create liquidity");
        console.log("");
    }
}

/**
 * @title DemoScript
 * @notice Script to demonstrate protocol functionality
 */
contract DemoScript is Script {
    function run() external {
        // These would be set from environment or previous deployment
        address lendingPoolAddr = vm.envAddress("LENDING_POOL");
        address mockWETHAddr = vm.envAddress("MOCK_WETH");
        address mockUSDCAddr = vm.envAddress("MOCK_USDC");

        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");

        LendingPool lendingPool = LendingPool(lendingPoolAddr);
        MockERC20 mockWETH = MockERC20(mockWETHAddr);
        MockERC20 mockUSDC = MockERC20(mockUSDCAddr);

        vm.startBroadcast(userPrivateKey);

        // Approve tokens
        mockWETH.approve(address(lendingPool), type(uint256).max);
        mockUSDC.approve(address(lendingPool), type(uint256).max);

        // Supply WETH as collateral
        console.log("Supplying 10 WETH as collateral...");
        lendingPool.supply(address(mockWETH), 10 ether);

        // Supply USDC for liquidity
        console.log("Supplying 50,000 USDC for liquidity...");
        lendingPool.supply(address(mockUSDC), 50_000e6);

        // Borrow USDC against WETH collateral
        console.log("Borrowing 5,000 USDC...");
        lendingPool.borrow(address(mockUSDC), 5_000e6);

        // Check health factor
        uint256 healthFactor = lendingPool.getHealthFactor(vm.addr(userPrivateKey));
        console.log("Health Factor:", healthFactor / 1e16, "%");

        vm.stopBroadcast();
    }
}
