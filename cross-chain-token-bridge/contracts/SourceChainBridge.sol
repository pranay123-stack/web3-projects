// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IBridge.sol";

/**
 * @title SourceChainBridge
 * @author Cross-Chain Token Bridge Team
 * @notice Bridge contract deployed on the source chain for locking and unlocking tokens
 * @dev This contract handles:
 *      - Locking tokens when users want to bridge to the destination chain
 *      - Unlocking tokens when users bridge back from the destination chain
 *      - Fee collection for bridge operations
 *      - Multi-signature validation for security
 *
 * Security Features:
 * - ReentrancyGuard to prevent reentrancy attacks
 * - Pausable for emergency situations
 * - Role-based access control
 * - Nonce tracking to prevent replay attacks
 * - Multi-signature threshold for unlock operations
 */
contract SourceChainBridge is IBridge, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============

    /// @notice Role for managing validators
    bytes32 public constant VALIDATOR_ADMIN_ROLE = keccak256("VALIDATOR_ADMIN_ROLE");

    /// @notice Role for updating bridge parameters
    bytes32 public constant BRIDGE_ADMIN_ROLE = keccak256("BRIDGE_ADMIN_ROLE");

    /// @notice Maximum fee in basis points (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice Current bridge fee in basis points
    uint256 public bridgeFee;

    /// @notice Minimum number of validator signatures required
    uint256 public signatureThreshold;

    /// @notice Global nonce counter
    uint256 public globalNonce;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Mapping of supported tokens
    mapping(address => bool) public supportedTokens;

    /// @notice Mapping of token to locked amount
    mapping(address => uint256) public lockedTokens;

    /// @notice Mapping of user address to their nonce
    mapping(address => uint256) public userNonces;

    /// @notice Mapping of used nonces (for unlock operations from destination chain)
    mapping(uint256 => bool) public usedNonces;

    /// @notice Mapping of validator addresses to their status
    mapping(address => bool) public validators;

    /// @notice Array of validator addresses for iteration
    address[] public validatorList;

    /// @notice Supported destination chain IDs
    mapping(uint256 => bool) public supportedChains;

    // ============ Constructor ============

    /**
     * @notice Deploys the SourceChainBridge contract
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

        feeCollector = feeCollector_;
        bridgeFee = initialFee;
        signatureThreshold = initialThreshold;
    }

    // ============ External Functions ============

    /**
     * @notice Locks tokens to bridge them to the destination chain
     * @dev Emits a TokensLocked event that relayers will pick up
     * @param token The token address to lock
     * @param amount The amount of tokens to lock
     * @param recipient The recipient address on the destination chain
     * @param destinationChainId The target chain ID
     * @return nonce The unique nonce for this transfer
     */
    function lockTokens(
        address token,
        uint256 amount,
        address recipient,
        uint256 destinationChainId
    ) external nonReentrant whenNotPaused returns (uint256 nonce) {
        // Validations
        if (token == address(0)) revert InvalidAddress();
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (!supportedChains[destinationChainId]) revert InvalidChainId();

        // Calculate fee
        uint256 fee = (amount * bridgeFee) / BPS_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;

        // Transfer tokens from user to bridge
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Transfer fee to collector
        if (fee > 0) {
            IERC20(token).safeTransfer(feeCollector, fee);
        }

        // Update state
        lockedTokens[token] += amountAfterFee;
        nonce = ++globalNonce;
        userNonces[msg.sender] = nonce;

        emit TokensLocked(
            msg.sender,
            recipient,
            token,
            amountAfterFee,
            nonce,
            destinationChainId,
            block.timestamp
        );

        return nonce;
    }

    /**
     * @notice Unlocks tokens after burning on the destination chain
     * @dev Requires valid signatures from validators
     * @param token The token address to unlock
     * @param amount The amount to unlock
     * @param recipient The recipient address
     * @param nonce The nonce from the burn event on destination chain
     * @param sourceChainId The chain ID where the burn occurred
     * @param signatures Array of validator signatures
     */
    function unlockTokens(
        address token,
        uint256 amount,
        address recipient,
        uint256 nonce,
        uint256 sourceChainId,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        // Validations
        if (token == address(0)) revert InvalidAddress();
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (signatures.length < signatureThreshold) revert InsufficientSignatures();

        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                token,
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

        // Update locked amount
        lockedTokens[token] -= amount;

        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, amount);

        emit TokensUnlocked(recipient, token, amount, nonce, sourceChainId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Adds a new supported token
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param token The token address to add
     */
    function addSupportedToken(address token) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (token == address(0)) revert InvalidAddress();
        supportedTokens[token] = true;
    }

    /**
     * @notice Removes a supported token
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param token The token address to remove
     */
    function removeSupportedToken(address token) external onlyRole(BRIDGE_ADMIN_ROLE) {
        supportedTokens[token] = false;
    }

    /**
     * @notice Adds a supported destination chain
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param chainId The chain ID to add
     */
    function addSupportedChain(uint256 chainId) external onlyRole(BRIDGE_ADMIN_ROLE) {
        if (chainId == 0) revert InvalidChainId();
        supportedChains[chainId] = true;
    }

    /**
     * @notice Removes a supported destination chain
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     * @param chainId The chain ID to remove
     */
    function removeSupportedChain(uint256 chainId) external onlyRole(BRIDGE_ADMIN_ROLE) {
        supportedChains[chainId] = false;
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

    /**
     * @notice Emergency withdrawal of stuck tokens
     * @dev Only callable by DEFAULT_ADMIN_ROLE when paused
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     * @param to The recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        if (to == address(0)) revert InvalidAddress();
        IERC20(token).safeTransfer(to, amount);
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
        return supportedTokens[token];
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
     * @notice Returns the locked amount for a token
     * @param token The token address
     * @return The locked amount
     */
    function getLockedAmount(address token) external view returns (uint256) {
        return lockedTokens[token];
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
