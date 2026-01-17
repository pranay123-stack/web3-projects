const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Oracle System", function () {
  let validatorRegistry;
  let bridgeOracle;
  let messageBridge;
  let owner;
  let validator1;
  let validator2;
  let validator3;
  let user;

  const MINIMUM_STAKE = ethers.parseEther("0.1");
  const MAX_VALIDATORS = 100;
  const CONSENSUS_THRESHOLD = 6600; // 66%
  const CONFIRMATION_BLOCKS = 1;
  const UPDATE_TIMEOUT = 3600;
  const REQUIRED_SIG_PERCENTAGE = 5000; // 50%
  const BASE_FEE = ethers.parseEther("0.001");
  const DEFAULT_GAS_LIMIT = 200000;

  const CHAIN_ID = 31337; // Hardhat chain ID
  const DEST_CHAIN_ID = 5; // Goerli

  beforeEach(async function () {
    [owner, validator1, validator2, validator3, user] = await ethers.getSigners();

    // Deploy ValidatorRegistry
    const ValidatorRegistry = await ethers.getContractFactory("ValidatorRegistry");
    validatorRegistry = await ValidatorRegistry.deploy(
      MINIMUM_STAKE,
      MAX_VALIDATORS,
      CONSENSUS_THRESHOLD
    );
    await validatorRegistry.waitForDeployment();

    // Deploy BridgeOracle
    const BridgeOracle = await ethers.getContractFactory("BridgeOracle");
    bridgeOracle = await BridgeOracle.deploy(
      await validatorRegistry.getAddress(),
      CONFIRMATION_BLOCKS,
      UPDATE_TIMEOUT,
      REQUIRED_SIG_PERCENTAGE
    );
    await bridgeOracle.waitForDeployment();

    // Deploy MessageBridge
    const MessageBridge = await ethers.getContractFactory("MessageBridge");
    messageBridge = await MessageBridge.deploy(
      await bridgeOracle.getAddress(),
      CHAIN_ID,
      BASE_FEE,
      DEFAULT_GAS_LIMIT
    );
    await messageBridge.waitForDeployment();

    // Setup: Add supported chains
    await bridgeOracle.addChain(CHAIN_ID);
    await bridgeOracle.addChain(DEST_CHAIN_ID);
  });

  describe("ValidatorRegistry", function () {
    describe("Registration", function () {
      it("should register a validator with sufficient stake", async function () {
        const publicKey = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));

        await validatorRegistry.connect(validator1).registerValidator(publicKey, {
          value: MINIMUM_STAKE,
        });

        expect(await validatorRegistry.isActiveValidator(validator1.address)).to.be.true;
      });

      it("should reject registration with insufficient stake", async function () {
        const publicKey = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));

        await expect(
          validatorRegistry.connect(validator1).registerValidator(publicKey, {
            value: ethers.parseEther("0.05"),
          })
        ).to.be.revertedWithCustomError(validatorRegistry, "InsufficientStake");
      });

      it("should reject duplicate registration", async function () {
        const publicKey = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));

        await validatorRegistry.connect(validator1).registerValidator(publicKey, {
          value: MINIMUM_STAKE,
        });

        await expect(
          validatorRegistry.connect(validator1).registerValidator(publicKey, {
            value: MINIMUM_STAKE,
          })
        ).to.be.revertedWithCustomError(validatorRegistry, "ValidatorAlreadyExists");
      });

      it("should track total staked amount", async function () {
        const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
        const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));

        await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
          value: MINIMUM_STAKE,
        });
        await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
          value: MINIMUM_STAKE,
        });

        expect(await validatorRegistry.totalStaked()).to.equal(MINIMUM_STAKE * 2n);
      });
    });

    describe("Stake Management", function () {
      beforeEach(async function () {
        const publicKey = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
        await validatorRegistry.connect(validator1).registerValidator(publicKey, {
          value: MINIMUM_STAKE,
        });
      });

      it("should allow increasing stake", async function () {
        const additionalStake = ethers.parseEther("0.05");
        await validatorRegistry.connect(validator1).increaseStake({
          value: additionalStake,
        });

        const info = await validatorRegistry.getValidatorInfo(validator1.address);
        expect(info[0]).to.equal(MINIMUM_STAKE + additionalStake);
      });

      it("should allow decreasing stake while maintaining minimum", async function () {
        // First increase stake
        await validatorRegistry.connect(validator1).increaseStake({
          value: ethers.parseEther("0.1"),
        });

        // Then decrease
        await validatorRegistry.connect(validator1).decreaseStake(ethers.parseEther("0.05"));

        const info = await validatorRegistry.getValidatorInfo(validator1.address);
        expect(info[0]).to.equal(ethers.parseEther("0.15"));
      });

      it("should reject decreasing below minimum stake", async function () {
        await expect(
          validatorRegistry.connect(validator1).decreaseStake(ethers.parseEther("0.05"))
        ).to.be.revertedWithCustomError(validatorRegistry, "InsufficientStake");
      });
    });

    describe("Validator Management", function () {
      beforeEach(async function () {
        const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
        const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));

        await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
          value: MINIMUM_STAKE,
        });
        await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
          value: MINIMUM_STAKE,
        });
      });

      it("should return correct active validator count", async function () {
        expect(await validatorRegistry.getActiveValidatorCount()).to.equal(2);
      });

      it("should return all active validators", async function () {
        const activeValidators = await validatorRegistry.getActiveValidators();
        expect(activeValidators).to.include(validator1.address);
        expect(activeValidators).to.include(validator2.address);
      });

      it("should allow unregistration", async function () {
        const balanceBefore = await ethers.provider.getBalance(validator1.address);

        await validatorRegistry.connect(validator1).unregisterValidator();

        expect(await validatorRegistry.isActiveValidator(validator1.address)).to.be.false;
        expect(await validatorRegistry.getActiveValidatorCount()).to.equal(1);

        const balanceAfter = await ethers.provider.getBalance(validator1.address);
        expect(balanceAfter).to.be.gt(balanceBefore);
      });
    });

    describe("Slashing", function () {
      beforeEach(async function () {
        const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
        const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));
        const publicKey3 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-3"));

        await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
          value: MINIMUM_STAKE,
        });
        await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
          value: MINIMUM_STAKE,
        });
        await validatorRegistry.connect(validator3).registerValidator(publicKey3, {
          value: MINIMUM_STAKE,
        });
      });

      it("should allow proposing a slash", async function () {
        const reason = ethers.keccak256(ethers.toUtf8Bytes("malicious-behavior"));

        await expect(
          validatorRegistry.connect(validator1).proposeSlash(validator2.address, reason)
        ).to.emit(validatorRegistry, "SlashProposalCreated");
      });

      it("should not allow slashing self", async function () {
        const reason = ethers.keccak256(ethers.toUtf8Bytes("self-slash"));

        await expect(
          validatorRegistry.connect(validator1).proposeSlash(validator1.address, reason)
        ).to.be.revertedWithCustomError(validatorRegistry, "CannotSlashSelf");
      });

      it("should execute slash when threshold reached", async function () {
        const reason = ethers.keccak256(ethers.toUtf8Bytes("malicious-behavior"));

        // Get initial stake
        const infoBefore = await validatorRegistry.getValidatorInfo(validator2.address);
        const stakeBefore = infoBefore[0];

        // Propose slash (counts as 1 approval)
        const tx = await validatorRegistry.connect(validator1).proposeSlash(validator2.address, reason);
        const receipt = await tx.wait();

        // Find proposal ID from event
        let proposalId;
        for (const log of receipt.logs) {
          try {
            const parsed = validatorRegistry.interface.parseLog({
              topics: log.topics,
              data: log.data,
            });
            if (parsed.name === "SlashProposalCreated") {
              proposalId = parsed.args[0];
              break;
            }
          } catch (e) {
            // Not our event
          }
        }

        // Approve slash (2nd approval - meets threshold of 2)
        await expect(
          validatorRegistry.connect(validator3).approveSlash(proposalId)
        ).to.emit(validatorRegistry, "ValidatorSlashed");

        // Check stake was reduced
        const infoAfter = await validatorRegistry.getValidatorInfo(validator2.address);
        expect(infoAfter[0]).to.be.lt(stakeBefore);
      });
    });
  });

  describe("BridgeOracle", function () {
    beforeEach(async function () {
      // Register validators
      const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
      const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));

      await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
        value: MINIMUM_STAKE,
      });
      await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
        value: MINIMUM_STAKE,
      });
    });

    describe("Chain Management", function () {
      it("should track supported chains", async function () {
        const supportedChains = await bridgeOracle.getSupportedChains();
        expect(supportedChains).to.include(BigInt(CHAIN_ID));
        expect(supportedChains).to.include(BigInt(DEST_CHAIN_ID));
      });

      it("should allow adding new chains", async function () {
        const newChainId = 137; // Polygon
        await bridgeOracle.addChain(newChainId);

        const supportedChains = await bridgeOracle.getSupportedChains();
        expect(supportedChains).to.include(BigInt(newChainId));
      });

      it("should allow removing chains", async function () {
        await bridgeOracle.removeChain(DEST_CHAIN_ID);

        expect(await bridgeOracle.isChainSupported(DEST_CHAIN_ID)).to.be.false;
      });
    });

    describe("State Root Updates", function () {
      it("should accept state root proposal from validator", async function () {
        const blockNumber = 1000;
        const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("state-root-1"));

        // Sign the message
        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "bytes32"],
          [CHAIN_ID, blockNumber, stateRoot]
        );
        const signature = await validator1.signMessage(ethers.getBytes(messageHash));

        await expect(
          bridgeOracle.connect(validator1).proposeStateRoot(
            CHAIN_ID,
            blockNumber,
            stateRoot,
            signature
          )
        ).to.emit(bridgeOracle, "StateRootProposed");
      });

      it("should finalize state root with threshold signatures", async function () {
        const blockNumber = 1000;
        const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("state-root-1"));

        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "bytes32"],
          [CHAIN_ID, blockNumber, stateRoot]
        );

        const signature1 = await validator1.signMessage(ethers.getBytes(messageHash));
        const signature2 = await validator2.signMessage(ethers.getBytes(messageHash));

        await expect(
          bridgeOracle.submitThresholdSignature(
            CHAIN_ID,
            blockNumber,
            stateRoot,
            [signature1, signature2]
          )
        ).to.emit(bridgeOracle, "StateRootFinalized");

        expect(await bridgeOracle.latestStateRoot(CHAIN_ID)).to.equal(stateRoot);
        expect(await bridgeOracle.latestFinalizedBlock(CHAIN_ID)).to.equal(blockNumber);
      });

      it("should reject insufficient signatures", async function () {
        const blockNumber = 1000;
        const stateRoot = ethers.keccak256(ethers.toUtf8Bytes("state-root-1"));

        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "bytes32"],
          [CHAIN_ID, blockNumber, stateRoot]
        );

        // Only one signature (need 50% = 1, but validator3 is not registered)
        const signature1 = await validator3.signMessage(ethers.getBytes(messageHash));

        await expect(
          bridgeOracle.submitThresholdSignature(
            CHAIN_ID,
            blockNumber,
            stateRoot,
            [signature1]
          )
        ).to.be.revertedWithCustomError(bridgeOracle, "InsufficientSignatures");
      });
    });

    describe("Proof Verification", function () {
      it("should verify valid merkle proofs", async function () {
        // First finalize a state root
        const blockNumber = 1000;

        // Create a simple merkle tree for testing
        const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("leaf1"));
        const leaf2 = ethers.keccak256(ethers.toUtf8Bytes("leaf2"));

        // Compute root (simplified)
        const sorted = leaf1 < leaf2 ? [leaf1, leaf2] : [leaf2, leaf1];
        const stateRoot = ethers.keccak256(ethers.concat(sorted));

        // Sign and submit
        const messageHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "bytes32"],
          [CHAIN_ID, blockNumber, stateRoot]
        );

        const signature1 = await validator1.signMessage(ethers.getBytes(messageHash));
        const signature2 = await validator2.signMessage(ethers.getBytes(messageHash));

        await bridgeOracle.submitThresholdSignature(
          CHAIN_ID,
          blockNumber,
          stateRoot,
          [signature1, signature2]
        );

        // Verify proof
        const proof = [leaf2];
        const isValid = await bridgeOracle.verifyProof(CHAIN_ID, blockNumber, proof, leaf1);
        expect(isValid).to.be.true;
      });
    });
  });

  describe("MessageBridge", function () {
    beforeEach(async function () {
      // Register validators
      const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
      await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
        value: MINIMUM_STAKE,
      });

      // Enable relayer whitelist and authorize owner
      await messageBridge.setRelayerWhitelistEnabled(true);
      await messageBridge.authorizeRelayer(owner.address);
    });

    describe("Message Sending", function () {
      it("should send a message with correct fee", async function () {
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");
        const gasLimit = 100000;

        // estimateFee uses tx.gasprice which is 0 in view calls, so add extra buffer for gas
        const baseFeeEstimate = await messageBridge.estimateFee(DEST_CHAIN_ID, gasLimit);
        const fee = baseFeeEstimate + ethers.parseEther("0.01"); // Add buffer for gas costs

        await expect(
          messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, gasLimit, {
            value: fee,
          })
        ).to.emit(messageBridge, "MessageSent");
      });

      it("should reject insufficient fee", async function () {
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");
        const gasLimit = 100000;

        await expect(
          messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, gasLimit, {
            value: ethers.parseEther("0.0001"),
          })
        ).to.be.revertedWithCustomError(messageBridge, "InsufficientFee");
      });

      it("should reject sending to same chain", async function () {
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");

        await expect(
          messageBridge.connect(user).sendMessage(CHAIN_ID, target, data, 0, {
            value: BASE_FEE,
          })
        ).to.be.revertedWithCustomError(messageBridge, "InvalidDestination");
      });

      it("should increment nonce correctly", async function () {
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");
        // Add buffer for gas costs since estimateFee returns 0 for gas component in tests
        const fee = (await messageBridge.estimateFee(DEST_CHAIN_ID, DEFAULT_GAS_LIMIT)) + ethers.parseEther("0.01");

        await messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, 0, {
          value: fee,
        });
        await messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, 0, {
          value: fee,
        });

        expect(await messageBridge.outboundNonce()).to.equal(2);
      });

      it("should refund excess fee", async function () {
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");
        const fee = await messageBridge.estimateFee(DEST_CHAIN_ID, DEFAULT_GAS_LIMIT);
        const excessFee = fee * 2n;

        const balanceBefore = await ethers.provider.getBalance(user.address);

        const tx = await messageBridge.connect(user).sendMessage(
          DEST_CHAIN_ID,
          target,
          data,
          0,
          { value: excessFee }
        );
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const balanceAfter = await ethers.provider.getBalance(user.address);
        const expectedBalance = balanceBefore - fee - gasUsed;

        // Allow small difference due to gas price variations
        expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
      });
    });

    describe("Message Queue", function () {
      it("should queue and dequeue messages", async function () {
        const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message-1"));

        await messageBridge.queueMessage(messageHash);
        expect(await messageBridge.getQueueLength()).to.equal(1);
        expect(await messageBridge.isQueued(messageHash)).to.be.true;

        await messageBridge.dequeueMessage(messageHash);
        expect(await messageBridge.getQueueLength()).to.equal(0);
        expect(await messageBridge.isQueued(messageHash)).to.be.false;
      });
    });

    describe("Relayer Authorization", function () {
      it("should authorize and revoke relayers", async function () {
        await messageBridge.authorizeRelayer(validator1.address);
        expect(await messageBridge.authorizedRelayers(validator1.address)).to.be.true;

        await messageBridge.revokeRelayer(validator1.address);
        expect(await messageBridge.authorizedRelayers(validator1.address)).to.be.false;
      });

      it("should reject unauthorized relayers when whitelist enabled", async function () {
        const messageHash = ethers.keccak256(ethers.toUtf8Bytes("message-1"));

        await expect(
          messageBridge.connect(validator2).queueMessage(messageHash)
        ).to.be.revertedWithCustomError(messageBridge, "UnauthorizedRelayer");
      });
    });

    describe("Pausable", function () {
      it("should pause and unpause the bridge", async function () {
        await messageBridge.pause();
        expect(await messageBridge.paused()).to.be.true;

        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");

        await expect(
          messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, 0, {
            value: BASE_FEE,
          })
        ).to.be.revertedWithCustomError(messageBridge, "EnforcedPause");

        await messageBridge.unpause();
        expect(await messageBridge.paused()).to.be.false;
      });
    });

    describe("Fee Management", function () {
      it("should update base fee", async function () {
        const newFee = ethers.parseEther("0.002");
        await messageBridge.setBaseFee(newFee);

        expect(await messageBridge.baseFee()).to.equal(newFee);
      });

      it("should set chain fee multiplier", async function () {
        const multiplier = 15000; // 150%
        await messageBridge.setChainFeeMultiplier(DEST_CHAIN_ID, multiplier);

        expect(await messageBridge.chainFeeMultiplier(DEST_CHAIN_ID)).to.equal(multiplier);
      });

      it("should withdraw accumulated fees", async function () {
        // Send a message to accumulate fees
        const target = user.address;
        const data = ethers.toUtf8Bytes("Hello");
        // Add buffer for gas costs
        const fee = (await messageBridge.estimateFee(DEST_CHAIN_ID, DEFAULT_GAS_LIMIT)) + ethers.parseEther("0.01");

        await messageBridge.connect(user).sendMessage(DEST_CHAIN_ID, target, data, 0, {
          value: fee,
        });

        const bridgeBalance = await ethers.provider.getBalance(await messageBridge.getAddress());
        expect(bridgeBalance).to.be.gt(0);

        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
        const tx = await messageBridge.withdrawFees(owner.address);
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
        expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + bridgeBalance - gasUsed);
      });
    });
  });

  describe("MerkleProof Library", function () {
    it("should be used in oracle verification", async function () {
      // Register validators
      const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
      const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));

      await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
        value: MINIMUM_STAKE,
      });
      await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
        value: MINIMUM_STAKE,
      });

      // Create leaves
      const leaves = [
        ethers.keccak256(ethers.toUtf8Bytes("leaf0")),
        ethers.keccak256(ethers.toUtf8Bytes("leaf1")),
        ethers.keccak256(ethers.toUtf8Bytes("leaf2")),
        ethers.keccak256(ethers.toUtf8Bytes("leaf3")),
      ];

      // Build tree manually (4 leaves = depth 2)
      const sortedPair = (a, b) => a < b ? [a, b] : [b, a];

      const level1_0 = ethers.keccak256(ethers.concat(sortedPair(leaves[0], leaves[1])));
      const level1_1 = ethers.keccak256(ethers.concat(sortedPair(leaves[2], leaves[3])));
      const root = ethers.keccak256(ethers.concat(sortedPair(level1_0, level1_1)));

      const blockNumber = 2000;

      // Finalize state root
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32"],
        [CHAIN_ID, blockNumber, root]
      );

      const signature1 = await validator1.signMessage(ethers.getBytes(messageHash));
      const signature2 = await validator2.signMessage(ethers.getBytes(messageHash));

      await bridgeOracle.submitThresholdSignature(
        CHAIN_ID,
        blockNumber,
        root,
        [signature1, signature2]
      );

      // Verify leaf0 with proof [leaf1, level1_1]
      const proof = [leaves[1], level1_1];
      const isValid = await bridgeOracle.verifyProof(CHAIN_ID, blockNumber, proof, leaves[0]);
      expect(isValid).to.be.true;

      // Verify leaf2 with proof [leaf3, level1_0]
      const proof2 = [leaves[3], level1_0];
      const isValid2 = await bridgeOracle.verifyProof(CHAIN_ID, blockNumber, proof2, leaves[2]);
      expect(isValid2).to.be.true;
    });
  });

  describe("Integration Tests", function () {
    beforeEach(async function () {
      // Full setup
      const publicKey1 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-1"));
      const publicKey2 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-2"));

      await validatorRegistry.connect(validator1).registerValidator(publicKey1, {
        value: MINIMUM_STAKE,
      });
      await validatorRegistry.connect(validator2).registerValidator(publicKey2, {
        value: MINIMUM_STAKE,
      });

      await messageBridge.setRelayerWhitelistEnabled(true);
      await messageBridge.authorizeRelayer(owner.address);
    });

    it("should complete full message lifecycle", async function () {
      // 1. Send message
      const target = user.address;
      const data = ethers.toUtf8Bytes("Cross-chain greeting");
      const gasLimit = 100000;

      // Add buffer for gas costs
      const fee = (await messageBridge.estimateFee(DEST_CHAIN_ID, gasLimit)) + ethers.parseEther("0.01");
      const sendTx = await messageBridge.connect(user).sendMessage(
        DEST_CHAIN_ID,
        target,
        data,
        gasLimit,
        { value: fee }
      );

      const receipt = await sendTx.wait();
      let messageHash;
      let nonce;

      for (const log of receipt.logs) {
        try {
          const parsed = messageBridge.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsed.name === "MessageSent") {
            messageHash = parsed.args[0];
            nonce = parsed.args[1];
            break;
          }
        } catch (e) {
          // Not our event
        }
      }

      expect(messageHash).to.not.be.undefined;
      expect(nonce).to.equal(0);

      // 2. Create and finalize state root (simulating oracle update)
      const stateRoot = ethers.keccak256(
        ethers.toUtf8Bytes("state-containing-message-" + messageHash)
      );
      const blockNumber = receipt.blockNumber;

      const msgHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "bytes32"],
        [CHAIN_ID, blockNumber, stateRoot]
      );

      const sig1 = await validator1.signMessage(ethers.getBytes(msgHash));
      const sig2 = await validator2.signMessage(ethers.getBytes(msgHash));

      await bridgeOracle.submitThresholdSignature(
        CHAIN_ID,
        blockNumber,
        stateRoot,
        [sig1, sig2]
      );

      // 3. Verify oracle state
      expect(await bridgeOracle.latestStateRoot(CHAIN_ID)).to.equal(stateRoot);
      expect(await bridgeOracle.latestFinalizedBlock(CHAIN_ID)).to.equal(blockNumber);

      // 4. Queue the message
      await messageBridge.queueMessage(messageHash);
      expect(await messageBridge.isQueued(messageHash)).to.be.true;

      // 5. Verify bridge balance increased (bridge keeps at least baseFee)
      const bridgeBalance = await ethers.provider.getBalance(
        await messageBridge.getAddress()
      );
      expect(bridgeBalance).to.be.gt(0);
    });

    it("should handle validator rotation scenario", async function () {
      // Check initial state
      expect(await validatorRegistry.getActiveValidatorCount()).to.equal(2);

      // Add new validator
      const publicKey3 = ethers.keccak256(ethers.toUtf8Bytes("pubkey-3"));
      await validatorRegistry.connect(validator3).registerValidator(publicKey3, {
        value: MINIMUM_STAKE,
      });

      expect(await validatorRegistry.getActiveValidatorCount()).to.equal(3);

      // Remove old validator
      await validatorRegistry.connect(validator1).unregisterValidator();

      expect(await validatorRegistry.getActiveValidatorCount()).to.equal(2);
      expect(await validatorRegistry.isActiveValidator(validator1.address)).to.be.false;
      expect(await validatorRegistry.isActiveValidator(validator3.address)).to.be.true;
    });

    it("should handle multiple sequential state root updates", async function () {
      for (let i = 1; i <= 3; i++) {
        const blockNumber = 1000 * i;
        const stateRoot = ethers.keccak256(ethers.toUtf8Bytes(`state-root-${i}`));

        const msgHash = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "bytes32"],
          [CHAIN_ID, blockNumber, stateRoot]
        );

        const sig1 = await validator1.signMessage(ethers.getBytes(msgHash));
        const sig2 = await validator2.signMessage(ethers.getBytes(msgHash));

        await bridgeOracle.submitThresholdSignature(
          CHAIN_ID,
          blockNumber,
          stateRoot,
          [sig1, sig2]
        );

        expect(await bridgeOracle.latestFinalizedBlock(CHAIN_ID)).to.equal(blockNumber);
        expect(await bridgeOracle.latestStateRoot(CHAIN_ID)).to.equal(stateRoot);
      }
    });
  });
});
