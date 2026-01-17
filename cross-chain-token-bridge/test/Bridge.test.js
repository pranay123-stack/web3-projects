/**
 * @title Bridge.test.js
 * @author Cross-Chain Token Bridge Team
 * @notice Comprehensive test suite for the Cross-Chain Token Bridge
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Cross-Chain Token Bridge", function () {
    // Constants
    const INITIAL_FEE_BPS = 30; // 0.3%
    const SIGNATURE_THRESHOLD = 2;
    const SOURCE_CHAIN_ID = 1;
    const DEST_CHAIN_ID = 2;
    const BRIDGE_AMOUNT = ethers.parseEther("1000");
    const MAX_FEE_BPS = 500;

    /**
     * @notice Helper function to create validator signatures
     */
    async function createSignature(signer, token, amount, recipient, nonce, sourceChainId, destChainId) {
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "address", "uint256", "uint256", "uint256"],
            [token, amount, recipient, nonce, sourceChainId, destChainId]
        );
        return await signer.signMessage(ethers.getBytes(messageHash));
    }

    /**
     * @notice Deploys all contracts and sets up initial configuration
     */
    async function deployBridgeFixture() {
        const [owner, feeCollector, validator1, validator2, validator3, user, otherUser] =
            await ethers.getSigners();

        // Deploy Source Bridge
        const SourceChainBridge = await ethers.getContractFactory("SourceChainBridge");
        const sourceBridge = await SourceChainBridge.deploy(
            owner.address,
            feeCollector.address,
            INITIAL_FEE_BPS,
            SIGNATURE_THRESHOLD
        );

        // Deploy Destination Bridge
        const DestinationChainBridge = await ethers.getContractFactory("DestinationChainBridge");
        const destBridge = await DestinationChainBridge.deploy(
            owner.address,
            feeCollector.address,
            INITIAL_FEE_BPS,
            SIGNATURE_THRESHOLD
        );

        // Deploy Mock Token for source chain testing
        const WrappedToken = await ethers.getContractFactory("WrappedToken");
        const mockToken = await WrappedToken.deploy(
            "Mock Token",
            "MTK",
            18,
            owner.address,
            SOURCE_CHAIN_ID,
            owner.address,
            owner.address
        );

        // Setup Source Bridge
        await sourceBridge.addValidator(validator1.address);
        await sourceBridge.addValidator(validator2.address);
        await sourceBridge.addValidator(validator3.address);
        await sourceBridge.addSupportedToken(await mockToken.getAddress());
        await sourceBridge.addSupportedChain(DEST_CHAIN_ID);

        // Setup Destination Bridge
        await destBridge.addValidator(validator1.address);
        await destBridge.addValidator(validator2.address);
        await destBridge.addValidator(validator3.address);
        await destBridge.addSupportedSourceChain(SOURCE_CHAIN_ID);

        // Deploy wrapped token via destination bridge
        await destBridge.deployWrappedToken(
            await mockToken.getAddress(),
            SOURCE_CHAIN_ID,
            "Wrapped Mock Token",
            "wMTK",
            18
        );
        const wrappedTokenAddress = await destBridge.getWrappedToken(await mockToken.getAddress());
        const wrappedToken = await ethers.getContractAt("WrappedToken", wrappedTokenAddress);

        // Mint tokens to user for testing
        await mockToken.mint(user.address, BRIDGE_AMOUNT);

        return {
            sourceBridge,
            destBridge,
            mockToken,
            wrappedToken,
            owner,
            feeCollector,
            validator1,
            validator2,
            validator3,
            user,
            otherUser
        };
    }

    // ============ WrappedToken Tests ============
    describe("WrappedToken", function () {
        describe("Deployment", function () {
            it("Should set the correct name and symbol", async function () {
                const { wrappedToken } = await loadFixture(deployBridgeFixture);
                expect(await wrappedToken.name()).to.equal("Wrapped Mock Token");
                expect(await wrappedToken.symbol()).to.equal("wMTK");
            });

            it("Should set the correct decimals", async function () {
                const { wrappedToken } = await loadFixture(deployBridgeFixture);
                expect(await wrappedToken.decimals()).to.equal(18);
            });

            it("Should set the correct original token info", async function () {
                const { mockToken, wrappedToken } = await loadFixture(deployBridgeFixture);
                const [originalToken, sourceChainId] = await wrappedToken.getOriginalTokenInfo();
                expect(originalToken).to.equal(await mockToken.getAddress());
                expect(sourceChainId).to.equal(SOURCE_CHAIN_ID);
            });

            it("Should revert deployment with zero address", async function () {
                const WrappedToken = await ethers.getContractFactory("WrappedToken");
                const [owner] = await ethers.getSigners();

                await expect(
                    WrappedToken.deploy(
                        "Test",
                        "TST",
                        18,
                        ethers.ZeroAddress,
                        1,
                        owner.address,
                        owner.address
                    )
                ).to.be.revertedWithCustomError(WrappedToken, "InvalidAddress");
            });
        });

        describe("Minting and Burning", function () {
            it("Should allow bridge to mint tokens", async function () {
                const { destBridge, mockToken, wrappedToken, user, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                const amount = ethers.parseEther("100");
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );

                await destBridge.mintWrappedTokens(
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    [sig1, sig2]
                );

                // Amount after fee
                const fee = (amount * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const expectedAmount = amount - fee;
                expect(await wrappedToken.balanceOf(user.address)).to.equal(expectedAmount);
            });

            it("Should not allow non-bridge to mint", async function () {
                const { wrappedToken, user } = await loadFixture(deployBridgeFixture);

                await expect(
                    wrappedToken.connect(user).mint(user.address, ethers.parseEther("100"))
                ).to.be.reverted;
            });

            it("Should not allow non-bridge to bridgeBurn", async function () {
                const { wrappedToken, user } = await loadFixture(deployBridgeFixture);

                await expect(
                    wrappedToken.connect(user).bridgeBurn(user.address, ethers.parseEther("100"))
                ).to.be.reverted;
            });
        });

        describe("Pausable", function () {
            it("Should pause and unpause correctly", async function () {
                const { mockToken, owner, user } = await loadFixture(deployBridgeFixture);

                await mockToken.pause();
                expect(await mockToken.paused()).to.be.true;

                await expect(
                    mockToken.connect(owner).mint(user.address, ethers.parseEther("100"))
                ).to.be.reverted;

                await mockToken.unpause();
                expect(await mockToken.paused()).to.be.false;
            });
        });
    });

    // ============ SourceChainBridge Tests ============
    describe("SourceChainBridge", function () {
        describe("Deployment", function () {
            it("Should set the correct initial parameters", async function () {
                const { sourceBridge, feeCollector } = await loadFixture(deployBridgeFixture);

                expect(await sourceBridge.bridgeFee()).to.equal(INITIAL_FEE_BPS);
                expect(await sourceBridge.signatureThreshold()).to.equal(SIGNATURE_THRESHOLD);
                expect(await sourceBridge.feeCollector()).to.equal(feeCollector.address);
            });

            it("Should have correct number of validators", async function () {
                const { sourceBridge } = await loadFixture(deployBridgeFixture);
                expect(await sourceBridge.getValidatorCount()).to.equal(3);
            });

            it("Should revert with invalid constructor parameters", async function () {
                const SourceChainBridge = await ethers.getContractFactory("SourceChainBridge");
                const [owner, feeCollector] = await ethers.getSigners();

                await expect(
                    SourceChainBridge.deploy(
                        ethers.ZeroAddress,
                        feeCollector.address,
                        INITIAL_FEE_BPS,
                        SIGNATURE_THRESHOLD
                    )
                ).to.be.revertedWithCustomError(SourceChainBridge, "InvalidAddress");

                await expect(
                    SourceChainBridge.deploy(
                        owner.address,
                        feeCollector.address,
                        MAX_FEE_BPS + 1,
                        SIGNATURE_THRESHOLD
                    )
                ).to.be.revertedWithCustomError(SourceChainBridge, "FeeTooHigh");

                await expect(
                    SourceChainBridge.deploy(
                        owner.address,
                        feeCollector.address,
                        INITIAL_FEE_BPS,
                        0
                    )
                ).to.be.revertedWithCustomError(SourceChainBridge, "InvalidThreshold");
            });
        });

        describe("Lock Tokens", function () {
            it("Should lock tokens and emit event", async function () {
                const { sourceBridge, mockToken, user, feeCollector } =
                    await loadFixture(deployBridgeFixture);

                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const amountAfterFee = BRIDGE_AMOUNT - fee;

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await mockToken.getAddress(),
                        BRIDGE_AMOUNT,
                        user.address,
                        DEST_CHAIN_ID
                    )
                ).to.emit(sourceBridge, "TokensLocked")
                 .withArgs(
                    user.address,
                    user.address,
                    await mockToken.getAddress(),
                    amountAfterFee,
                    1, // nonce
                    DEST_CHAIN_ID,
                    (await ethers.provider.getBlock("latest")).timestamp + 1
                 );

                // Check balances
                expect(await mockToken.balanceOf(user.address)).to.equal(0);
                expect(await sourceBridge.getLockedAmount(await mockToken.getAddress()))
                    .to.equal(amountAfterFee);
                expect(await mockToken.balanceOf(feeCollector.address)).to.equal(fee);
            });

            it("Should revert lock with unsupported token", async function () {
                const { sourceBridge, user, owner } = await loadFixture(deployBridgeFixture);

                const WrappedToken = await ethers.getContractFactory("WrappedToken");
                const unsupportedToken = await WrappedToken.deploy(
                    "Unsupported",
                    "UNS",
                    18,
                    owner.address,
                    1,
                    owner.address,
                    owner.address
                );

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await unsupportedToken.getAddress(),
                        BRIDGE_AMOUNT,
                        user.address,
                        DEST_CHAIN_ID
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "TokenNotSupported");
            });

            it("Should revert lock with unsupported chain", async function () {
                const { sourceBridge, mockToken, user } = await loadFixture(deployBridgeFixture);

                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await mockToken.getAddress(),
                        BRIDGE_AMOUNT,
                        user.address,
                        999 // Unsupported chain
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "InvalidChainId");
            });

            it("Should revert lock with zero amount", async function () {
                const { sourceBridge, mockToken, user } = await loadFixture(deployBridgeFixture);

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await mockToken.getAddress(),
                        0,
                        user.address,
                        DEST_CHAIN_ID
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "InvalidAmount");
            });

            it("Should revert lock with zero recipient", async function () {
                const { sourceBridge, mockToken, user } = await loadFixture(deployBridgeFixture);

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await mockToken.getAddress(),
                        BRIDGE_AMOUNT,
                        ethers.ZeroAddress,
                        DEST_CHAIN_ID
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "InvalidAddress");
            });
        });

        describe("Unlock Tokens", function () {
            it("Should unlock tokens with valid signatures", async function () {
                const { sourceBridge, mockToken, user, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                // First lock tokens
                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const lockedAmount = BRIDGE_AMOUNT - fee;
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                // Create signatures for unlock
                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    lockedAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    lockedAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );

                await expect(
                    sourceBridge.unlockTokens(
                        await mockToken.getAddress(),
                        lockedAmount,
                        user.address,
                        nonce,
                        DEST_CHAIN_ID,
                        [sig1, sig2]
                    )
                ).to.emit(sourceBridge, "TokensUnlocked")
                 .withArgs(user.address, await mockToken.getAddress(), lockedAmount, nonce, DEST_CHAIN_ID);

                expect(await mockToken.balanceOf(user.address)).to.equal(lockedAmount);
            });

            it("Should revert unlock with insufficient signatures", async function () {
                const { sourceBridge, mockToken, user, validator1 } =
                    await loadFixture(deployBridgeFixture);

                // First lock tokens
                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const lockedAmount = BRIDGE_AMOUNT - fee;
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    lockedAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );

                await expect(
                    sourceBridge.unlockTokens(
                        await mockToken.getAddress(),
                        lockedAmount,
                        user.address,
                        nonce,
                        DEST_CHAIN_ID,
                        [sig1]
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "InsufficientSignatures");
            });

            it("Should revert unlock with duplicate signatures", async function () {
                const { sourceBridge, mockToken, user, validator1 } =
                    await loadFixture(deployBridgeFixture);

                // First lock tokens
                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const lockedAmount = BRIDGE_AMOUNT - fee;
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    lockedAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );

                await expect(
                    sourceBridge.unlockTokens(
                        await mockToken.getAddress(),
                        lockedAmount,
                        user.address,
                        nonce,
                        DEST_CHAIN_ID,
                        [sig1, sig1]
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "InsufficientSignatures");
            });

            it("Should revert unlock with used nonce", async function () {
                const { sourceBridge, mockToken, user, owner, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                // First lock tokens
                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const lockedAmount = BRIDGE_AMOUNT - fee;
                const halfAmount = lockedAmount / BigInt(2);
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    halfAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    halfAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    Number(chainId)
                );

                await sourceBridge.unlockTokens(
                    await mockToken.getAddress(),
                    halfAmount,
                    user.address,
                    nonce,
                    DEST_CHAIN_ID,
                    [sig1, sig2]
                );

                await expect(
                    sourceBridge.unlockTokens(
                        await mockToken.getAddress(),
                        halfAmount,
                        user.address,
                        nonce,
                        DEST_CHAIN_ID,
                        [sig1, sig2]
                    )
                ).to.be.revertedWithCustomError(sourceBridge, "NonceAlreadyUsed");
            });
        });

        describe("Admin Functions", function () {
            it("Should update bridge fee", async function () {
                const { sourceBridge, owner } = await loadFixture(deployBridgeFixture);

                const newFee = 50;
                await expect(sourceBridge.updateBridgeFee(newFee))
                    .to.emit(sourceBridge, "FeeUpdated")
                    .withArgs(INITIAL_FEE_BPS, newFee);

                expect(await sourceBridge.bridgeFee()).to.equal(newFee);
            });

            it("Should revert fee update exceeding max", async function () {
                const { sourceBridge } = await loadFixture(deployBridgeFixture);

                await expect(
                    sourceBridge.updateBridgeFee(MAX_FEE_BPS + 1)
                ).to.be.revertedWithCustomError(sourceBridge, "FeeTooHigh");
            });

            it("Should add and remove validators", async function () {
                const { sourceBridge, otherUser } = await loadFixture(deployBridgeFixture);

                await expect(sourceBridge.addValidator(otherUser.address))
                    .to.emit(sourceBridge, "ValidatorUpdated")
                    .withArgs(otherUser.address, true);

                expect(await sourceBridge.validators(otherUser.address)).to.be.true;
                expect(await sourceBridge.getValidatorCount()).to.equal(4);

                await expect(sourceBridge.removeValidator(otherUser.address))
                    .to.emit(sourceBridge, "ValidatorUpdated")
                    .withArgs(otherUser.address, false);

                expect(await sourceBridge.validators(otherUser.address)).to.be.false;
                expect(await sourceBridge.getValidatorCount()).to.equal(3);
            });

            it("Should update signature threshold", async function () {
                const { sourceBridge } = await loadFixture(deployBridgeFixture);

                const newThreshold = 3;
                await expect(sourceBridge.updateSignatureThreshold(newThreshold))
                    .to.emit(sourceBridge, "ThresholdUpdated")
                    .withArgs(SIGNATURE_THRESHOLD, newThreshold);

                expect(await sourceBridge.signatureThreshold()).to.equal(newThreshold);
            });

            it("Should revert threshold update exceeding validators", async function () {
                const { sourceBridge } = await loadFixture(deployBridgeFixture);

                await expect(
                    sourceBridge.updateSignatureThreshold(10)
                ).to.be.revertedWithCustomError(sourceBridge, "InvalidThreshold");
            });

            it("Should pause and unpause", async function () {
                const { sourceBridge, mockToken, user } = await loadFixture(deployBridgeFixture);

                await sourceBridge.pause();
                expect(await sourceBridge.paused()).to.be.true;

                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );

                await expect(
                    sourceBridge.connect(user).lockTokens(
                        await mockToken.getAddress(),
                        BRIDGE_AMOUNT,
                        user.address,
                        DEST_CHAIN_ID
                    )
                ).to.be.reverted;

                await sourceBridge.unpause();
                expect(await sourceBridge.paused()).to.be.false;
            });

            it("Should allow emergency withdrawal when paused", async function () {
                const { sourceBridge, mockToken, user, owner } =
                    await loadFixture(deployBridgeFixture);

                // Lock tokens first
                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                const fee = (BRIDGE_AMOUNT * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const lockedAmount = BRIDGE_AMOUNT - fee;

                // Pause and emergency withdraw
                await sourceBridge.pause();
                await sourceBridge.emergencyWithdraw(
                    await mockToken.getAddress(),
                    lockedAmount,
                    owner.address
                );

                expect(await mockToken.balanceOf(owner.address)).to.equal(lockedAmount);
            });
        });

        describe("View Functions", function () {
            it("Should return correct user nonce", async function () {
                const { sourceBridge, mockToken, user } = await loadFixture(deployBridgeFixture);

                expect(await sourceBridge.getUserNonce(user.address)).to.equal(0);

                await mockToken.connect(user).approve(
                    await sourceBridge.getAddress(),
                    BRIDGE_AMOUNT
                );
                await sourceBridge.connect(user).lockTokens(
                    await mockToken.getAddress(),
                    BRIDGE_AMOUNT,
                    user.address,
                    DEST_CHAIN_ID
                );

                expect(await sourceBridge.getUserNonce(user.address)).to.equal(1);
            });

            it("Should check if token is supported", async function () {
                const { sourceBridge, mockToken, owner } = await loadFixture(deployBridgeFixture);

                expect(await sourceBridge.isTokenSupported(await mockToken.getAddress())).to.be.true;
                expect(await sourceBridge.isTokenSupported(owner.address)).to.be.false;
            });
        });
    });

    // ============ DestinationChainBridge Tests ============
    describe("DestinationChainBridge", function () {
        describe("Deployment", function () {
            it("Should set the correct initial parameters", async function () {
                const { destBridge, feeCollector } = await loadFixture(deployBridgeFixture);

                expect(await destBridge.bridgeFee()).to.equal(INITIAL_FEE_BPS);
                expect(await destBridge.signatureThreshold()).to.equal(SIGNATURE_THRESHOLD);
                expect(await destBridge.feeCollector()).to.equal(feeCollector.address);
            });
        });

        describe("Mint Wrapped Tokens", function () {
            it("Should mint wrapped tokens with valid signatures", async function () {
                const { destBridge, mockToken, wrappedToken, user, feeCollector, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                const amount = ethers.parseEther("100");
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );

                const fee = (amount * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const expectedAmount = amount - fee;

                await expect(
                    destBridge.mintWrappedTokens(
                        await mockToken.getAddress(),
                        amount,
                        user.address,
                        nonce,
                        SOURCE_CHAIN_ID,
                        [sig1, sig2]
                    )
                ).to.emit(destBridge, "TokensMinted")
                 .withArgs(user.address, await wrappedToken.getAddress(), expectedAmount, nonce, SOURCE_CHAIN_ID);

                expect(await wrappedToken.balanceOf(user.address)).to.equal(expectedAmount);
                expect(await wrappedToken.balanceOf(feeCollector.address)).to.equal(fee);
            });

            it("Should revert mint with unsupported token", async function () {
                const { destBridge, user, owner, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                const fakeToken = owner.address;
                const amount = ethers.parseEther("100");
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    fakeToken,
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    fakeToken,
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );

                await expect(
                    destBridge.mintWrappedTokens(
                        fakeToken,
                        amount,
                        user.address,
                        nonce,
                        SOURCE_CHAIN_ID,
                        [sig1, sig2]
                    )
                ).to.be.revertedWithCustomError(destBridge, "TokenNotSupported");
            });

            it("Should revert mint with unsupported source chain", async function () {
                const { destBridge, mockToken, user, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                const amount = ethers.parseEther("100");
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    999, // Unsupported chain
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    999,
                    Number(chainId)
                );

                await expect(
                    destBridge.mintWrappedTokens(
                        await mockToken.getAddress(),
                        amount,
                        user.address,
                        nonce,
                        999,
                        [sig1, sig2]
                    )
                ).to.be.revertedWithCustomError(destBridge, "InvalidChainId");
            });
        });

        describe("Burn Wrapped Tokens", function () {
            it("Should burn wrapped tokens and emit event", async function () {
                const { destBridge, mockToken, wrappedToken, user, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                // First mint some tokens
                const amount = ethers.parseEther("100");
                const mintNonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    mintNonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    mintNonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );

                await destBridge.mintWrappedTokens(
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    mintNonce,
                    SOURCE_CHAIN_ID,
                    [sig1, sig2]
                );

                const fee = (amount * BigInt(INITIAL_FEE_BPS)) / BigInt(10000);
                const userBalance = amount - fee;

                // Now burn
                await wrappedToken.connect(user).approve(
                    await destBridge.getAddress(),
                    userBalance
                );

                await expect(
                    destBridge.connect(user).burnWrappedTokens(
                        await wrappedToken.getAddress(),
                        userBalance,
                        user.address,
                        SOURCE_CHAIN_ID
                    )
                ).to.emit(destBridge, "TokensBurned")
                 .withArgs(
                    user.address,
                    user.address,
                    await mockToken.getAddress(),
                    userBalance,
                    1, // burn nonce
                    SOURCE_CHAIN_ID
                 );

                expect(await wrappedToken.balanceOf(user.address)).to.equal(0);
            });

            it("Should revert burn with unsupported wrapped token", async function () {
                const { destBridge, user, owner } = await loadFixture(deployBridgeFixture);

                await expect(
                    destBridge.connect(user).burnWrappedTokens(
                        owner.address, // Not a wrapped token
                        ethers.parseEther("100"),
                        user.address,
                        SOURCE_CHAIN_ID
                    )
                ).to.be.revertedWithCustomError(destBridge, "TokenNotSupported");
            });
        });

        describe("Token Deployment", function () {
            it("Should deploy wrapped token correctly", async function () {
                const { destBridge, owner } = await loadFixture(deployBridgeFixture);

                const originalToken = owner.address; // Using address as mock

                const tx = await destBridge.deployWrappedToken(
                    originalToken,
                    SOURCE_CHAIN_ID,
                    "New Wrapped Token",
                    "NWT",
                    18
                );
                await tx.wait();

                const wrappedAddress = await destBridge.getWrappedToken(originalToken);
                expect(wrappedAddress).to.not.equal(ethers.ZeroAddress);

                const wrapped = await ethers.getContractAt("WrappedToken", wrappedAddress);
                expect(await wrapped.name()).to.equal("New Wrapped Token");
                expect(await wrapped.symbol()).to.equal("NWT");
            });

            it("Should revert deploying duplicate wrapped token", async function () {
                const { destBridge, mockToken } = await loadFixture(deployBridgeFixture);

                await expect(
                    destBridge.deployWrappedToken(
                        await mockToken.getAddress(),
                        SOURCE_CHAIN_ID,
                        "Duplicate",
                        "DUP",
                        18
                    )
                ).to.be.revertedWithCustomError(destBridge, "TokenNotSupported");
            });
        });

        describe("View Functions", function () {
            it("Should return correct wrapped token mapping", async function () {
                const { destBridge, mockToken, wrappedToken } = await loadFixture(deployBridgeFixture);

                expect(await destBridge.getWrappedToken(await mockToken.getAddress()))
                    .to.equal(await wrappedToken.getAddress());
                expect(await destBridge.getOriginalToken(await wrappedToken.getAddress()))
                    .to.equal(await mockToken.getAddress());
            });

            it("Should track total minted correctly", async function () {
                const { destBridge, mockToken, wrappedToken, user, validator1, validator2 } =
                    await loadFixture(deployBridgeFixture);

                const amount = ethers.parseEther("100");
                const nonce = 1;
                const chainId = (await ethers.provider.getNetwork()).chainId;

                const sig1 = await createSignature(
                    validator1,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );
                const sig2 = await createSignature(
                    validator2,
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    Number(chainId)
                );

                await destBridge.mintWrappedTokens(
                    await mockToken.getAddress(),
                    amount,
                    user.address,
                    nonce,
                    SOURCE_CHAIN_ID,
                    [sig1, sig2]
                );

                expect(await destBridge.getTotalMinted(await wrappedToken.getAddress()))
                    .to.equal(amount);
            });
        });
    });

    // ============ Integration Tests ============
    describe("Full Bridge Flow Integration", function () {
        it("Should complete a full bridge round trip", async function () {
            const { sourceBridge, destBridge, mockToken, wrappedToken, user, validator1, validator2 } =
                await loadFixture(deployBridgeFixture);

            const chainId = (await ethers.provider.getNetwork()).chainId;
            const initialBalance = await mockToken.balanceOf(user.address);

            // Step 1: Lock tokens on source chain
            await mockToken.connect(user).approve(
                await sourceBridge.getAddress(),
                BRIDGE_AMOUNT
            );

            const lockTx = await sourceBridge.connect(user).lockTokens(
                await mockToken.getAddress(),
                BRIDGE_AMOUNT,
                user.address,
                DEST_CHAIN_ID
            );
            const lockReceipt = await lockTx.wait();

            const lockEvent = lockReceipt.logs.find(
                log => log.fragment && log.fragment.name === "TokensLocked"
            );
            const lockNonce = lockEvent.args.nonce;
            const lockedAmount = lockEvent.args.amount;

            // Step 2: Create signatures and mint on destination
            const mintSig1 = await createSignature(
                validator1,
                await mockToken.getAddress(),
                lockedAmount,
                user.address,
                lockNonce,
                SOURCE_CHAIN_ID,
                Number(chainId)
            );
            const mintSig2 = await createSignature(
                validator2,
                await mockToken.getAddress(),
                lockedAmount,
                user.address,
                lockNonce,
                SOURCE_CHAIN_ID,
                Number(chainId)
            );

            await destBridge.mintWrappedTokens(
                await mockToken.getAddress(),
                lockedAmount,
                user.address,
                lockNonce,
                SOURCE_CHAIN_ID,
                [mintSig1, mintSig2]
            );

            const mintedAmount = await wrappedToken.balanceOf(user.address);
            expect(mintedAmount).to.be.gt(0);

            // Step 3: Burn wrapped tokens
            await wrappedToken.connect(user).approve(
                await destBridge.getAddress(),
                mintedAmount
            );

            const burnTx = await destBridge.connect(user).burnWrappedTokens(
                await wrappedToken.getAddress(),
                mintedAmount,
                user.address,
                SOURCE_CHAIN_ID
            );
            const burnReceipt = await burnTx.wait();

            const burnEvent = burnReceipt.logs.find(
                log => log.fragment && log.fragment.name === "TokensBurned"
            );
            const burnNonce = burnEvent.args.nonce;
            const burnedAmount = burnEvent.args.amount;

            // Step 4: Create signatures and unlock on source
            const unlockSig1 = await createSignature(
                validator1,
                await mockToken.getAddress(),
                burnedAmount,
                user.address,
                burnNonce,
                DEST_CHAIN_ID,
                Number(chainId)
            );
            const unlockSig2 = await createSignature(
                validator2,
                await mockToken.getAddress(),
                burnedAmount,
                user.address,
                burnNonce,
                DEST_CHAIN_ID,
                Number(chainId)
            );

            await sourceBridge.unlockTokens(
                await mockToken.getAddress(),
                burnedAmount,
                user.address,
                burnNonce,
                DEST_CHAIN_ID,
                [unlockSig1, unlockSig2]
            );

            const finalBalance = await mockToken.balanceOf(user.address);

            // User should have less than initial due to fees
            expect(finalBalance).to.be.lt(initialBalance);
            expect(finalBalance).to.be.gt(0);

            // Wrapped token balance should be zero
            expect(await wrappedToken.balanceOf(user.address)).to.equal(0);
        });
    });
});
