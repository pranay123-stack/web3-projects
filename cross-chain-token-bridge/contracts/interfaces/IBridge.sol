// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridge
 * @author Cross-Chain Token Bridge Team
 * @notice Interface for cross-chain bridge contracts
 * @dev Defines the standard interface for both source and destination bridge contracts
 */
interface IBridge {
    // ============ Structs ============

    /**
     * @notice Structure representing a bridge transfer request
     * @param sender The address initiating the transfer on the source chain
     * @param recipient The address receiving tokens on the destination chain
     * @param token The token address being bridged
     * @param amount The amount of tokens being transferred
     * @param nonce Unique identifier to prevent replay attacks
     * @param sourceChainId The chain ID of the source network
     * @param destinationChainId The chain ID of the destination network
     * @param timestamp The block timestamp when the transfer was initiated
     */
    struct BridgeTransfer {
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 nonce;
        uint256 sourceChainId;
        uint256 destinationChainId;
        uint256 timestamp;
    }

    // ============ Events ============

    /**
     * @notice Emitted when tokens are locked on the source chain
     * @param sender The address that locked the tokens
     * @param recipient The intended recipient on the destination chain
     * @param token The token address that was locked
     * @param amount The amount of tokens locked
     * @param nonce The unique nonce for this transfer
     * @param destinationChainId The target chain ID
     * @param timestamp The block timestamp
     */
    event TokensLocked(
        address indexed sender,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 nonce,
        uint256 destinationChainId,
        uint256 timestamp
    );

    /**
     * @notice Emitted when tokens are unlocked on the source chain
     * @param recipient The address receiving the unlocked tokens
     * @param token The token address being unlocked
     * @param amount The amount of tokens unlocked
     * @param nonce The nonce of the original transfer
     * @param sourceChainId The chain ID where burn occurred
     */
    event TokensUnlocked(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    /**
     * @notice Emitted when wrapped tokens are minted on the destination chain
     * @param recipient The address receiving the minted tokens
     * @param token The wrapped token address
     * @param amount The amount of tokens minted
     * @param nonce The nonce from the source chain lock event
     * @param sourceChainId The source chain ID
     */
    event TokensMinted(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    /**
     * @notice Emitted when wrapped tokens are burned on the destination chain
     * @param sender The address burning the tokens
     * @param recipient The intended recipient on the source chain
     * @param token The wrapped token address
     * @param amount The amount of tokens burned
     * @param nonce The unique nonce for this transfer
     * @param sourceChainId The target chain ID for unlocking
     */
    event TokensBurned(
        address indexed sender,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    /**
     * @notice Emitted when a validator is added or removed
     * @param validator The validator address
     * @param isActive Whether the validator is now active
     */
    event ValidatorUpdated(address indexed validator, bool isActive);

    /**
     * @notice Emitted when the bridge fee is updated
     * @param oldFee The previous fee (basis points)
     * @param newFee The new fee (basis points)
     */
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @notice Emitted when the signature threshold is updated
     * @param oldThreshold The previous threshold
     * @param newThreshold The new threshold
     */
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ============ Errors ============

    /// @notice Thrown when an invalid amount (zero) is provided
    error InvalidAmount();

    /// @notice Thrown when an invalid address (zero address) is provided
    error InvalidAddress();

    /// @notice Thrown when a nonce has already been used
    error NonceAlreadyUsed();

    /// @notice Thrown when the signature verification fails
    error InvalidSignature();

    /// @notice Thrown when insufficient signatures are provided
    error InsufficientSignatures();

    /// @notice Thrown when the caller is not authorized
    error Unauthorized();

    /// @notice Thrown when the token is not supported
    error TokenNotSupported();

    /// @notice Thrown when the chain ID is invalid
    error InvalidChainId();

    /// @notice Thrown when the fee exceeds the maximum allowed
    error FeeTooHigh();

    /// @notice Thrown when the threshold is invalid
    error InvalidThreshold();

    // ============ Functions ============

    /**
     * @notice Get the current nonce for a user
     * @param user The user address
     * @return The current nonce
     */
    function getUserNonce(address user) external view returns (uint256);

    /**
     * @notice Check if a nonce has been used
     * @param nonce The nonce to check
     * @return True if the nonce has been used
     */
    function isNonceUsed(uint256 nonce) external view returns (bool);

    /**
     * @notice Get the current bridge fee in basis points
     * @return The fee in basis points (1 = 0.01%)
     */
    function getBridgeFee() external view returns (uint256);

    /**
     * @notice Check if a token is supported by the bridge
     * @param token The token address to check
     * @return True if the token is supported
     */
    function isTokenSupported(address token) external view returns (bool);
}
