/**
 * @title Bridge Tokens Script
 * @author Cross-Chain Token Bridge Team
 * @notice Demonstrates the complete flow of bridging tokens between chains
 * @dev This script simulates:
 *      1. Locking tokens on the source chain
 *      2. Validators signing the lock event
 *      3. Minting wrapped tokens on the destination chain
 *      4. Burning wrapped tokens
 *      5. Validators signing the burn event
 *      6. Unlocking tokens on the source chain
 */

const { ethers } = require("hardhat");

/**
 * @notice Creates a validator signature for bridge operations
 * @param signer The signer wallet
 * @param token Token address
 * @param amount Amount being bridged
 * @param recipient Recipient address
 * @param nonce Transfer nonce
 * @param sourceChainId Source chain ID
 * @param destChainId Destination chain ID
 */
async function createSignature(signer, token, amount, recipient, nonce, sourceChainId, destChainId) {
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "address", "uint256", "uint256", "uint256"],
        [token, amount, recipient, nonce, sourceChainId, destChainId]
    );

    const signature = await signer.signMessage(ethers.getBytes(messageHash));
    return signature;
}

async function main() {
    console.log("=".repeat(60));
    console.log("Cross-Chain Token Bridge - Bridge Tokens Demo");
    console.log("=".repeat(60));

    // Get signers
    const [deployer, feeCollector, validator1, validator2, validator3, user] = await ethers.getSigners();

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const SOURCE_CHAIN_ID = Number(chainId);
    const DEST_CHAIN_ID = 2; // Mock destination chain

    console.log("\n--- Setup ---");
    console.log(`User address: ${user.address}`);
    console.log(`Source Chain ID: ${SOURCE_CHAIN_ID}`);
    console.log(`Destination Chain ID: ${DEST_CHAIN_ID}`);

    // Configuration
    const INITIAL_FEE_BPS = 30;
    const SIGNATURE_THRESHOLD = 2;

    // Deploy contracts
    console.log("\n--- Deploying Contracts ---");

    // Deploy Source Bridge
    const SourceChainBridge = await ethers.getContractFactory("SourceChainBridge");
    const sourceBridge = await SourceChainBridge.deploy(
        deployer.address,
        feeCollector.address,
        INITIAL_FEE_BPS,
        SIGNATURE_THRESHOLD
    );
    await sourceBridge.waitForDeployment();
    console.log(`SourceChainBridge deployed`);

    // Deploy Destination Bridge
    const DestinationChainBridge = await ethers.getContractFactory("DestinationChainBridge");
    const destBridge = await DestinationChainBridge.deploy(
        deployer.address,
        feeCollector.address,
        INITIAL_FEE_BPS,
        SIGNATURE_THRESHOLD
    );
    await destBridge.waitForDeployment();
    console.log(`DestinationChainBridge deployed`);

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("WrappedToken");
    const mockToken = await MockToken.deploy(
        "Mock Token",
        "MTK",
        18,
        deployer.address,
        SOURCE_CHAIN_ID,
        deployer.address,
        deployer.address
    );
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log(`Mock Token deployed`);

    // Configure Source Bridge
    await sourceBridge.addValidator(validator1.address);
    await sourceBridge.addValidator(validator2.address);
    await sourceBridge.addValidator(validator3.address);
    await sourceBridge.addSupportedToken(mockTokenAddress);
    await sourceBridge.addSupportedChain(DEST_CHAIN_ID);
    console.log("Source Bridge configured");

    // Configure Destination Bridge
    await destBridge.addValidator(validator1.address);
    await destBridge.addValidator(validator2.address);
    await destBridge.addValidator(validator3.address);
    await destBridge.addSupportedSourceChain(SOURCE_CHAIN_ID);
    console.log("Destination Bridge configured");

    // Deploy wrapped token
    await destBridge.deployWrappedToken(
        mockTokenAddress,
        SOURCE_CHAIN_ID,
        "Wrapped Mock Token",
        "wMTK",
        18
    );
    const wrappedTokenAddress = await destBridge.getWrappedToken(mockTokenAddress);
    const wrappedToken = await ethers.getContractAt("WrappedToken", wrappedTokenAddress);
    console.log("Wrapped Token deployed");

    // Mint tokens to user for testing
    const BRIDGE_AMOUNT = ethers.parseEther("1000");
    await mockToken.mint(user.address, BRIDGE_AMOUNT);
    console.log(`\nMinted ${ethers.formatEther(BRIDGE_AMOUNT)} MTK to user`);

    // ============ STEP 1: Lock Tokens on Source Chain ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: Locking Tokens on Source Chain");
    console.log("=".repeat(60));

    // Approve bridge to spend tokens
    await mockToken.connect(user).approve(await sourceBridge.getAddress(), BRIDGE_AMOUNT);
    console.log("User approved bridge to spend tokens");

    // Lock tokens
    const lockTx = await sourceBridge.connect(user).lockTokens(
        mockTokenAddress,
        BRIDGE_AMOUNT,
        user.address, // recipient on destination chain
        DEST_CHAIN_ID
    );
    const lockReceipt = await lockTx.wait();

    // Get the nonce from the event
    const lockEvent = lockReceipt.logs.find(
        log => log.fragment && log.fragment.name === "TokensLocked"
    );
    const lockNonce = lockEvent.args.nonce;
    const lockedAmount = lockEvent.args.amount;

    console.log(`Tokens locked!`);
    console.log(`  Nonce: ${lockNonce}`);
    console.log(`  Amount (after fee): ${ethers.formatEther(lockedAmount)} MTK`);

    // Check balances
    const userBalanceAfterLock = await mockToken.balanceOf(user.address);
    const bridgeBalance = await sourceBridge.getLockedAmount(mockTokenAddress);
    console.log(`  User MTK balance: ${ethers.formatEther(userBalanceAfterLock)}`);
    console.log(`  Bridge locked amount: ${ethers.formatEther(bridgeBalance)}`);

    // ============ STEP 2: Validators Sign the Lock Event ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: Validators Signing Lock Event");
    console.log("=".repeat(60));

    // Create signatures for minting
    const sig1 = await createSignature(
        validator1,
        mockTokenAddress,
        lockedAmount,
        user.address,
        lockNonce,
        SOURCE_CHAIN_ID,
        Number(chainId)
    );
    const sig2 = await createSignature(
        validator2,
        mockTokenAddress,
        lockedAmount,
        user.address,
        lockNonce,
        SOURCE_CHAIN_ID,
        Number(chainId)
    );
    console.log("Validator 1 signed");
    console.log("Validator 2 signed");

    // ============ STEP 3: Mint Wrapped Tokens on Destination Chain ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Minting Wrapped Tokens on Destination Chain");
    console.log("=".repeat(60));

    const mintTx = await destBridge.mintWrappedTokens(
        mockTokenAddress,
        lockedAmount,
        user.address,
        lockNonce,
        SOURCE_CHAIN_ID,
        [sig1, sig2]
    );
    await mintTx.wait();

    const userWrappedBalance = await wrappedToken.balanceOf(user.address);
    console.log(`Wrapped tokens minted!`);
    console.log(`  User wMTK balance: ${ethers.formatEther(userWrappedBalance)}`);

    // ============ STEP 4: Burn Wrapped Tokens ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: Burning Wrapped Tokens");
    console.log("=".repeat(60));

    // Approve bridge to burn tokens
    await wrappedToken.connect(user).approve(await destBridge.getAddress(), userWrappedBalance);

    const burnTx = await destBridge.connect(user).burnWrappedTokens(
        wrappedTokenAddress,
        userWrappedBalance,
        user.address,
        SOURCE_CHAIN_ID
    );
    const burnReceipt = await burnTx.wait();

    const burnEvent = burnReceipt.logs.find(
        log => log.fragment && log.fragment.name === "TokensBurned"
    );
    const burnNonce = burnEvent.args.nonce;
    const burnedAmount = burnEvent.args.amount;

    console.log(`Wrapped tokens burned!`);
    console.log(`  Nonce: ${burnNonce}`);
    console.log(`  Amount: ${ethers.formatEther(burnedAmount)}`);

    // ============ STEP 5: Validators Sign the Burn Event ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 5: Validators Signing Burn Event");
    console.log("=".repeat(60));

    // Create signatures for unlocking
    const unlockSig1 = await createSignature(
        validator1,
        mockTokenAddress,
        burnedAmount,
        user.address,
        burnNonce,
        DEST_CHAIN_ID,
        Number(chainId)
    );
    const unlockSig2 = await createSignature(
        validator2,
        mockTokenAddress,
        burnedAmount,
        user.address,
        burnNonce,
        DEST_CHAIN_ID,
        Number(chainId)
    );
    console.log("Validator 1 signed");
    console.log("Validator 2 signed");

    // ============ STEP 6: Unlock Tokens on Source Chain ============
    console.log("\n" + "=".repeat(60));
    console.log("STEP 6: Unlocking Tokens on Source Chain");
    console.log("=".repeat(60));

    const unlockTx = await sourceBridge.unlockTokens(
        mockTokenAddress,
        burnedAmount,
        user.address,
        burnNonce,
        DEST_CHAIN_ID,
        [unlockSig1, unlockSig2]
    );
    await unlockTx.wait();

    const finalUserBalance = await mockToken.balanceOf(user.address);
    const finalBridgeBalance = await sourceBridge.getLockedAmount(mockTokenAddress);

    console.log(`Tokens unlocked!`);
    console.log(`  User MTK balance: ${ethers.formatEther(finalUserBalance)}`);
    console.log(`  Bridge locked amount: ${ethers.formatEther(finalBridgeBalance)}`);

    // ============ Summary ============
    console.log("\n" + "=".repeat(60));
    console.log("BRIDGE OPERATION SUMMARY");
    console.log("=".repeat(60));

    const feeCollectorBalance = await mockToken.balanceOf(feeCollector.address);
    const totalFees = BRIDGE_AMOUNT - finalUserBalance;

    console.log(`
Initial amount:           ${ethers.formatEther(BRIDGE_AMOUNT)} MTK
Final user balance:       ${ethers.formatEther(finalUserBalance)} MTK
Total fees collected:     ${ethers.formatEther(feeCollectorBalance)} MTK (source) + destination fees in wMTK

Bridge Operations:
1. Lock: ${ethers.formatEther(BRIDGE_AMOUNT)} MTK -> ${ethers.formatEther(lockedAmount)} MTK (after fee)
2. Mint: ${ethers.formatEther(userWrappedBalance)} wMTK received (after fee)
3. Burn: ${ethers.formatEther(burnedAmount)} MTK worth of wMTK
4. Unlock: ${ethers.formatEther(burnedAmount)} MTK received

Note: Fees are collected at both lock (source) and mint (destination) stages.
    `);

    console.log("\nBridge tokens demo completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
