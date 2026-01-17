/**
 * @fileoverview Deployment script for Bridge Oracle system contracts
 * Deploys ValidatorRegistry, BridgeOracle, and MessageBridge
 */

const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("  Bridge Oracle System Deployment");
  console.log("========================================");
  console.log();

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log();

  // Configuration parameters
  const config = {
    // ValidatorRegistry config
    minimumStake: hre.ethers.parseEther("0.1"), // 0.1 ETH minimum stake
    maximumValidators: 100,
    consensusThreshold: 6600, // 66%

    // BridgeOracle config
    confirmationBlocks: 6,
    updateTimeout: 3600, // 1 hour
    requiredSignaturePercentage: 6600, // 66%

    // MessageBridge config
    baseFee: hre.ethers.parseEther("0.001"), // 0.001 ETH base fee
    defaultGasLimit: 200000,

    // Supported chains
    supportedChains: [1, 5, 11155111, 31337], // Mainnet, Goerli, Sepolia, Hardhat
  };

  // Get current chain ID
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Current chain ID:", chainId.toString());
  console.log();

  // Deploy ValidatorRegistry
  console.log("Deploying ValidatorRegistry...");
  const ValidatorRegistry = await hre.ethers.getContractFactory("ValidatorRegistry");
  const validatorRegistry = await ValidatorRegistry.deploy(
    config.minimumStake,
    config.maximumValidators,
    config.consensusThreshold
  );
  await validatorRegistry.waitForDeployment();
  const validatorRegistryAddress = await validatorRegistry.getAddress();
  console.log("ValidatorRegistry deployed to:", validatorRegistryAddress);
  console.log();

  // Deploy BridgeOracle
  console.log("Deploying BridgeOracle...");
  const BridgeOracle = await hre.ethers.getContractFactory("BridgeOracle");
  const bridgeOracle = await BridgeOracle.deploy(
    validatorRegistryAddress,
    config.confirmationBlocks,
    config.updateTimeout,
    config.requiredSignaturePercentage
  );
  await bridgeOracle.waitForDeployment();
  const bridgeOracleAddress = await bridgeOracle.getAddress();
  console.log("BridgeOracle deployed to:", bridgeOracleAddress);
  console.log();

  // Deploy MessageBridge
  console.log("Deploying MessageBridge...");
  const MessageBridge = await hre.ethers.getContractFactory("MessageBridge");
  const messageBridge = await MessageBridge.deploy(
    bridgeOracleAddress,
    chainId,
    config.baseFee,
    config.defaultGasLimit
  );
  await messageBridge.waitForDeployment();
  const messageBridgeAddress = await messageBridge.getAddress();
  console.log("MessageBridge deployed to:", messageBridgeAddress);
  console.log();

  // Post-deployment configuration
  console.log("Configuring contracts...");

  // Add supported chains to BridgeOracle
  console.log("Adding supported chains to BridgeOracle...");
  for (const supportedChainId of config.supportedChains) {
    const tx = await bridgeOracle.addChain(supportedChainId);
    await tx.wait();
    console.log(`  Added chain ${supportedChainId}`);
  }
  console.log();

  // Register deployer as initial validator (for testing)
  console.log("Registering deployer as initial validator...");
  const publicKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("validator-public-key-" + deployer.address));
  const registerTx = await validatorRegistry.registerValidator(publicKey, {
    value: config.minimumStake,
  });
  await registerTx.wait();
  console.log("Deployer registered as validator");
  console.log();

  // Authorize deployer as relayer (for testing)
  console.log("Authorizing deployer as relayer...");
  const authTx = await messageBridge.authorizeRelayer(deployer.address);
  await authTx.wait();
  console.log("Deployer authorized as relayer");
  console.log();

  // Summary
  console.log("========================================");
  console.log("  Deployment Complete!");
  console.log("========================================");
  console.log();
  console.log("Contract Addresses:");
  console.log("  ValidatorRegistry:", validatorRegistryAddress);
  console.log("  BridgeOracle:     ", bridgeOracleAddress);
  console.log("  MessageBridge:    ", messageBridgeAddress);
  console.log();
  console.log("Configuration:");
  console.log("  Minimum Stake:    ", hre.ethers.formatEther(config.minimumStake), "ETH");
  console.log("  Max Validators:   ", config.maximumValidators);
  console.log("  Consensus:        ", config.consensusThreshold / 100, "%");
  console.log("  Base Fee:         ", hre.ethers.formatEther(config.baseFee), "ETH");
  console.log();

  // Export for .env configuration
  console.log("Environment Variables (add to .env):");
  console.log(`  LOCAL_BRIDGE=${messageBridgeAddress}`);
  console.log(`  LOCAL_ORACLE=${bridgeOracleAddress}`);
  console.log(`  VALIDATOR_REGISTRY=${validatorRegistryAddress}`);
  console.log();

  // Return deployed addresses for programmatic use
  return {
    validatorRegistry: validatorRegistryAddress,
    bridgeOracle: bridgeOracleAddress,
    messageBridge: messageBridgeAddress,
    chainId: chainId.toString(),
  };
}

// Export main for testing
module.exports = { main };

// Run if called directly
main()
  .then((addresses) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
