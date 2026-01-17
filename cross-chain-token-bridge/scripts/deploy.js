/**
 * @title Deploy Script for Cross-Chain Token Bridge
 * @author Cross-Chain Token Bridge Team
 * @notice This script deploys all bridge contracts and sets up initial configuration
 * @dev Run with: npx hardhat run scripts/deploy.js --network <network>
 */

const { ethers } = require("hardhat");

async function main() {
    console.log("=".repeat(60));
    console.log("Cross-Chain Token Bridge - Deployment Script");
    console.log("=".repeat(60));

    // Get signers
    const [deployer, feeCollector, validator1, validator2, validator3] = await ethers.getSigners();

    console.log("\n--- Deployment Configuration ---");
    console.log(`Deployer address: ${deployer.address}`);
    console.log(`Fee collector address: ${feeCollector.address}`);
    console.log(`Validator 1: ${validator1.address}`);
    console.log(`Validator 2: ${validator2.address}`);
    console.log(`Validator 3: ${validator3.address}`);

    const chainId = (await ethers.provider.getNetwork()).chainId;
    console.log(`Chain ID: ${chainId}`);

    // Configuration
    const INITIAL_FEE_BPS = 30; // 0.3% fee
    const SIGNATURE_THRESHOLD = 2; // 2-of-3 multisig

    console.log(`\nInitial fee: ${INITIAL_FEE_BPS} basis points (${INITIAL_FEE_BPS / 100}%)`);
    console.log(`Signature threshold: ${SIGNATURE_THRESHOLD}`);

    // Deploy Source Chain Bridge
    console.log("\n--- Deploying Source Chain Bridge ---");
    const SourceChainBridge = await ethers.getContractFactory("SourceChainBridge");
    const sourceBridge = await SourceChainBridge.deploy(
        deployer.address,
        feeCollector.address,
        INITIAL_FEE_BPS,
        SIGNATURE_THRESHOLD
    );
    await sourceBridge.waitForDeployment();
    const sourceBridgeAddress = await sourceBridge.getAddress();
    console.log(`SourceChainBridge deployed to: ${sourceBridgeAddress}`);

    // Deploy Destination Chain Bridge
    console.log("\n--- Deploying Destination Chain Bridge ---");
    const DestinationChainBridge = await ethers.getContractFactory("DestinationChainBridge");
    const destBridge = await DestinationChainBridge.deploy(
        deployer.address,
        feeCollector.address,
        INITIAL_FEE_BPS,
        SIGNATURE_THRESHOLD
    );
    await destBridge.waitForDeployment();
    const destBridgeAddress = await destBridge.getAddress();
    console.log(`DestinationChainBridge deployed to: ${destBridgeAddress}`);

    // Deploy a mock ERC20 token for testing
    console.log("\n--- Deploying Mock ERC20 Token ---");
    const MockToken = await ethers.getContractFactory("WrappedToken");
    const mockToken = await MockToken.deploy(
        "Mock Token",
        "MTK",
        18,
        deployer.address, // Using deployer as "original token" for testing
        chainId,
        deployer.address,
        deployer.address // Deployer can mint for testing
    );
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log(`Mock Token deployed to: ${mockTokenAddress}`);

    // Configure Source Bridge
    console.log("\n--- Configuring Source Chain Bridge ---");

    // Add validators
    console.log("Adding validators...");
    await sourceBridge.addValidator(validator1.address);
    await sourceBridge.addValidator(validator2.address);
    await sourceBridge.addValidator(validator3.address);
    console.log("Validators added successfully");

    // Add supported token
    console.log("Adding supported token...");
    await sourceBridge.addSupportedToken(mockTokenAddress);
    console.log(`Token ${mockTokenAddress} added as supported`);

    // Add supported destination chain (using a mock chain ID for testing)
    const DEST_CHAIN_ID = 2; // Mock destination chain ID
    console.log(`Adding supported destination chain (ID: ${DEST_CHAIN_ID})...`);
    await sourceBridge.addSupportedChain(DEST_CHAIN_ID);
    console.log("Destination chain added");

    // Configure Destination Bridge
    console.log("\n--- Configuring Destination Chain Bridge ---");

    // Add validators
    console.log("Adding validators...");
    await destBridge.addValidator(validator1.address);
    await destBridge.addValidator(validator2.address);
    await destBridge.addValidator(validator3.address);
    console.log("Validators added successfully");

    // Add supported source chain
    const SOURCE_CHAIN_ID = Number(chainId);
    console.log(`Adding supported source chain (ID: ${SOURCE_CHAIN_ID})...`);
    await destBridge.addSupportedSourceChain(SOURCE_CHAIN_ID);
    console.log("Source chain added");

    // Deploy wrapped token for the mock token
    console.log("\n--- Deploying Wrapped Token via Destination Bridge ---");
    const tx = await destBridge.deployWrappedToken(
        mockTokenAddress,
        SOURCE_CHAIN_ID,
        "Wrapped Mock Token",
        "wMTK",
        18
    );
    const receipt = await tx.wait();
    const wrappedTokenAddress = await destBridge.getWrappedToken(mockTokenAddress);
    console.log(`Wrapped Token deployed to: ${wrappedTokenAddress}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`
Network: ${(await ethers.provider.getNetwork()).name} (Chain ID: ${chainId})

Contracts:
- SourceChainBridge: ${sourceBridgeAddress}
- DestinationChainBridge: ${destBridgeAddress}
- Mock Token (MTK): ${mockTokenAddress}
- Wrapped Token (wMTK): ${wrappedTokenAddress}

Configuration:
- Fee: ${INITIAL_FEE_BPS} bps (${INITIAL_FEE_BPS / 100}%)
- Signature Threshold: ${SIGNATURE_THRESHOLD} of 3
- Fee Collector: ${feeCollector.address}

Validators:
1. ${validator1.address}
2. ${validator2.address}
3. ${validator3.address}

Supported Chains:
- Source Chain ID: ${SOURCE_CHAIN_ID}
- Destination Chain ID: ${DEST_CHAIN_ID}
    `);

    // Return deployment info for programmatic use
    return {
        sourceBridge: sourceBridgeAddress,
        destBridge: destBridgeAddress,
        mockToken: mockTokenAddress,
        wrappedToken: wrappedTokenAddress,
        validators: [validator1.address, validator2.address, validator3.address],
        feeCollector: feeCollector.address,
        chainId: chainId
    };
}

// Execute deployment
main()
    .then((result) => {
        console.log("\nDeployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\nDeployment failed:");
        console.error(error);
        process.exit(1);
    });

module.exports = { main };
