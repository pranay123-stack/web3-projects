/**
 * @fileoverview Bridge simulation script
 * Simulates cross-chain message passing for testing
 */

const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("  Bridge Simulation");
  console.log("========================================");
  console.log();

  const [deployer, user1, user2] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log();

  // Configuration
  const config = {
    minimumStake: hre.ethers.parseEther("0.1"),
    maximumValidators: 100,
    consensusThreshold: 6600,
    confirmationBlocks: 1,
    updateTimeout: 3600,
    requiredSignaturePercentage: 5000, // 50% for testing
    baseFee: hre.ethers.parseEther("0.001"),
    defaultGasLimit: 200000,
  };

  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;
  const destChainId = 5; // Simulate Goerli as destination

  // Deploy contracts
  console.log("Deploying contracts...");

  const ValidatorRegistry = await hre.ethers.getContractFactory("ValidatorRegistry");
  const validatorRegistry = await ValidatorRegistry.deploy(
    config.minimumStake,
    config.maximumValidators,
    config.consensusThreshold
  );
  await validatorRegistry.waitForDeployment();
  console.log("ValidatorRegistry:", await validatorRegistry.getAddress());

  const BridgeOracle = await hre.ethers.getContractFactory("BridgeOracle");
  const bridgeOracle = await BridgeOracle.deploy(
    await validatorRegistry.getAddress(),
    config.confirmationBlocks,
    config.updateTimeout,
    config.requiredSignaturePercentage
  );
  await bridgeOracle.waitForDeployment();
  console.log("BridgeOracle:", await bridgeOracle.getAddress());

  const MessageBridge = await hre.ethers.getContractFactory("MessageBridge");
  const messageBridge = await MessageBridge.deploy(
    await bridgeOracle.getAddress(),
    chainId,
    config.baseFee,
    config.defaultGasLimit
  );
  await messageBridge.waitForDeployment();
  console.log("MessageBridge:", await messageBridge.getAddress());
  console.log();

  // Setup
  console.log("Setting up validators and chains...");

  // Add supported chains
  await bridgeOracle.addChain(chainId);
  await bridgeOracle.addChain(destChainId);
  console.log(`Added chains ${chainId} and ${destChainId}`);

  // Register validators
  const validators = [deployer, user1];
  for (const validator of validators) {
    const publicKey = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("pubkey-" + validator.address)
    );
    await validatorRegistry.connect(validator).registerValidator(publicKey, {
      value: config.minimumStake,
    });
    console.log(`Registered validator: ${validator.address}`);
  }

  // Enable relayer whitelist and authorize
  await messageBridge.setRelayerWhitelistEnabled(true);
  await messageBridge.authorizeRelayer(deployer.address);
  console.log("Relayer whitelist enabled and deployer authorized");
  console.log();

  // Simulate sending messages
  console.log("========================================");
  console.log("  Simulating Message Sending");
  console.log("========================================");
  console.log();

  // Message 1: Simple transfer
  const message1 = {
    target: user2.address,
    data: hre.ethers.toUtf8Bytes("Hello from chain " + chainId),
    gasLimit: 100000,
  };

  console.log("Sending Message 1...");
  const fee = await messageBridge.estimateFee(destChainId, message1.gasLimit);
  console.log("Estimated fee:", hre.ethers.formatEther(fee), "ETH");

  const tx1 = await messageBridge.connect(user1).sendMessage(
    destChainId,
    message1.target,
    message1.data,
    message1.gasLimit,
    { value: fee }
  );

  const receipt1 = await tx1.wait();
  console.log("Transaction hash:", receipt1.hash);

  // Parse events
  const bridgeInterface = messageBridge.interface;
  let messageHash1;
  for (const log of receipt1.logs) {
    try {
      const parsed = bridgeInterface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (parsed.name === "MessageSent") {
        messageHash1 = parsed.args[0];
        console.log("MessageSent event:");
        console.log("  Message Hash:", messageHash1);
        console.log("  Nonce:", parsed.args[1].toString());
        console.log("  Dest Chain:", parsed.args[2].toString());
        console.log("  Sender:", parsed.args[3]);
        console.log("  Target:", parsed.args[4]);
        console.log("  Gas Limit:", parsed.args[6].toString());
        console.log("  Fee:", hre.ethers.formatEther(parsed.args[7]), "ETH");
      }
    } catch (e) {
      // Not our event
    }
  }
  console.log();

  // Simulate oracle state root update
  console.log("========================================");
  console.log("  Simulating Oracle State Root Update");
  console.log("========================================");
  console.log();

  const blockNumber = receipt1.blockNumber;
  const stateRoot = hre.ethers.keccak256(
    hre.ethers.toUtf8Bytes("state-root-block-" + blockNumber)
  );

  console.log("Block Number:", blockNumber);
  console.log("State Root:", stateRoot);

  // Sign state root with validators
  const messageToSign = hre.ethers.solidityPackedKeccak256(
    ["uint256", "uint256", "bytes32"],
    [chainId, blockNumber, stateRoot]
  );

  console.log("\nCollecting validator signatures...");
  const signatures = [];
  for (const validator of validators) {
    const signature = await validator.signMessage(hre.ethers.getBytes(messageToSign));
    signatures.push(signature);
    console.log(`  ${validator.address}: signed`);
  }

  // Submit threshold signature
  console.log("\nSubmitting threshold signature...");
  const submitTx = await bridgeOracle.submitThresholdSignature(
    chainId,
    blockNumber,
    stateRoot,
    signatures
  );
  await submitTx.wait();
  console.log("State root submitted and finalized!");

  // Verify state root
  const finalizedRoot = await bridgeOracle.latestStateRoot(chainId);
  console.log("Latest finalized root:", finalizedRoot);
  console.log("Roots match:", finalizedRoot === stateRoot);
  console.log();

  // Simulate proof verification
  console.log("========================================");
  console.log("  Simulating Proof Verification");
  console.log("========================================");
  console.log();

  // In a real scenario, we'd generate a proper merkle proof
  // For simulation, we'll test the proof verification logic
  const testLeaf = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-leaf"));
  const testProof = [
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("proof-element-1")),
    hre.ethers.keccak256(hre.ethers.toUtf8Bytes("proof-element-2")),
  ];

  console.log("Test leaf:", testLeaf);
  console.log("Proof elements:", testProof.length);

  // The proof won't verify with our test data, but this demonstrates the API
  try {
    const isValid = await bridgeOracle.verifyProof(chainId, blockNumber, testProof, testLeaf);
    console.log("Proof valid:", isValid);
  } catch (e) {
    console.log("Proof verification (expected to fail with test data):", e.message.substring(0, 50) + "...");
  }
  console.log();

  // Display validator stats
  console.log("========================================");
  console.log("  Validator Statistics");
  console.log("========================================");
  console.log();

  const activeValidators = await validatorRegistry.getActiveValidators();
  console.log("Active validators:", activeValidators.length);
  for (const addr of activeValidators) {
    const info = await validatorRegistry.getValidatorInfo(addr);
    console.log(`  ${addr}:`);
    console.log(`    Stake: ${hre.ethers.formatEther(info[0])} ETH`);
    console.log(`    Active: ${info[3]}`);
    console.log(`    Slash count: ${info[4]}`);
  }
  console.log();

  // Display bridge stats
  console.log("========================================");
  console.log("  Bridge Statistics");
  console.log("========================================");
  console.log();

  const outboundNonce = await messageBridge.outboundNonce();
  const bridgeBalance = await hre.ethers.provider.getBalance(await messageBridge.getAddress());
  console.log("Outbound messages sent:", outboundNonce.toString());
  console.log("Bridge balance:", hre.ethers.formatEther(bridgeBalance), "ETH");
  console.log();

  // Test message queue functionality
  console.log("========================================");
  console.log("  Testing Message Queue");
  console.log("========================================");
  console.log();

  if (messageHash1) {
    await messageBridge.queueMessage(messageHash1);
    console.log("Queued message:", messageHash1);

    const queueLength = await messageBridge.getQueueLength();
    console.log("Queue length:", queueLength.toString());

    await messageBridge.dequeueMessage(messageHash1);
    console.log("Dequeued message");

    const newQueueLength = await messageBridge.getQueueLength();
    console.log("New queue length:", newQueueLength.toString());
  }
  console.log();

  // Simulate slash proposal (for demonstration)
  console.log("========================================");
  console.log("  Simulating Slash Proposal");
  console.log("========================================");
  console.log();

  // User1 proposes to slash deployer
  const slashReason = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("offline-for-too-long"));
  console.log("User1 proposing slash against deployer...");
  console.log("Reason hash:", slashReason);

  try {
    const slashTx = await validatorRegistry.connect(user1).proposeSlash(
      deployer.address,
      slashReason
    );
    const slashReceipt = await slashTx.wait();
    console.log("Slash proposal created");

    // Parse proposal ID from events
    for (const log of slashReceipt.logs) {
      try {
        const parsed = validatorRegistry.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed.name === "SlashProposalCreated") {
          console.log("Proposal ID:", parsed.args[0].toString());
        }
      } catch (e) {
        // Not our event
      }
    }
  } catch (e) {
    console.log("Slash proposal failed (expected if already done):", e.message.substring(0, 50) + "...");
  }
  console.log();

  console.log("========================================");
  console.log("  Simulation Complete!");
  console.log("========================================");
}

main()
  .then(() => {
    console.log("\nSimulation successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSimulation failed:", error);
    process.exit(1);
  });
