// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./WrappedToken.sol";
import "./interfaces/IBridge.sol";

/**
 * @title DestinationChainBridge
 * @author Cross-Chain Token Bridge Team
 * @notice Bridge contract deployed on the destination chain for minting and burning wrapped tokens
 * @dev This contract handles:
 *      - Minting wrapped tokens when tokens are locked on the source chain
 *      - Burning wrapped tokens when users want to bridge back
 *      - Multi-signature validation for minting operations
 *      - Wrapped token deployment and management
 *
 * Security Features:
 * - ReentrancyGuard to prevent reentrancy attacks
 * - Pausable for emergency situations
 * - Role-based access control
 * - Nonce tracking to prevent replay attacks
 * - Multi-signature threshold for mint operations
 */
contract DestinationChainBridge is IBridge, AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============

    /// @notice Role for managing validators
    bytes32 public constant VALIDATOR_ADMIN_ROLE = keccak256("VALIDATOR_ADMIN_ROLE");

    /// @notice Role for updating bridge parameters
    bytes32 public constant BRIDGE_ADMIN_ROLE = keccak256("BRIDGE_ADMIN_ROLE");

    /// @notice Role for deploying wrapped tokens
    bytes32 public constant TOKEN_DEPLOYER_ROLE = keccak256("TOKEN_DEPLOYER_ROLE");

    /// @notice Maximum fee in basis points (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice Current bridge fee in basis points
    uint256 public bridgeFee;

    /// @notice Minimum number of validator signatures required
    uint256 public signatureThreshold;

    /// @notice Global nonce counter for burn operations
    uint256 public globalNonce;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Mapping from original token address to wrapped token address
    mapping(address => address) public originalToWrapped;

    /// @notice Mapping from wrapped token address to original token address
    mapping(address => address) public wrappedToOriginal;

    /// @notice Mapping of user address to their nonce
    mapping(address => uint256) public userNonces;

    /// @notice Mapping of used nonces (for mint operations from source chain)
    mapping(uint256 => bool) public usedNonces;

    /// @notice Mapping of validator addresses to their status
    mapping(address => bool) public validators;

    /// @notice Array of validator addresses for iteration
    address[] public validatorList;

    /// @notice Supported source chain IDs
    mapping(uint256 => bool) public supportedSourceChains;

    /// @notice Total minted amount per wrapped token
    mapping(address => uint256) public totalMinted;

    // ============ Constructor ============

    /**
     * @notice Deploys the DestinationChainBridge contract
     * @param admin The admin address that will have all roles initially
     * @param feeCollector_ The address that collects bridge fees
     * @param initialFee The initial bridge fee in basis points
     * @param initialThreshold The initial signature threshold
     */
    constructor(
        address admin,
        address feeCollector_,
        uint256 initialFee,
        uint256 initialThreshold
    ) {
        if (admin == address(0)) revert InvalidAddress();
        if (feeCollector_ == address(0)) revert InvalidAddress();
        if (initialFee > MAX_FEE_BPS) revert FeeTooHigh();
        if (initialThreshold == 0) revert InvalidThreshold();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VALIDATOR_ADMIN_ROLE, admin);
        _grantRole(BRIDGE_ADMIN_ROLE, admin);
        _grantRole(TOKEN_DEPLOYER_ROLE, admin);

        feeCollector = feeCollector_;
        bridgeFee = initialFee;
        signatureThreshold = initialThreshold;
    }

    // ============ External Functions ============

    /**
     * @notice Mints wrapped tokens based on a lock event from the source chain
     * @dev Requires valid signatures from validators
     * @param originalToken The original token address on the source chain
     * @param amount The amount to mint
     * @param recipient The recipient address
     * @param nonce The nonce from the lock event on source chain
     * @param sourceChainId The chain ID where the lock occurred
     * @param signatures Array of validator signatures
     */
    function mintWrappedTokens(
        address originalToken,
        uint256 amount,
        address recipient,
        uint256 nonce,
        uint256 sourceChainId,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        // Validations
        if (originalToken == address(0)) revert InvalidAddress();
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        if (!supportedSourceChains[sourceChainId]) revert InvalidChainId();
        if (signatures.length < signatureThreshold) revert InsufficientSignatures();

        address wrappedToken = originalToWrapped[originalToken];
        if (wrappedToken == address(0)) revert TokenNotSupported();

        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                originalToken,
                amount,
                recipient,
                nonce,
                sourceChainId,
                block.chainid
            )
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        _verifySignatures(ethSignedHash, signatures);

        // Mark nonce as used
        usedNonces[nonce] = true;

        // Calculate fee (fee taken from minted amount)
        uint256 fee = (amount * bridgeFee) / BPS_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;

        // Mint wrapped tokens
        WrappedToken(wrappedToken).mint(recipient, amountAfterFee);

        // Mint fee to collector
        if (fee > 0) {
            WrappedToken(wrappedToken).mint(feeCollector, fee);
        }

        // Update totals
        totalMinted[wrappedToken] += amount;

        emit TokensMinted(recipient, wrappedToken, amountAfterFee, nonce, sourceChainId);
    }

    /**
     * @notice Burns wrapped tokens to initiate unlock on the source chain
     * @dev Emits a TokensBurned event that relayers will pick up
     * @param wrappedToken The wrapped token address to burn
     * @param amount The amount to burn
     * @param recipient The recipient address on the source chain
     * @param sourceChainId The target chain ID for unlocking
     * @return nonce The unique nonce for this transfer
     */
    function burnWrappedTokens(
        address wrappedToken,
        uint256 amount,
        address recipient,
        uint256 sourceChainId
    ) external nonReentrant whenNotPaused returns (uint256 nonce) {
        // Validations
        if (wrappedToken == address(0)) revert InvalidAddress();
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        address originalToken = wrappedToOriginal[wrappedToken];
        if (originalToken == address(0)) revert TokenNotSupported();
        if (!supportedSourceChains[sourceChainId]) revert InvalidChainId();

        // Burn tokens from user
        WrappedToken(wrappedToken).bridgeBurn(msg.sender, amount);

        // Update state
        totalMinted[wrappedToken] -= amount;
        nonce = ++globalNonce;
        userNonces[msg.sender] = nonce;

        emit TokensBurned(
            msg.sender,
            recipient,
            originalToken,
            amount,
            nonce,
            sourceChainId
        );

        return nonce;
    }

    // ============ Admin Functions ============

    /**
     * @notice Deploys a new wrapped token for a source chain token
     * @dev Only callable by TOKEN_DEPLOYER_ROLE
     * @param originalToken The original token address on the source chain
     * @param sourceChainId The source chain ID
     * @param name The name for the wrapped token
     * @param symbol The symbol for the wrapped token
     * @param decimals The decimals for the wrapped token
     * @return wrappedToken The address of the deployed wrapped token
     */
    function deployWrappedToken(
        address originalToken,
        uint256 sourceChainId,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external onlyRole(TOKEN_DEPLOYER_ROLE) returns (address wrappedToken) {
        if (originalToken == address(0)) revert InvalidAddress();
        if (originalToWrapped[originalToken] != address(0)) revert TokenNotSupported();
        if (!supportedSourceChains[sourceChainId]) revert InvalidChainId();

        // Deploy new wrapped token
        WrappedToken newToken = new WrappedToken(
            name,
            symbol,
            decimals,
            originalToken,
            sourceChainId,
            msg.sender, // Admin
            address(this) // Bridge as minter/burner
        );

        wrappedToken = address(newToken);
        originalToWrapped[originalToken] = wrappedToken;
        wrappedToOriginal[wrappedToken] = originalToken;

        return wrappedToken;
    }

    /**
     * @notice Registers an existing wrapped token
     * @dev Only callable by TOKEN_DEPLOYER_ROLE
     * @param originalToken The original token address on the source chain
     * @param wrappedToken The wrapped token address
     */
    function registerWrappedToken(
        address originalToken,
        address wrappedToken
    ) external onlyRole(TOKEN_DEPLOYER_ROLE) {
        if (originalToken == address(0)) revert InvalidAddress();
        if (wrappedToken == address(0)) revert InvalidAddress();
        if (originalToWrapped[originalToken] != address(0)) revert TokenNotSupported();

        originalToWrapped[originalToken] = wrappedToken;
        wrappedToOriginal[wrappedToken] = originalToken;
    }

    /**
     * @notice Adds a supported source chain
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param chainId The chain ID to add
     */
    function addSupportedSourceChain(uint256 chainId) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (chainId == 0) revert InvalidChainId();
        supportedSourceChains[chainId] = true;
    }

    /**
     * @notice Removes a supported source chain
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param chainId The chain ID to remove
     */
    function removeSupportedSourceChain(uint256 chainId) external onlyRole(BRIDGE_ADMIN_ROLE) {
        supportedSourceChains[chainId] = false;
    }

    /**
     * @notice Adds a new validator
     * @dev Only callable by VALIDATOR_ADMIN_ROLE
     * @param validator The validator address to add
     */
    function addValidator(address validator) external onlyRole(VALIDATOR_ADMIN_ROLE) {
        if (validator == address(0)) revert InvalidAddress();
        if (!validators[validator]) {
            validators[validator] = true;
            validatorList.push(validator);
            emit ValidatorUpdated(validator, true);
        }
    }

    /**
     * @notice Removes a validator
     * @dev Only callable by VALIDATOR_ADMIN_ROLE
     * @param validator The validator address to remove
     */
    function removeValidator(address validator) external onlyRole(VALIDATOR_ADMIN_ROLE) {
        if (validators[validator]) {
            validators[validator] = false;
            // Remove from list
            for (uint256 i = 0; i < validatorList.length; i++) {
                if (validatorList[i] == validator) {
                    validatorList[i] = validatorList[validatorList.length - 1];
                    validatorList.pop();
                    break;
                }
            }
            emit ValidatorUpdated(validator, false);
        }
    }

    /**
     * @notice Updates the bridge fee
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param newFee The new fee in basis points
     */
    function updateBridgeFee(uint256 newFee) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (newFee > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 oldFee = bridgeFee;
        bridgeFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Updates the signature threshold
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param newThreshold The new threshold
     */
    function updateSignatureThreshold(uint256 newThreshold) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (newThreshold == 0) revert InvalidThreshold();
        if (newThreshold > validatorList.length) revert InvalidThreshold();
        uint256 oldThreshold = signatureThreshold;
        signatureThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @notice Updates the fee collector address
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param newCollector The new fee collector address
     */
    function updateFeeCollector(address newCollector) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }

    /**
     * @notice Pauses the bridge
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the bridge
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @inheritdoc IBridge
     */
    function getUserNonce(address user) external view override returns (uint256) {
        return userNonces[user];
    }

    /**
     * @inheritdoc IBridge
     */
    function isNonceUsed(uint256 nonce) external view override returns (bool) {
        return usedNonces[nonce];
    }

    /**
     * @inheritdoc IBridge
     */
    function getBridgeFee() external view override returns (uint256) {
        return bridgeFee;
    }

    /**
     * @inheritdoc IBridge
     */
    function isTokenSupported(address token) external view override returns (bool) {
        return originalToWrapped[token] != address(0);
    }

    /**
     * @notice Returns the number of validators
     * @return The validator count
     */
    function getValidatorCount() external view returns (uint256) {
        return validatorList.length;
    }

    /**
     * @notice Returns all validators
     * @return Array of validator addresses
     */
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    /**
     * @notice Returns the wrapped token address for an original token
     * @param originalToken The original token address
     * @return The wrapped token address
     */
    function getWrappedToken(address originalToken) external view returns (address) {
        return originalToWrapped[originalToken];
    }

    /**
     * @notice Returns the original token address for a wrapped token
     * @param wrappedToken The wrapped token address
     * @return The original token address
     */
    function getOriginalToken(address wrappedToken) external view returns (address) {
        return wrappedToOriginal[wrappedToken];
    }

    /**
     * @notice Returns the total minted amount for a wrapped token
     * @param wrappedToken The wrapped token address
     * @return The total minted amount
     */
    function getTotalMinted(address wrappedToken) external view returns (uint256) {
        return totalMinted[wrappedToken];
    }

    // ============ Internal Functions ============

    /**
     * @notice Verifies that signatures meet the threshold
     * @dev Checks for unique validators and valid signatures
     * @param messageHash The hash of the message that was signed
     * @param signatures Array of signatures to verify
     */
    function _verifySignatures(
        bytes32 messageHash,
        bytes[] calldata signatures
    ) internal view {
        address[] memory signers = new address[](signatures.length);
        uint256 validCount = 0;

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = messageHash.recover(signatures[i]);

            // Check if signer is a validator
            if (!validators[signer]) {
                continue;
            }

            // Check for duplicate signatures
            bool isDuplicate = false;
            for (uint256 j = 0; j < validCount; j++) {
                if (signers[j] == signer) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                signers[validCount] = signer;
                validCount++;
            }
        }

        if (validCount < signatureThreshold) {
            revert InsufficientSignatures();
        }
    }
}
