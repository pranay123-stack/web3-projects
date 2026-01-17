// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WrappedToken
 * @author Cross-Chain Token Bridge Team
 * @notice ERC20 token representing wrapped assets from another chain
 * @dev This contract is deployed on the destination chain to represent locked tokens
 *      from the source chain. Only the bridge contract can mint and burn tokens.
 *
 * Key Features:
 * - Role-based access control for minting and burning
 * - Pausable functionality for emergency situations
 * - ERC20Permit for gasless approvals
 * - Tracks the original token address and chain ID
 */
contract WrappedToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    // ============ Constants ============

    /// @notice Role identifier for bridge contracts that can mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Role identifier for bridge contracts that can burn tokens
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Role identifier for pausing the contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============ State Variables ============

    /// @notice The address of the original token on the source chain
    address public immutable originalToken;

    /// @notice The chain ID of the source chain
    uint256 public immutable sourceChainId;

    /// @notice Number of decimals for the token
    uint8 private immutable _decimals;

    // ============ Events ============

    /**
     * @notice Emitted when tokens are minted by the bridge
     * @param to The recipient address
     * @param amount The amount of tokens minted
     * @param minter The address that initiated the mint
     */
    event BridgeMint(address indexed to, uint256 amount, address indexed minter);

    /**
     * @notice Emitted when tokens are burned by the bridge
     * @param from The address whose tokens were burned
     * @param amount The amount of tokens burned
     * @param burner The address that initiated the burn
     */
    event BridgeBurn(address indexed from, uint256 amount, address indexed burner);

    // ============ Errors ============

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when an invalid amount is provided
    error InvalidAmount();

    /// @notice Thrown when an invalid chain ID is provided
    error InvalidChainId();

    // ============ Constructor ============

    /**
     * @notice Deploys a new WrappedToken contract
     * @param name_ The name of the wrapped token
     * @param symbol_ The symbol of the wrapped token
     * @param decimals_ The number of decimals
     * @param originalToken_ The address of the original token on the source chain
     * @param sourceChainId_ The chain ID of the source chain
     * @param admin The address that will receive admin rights
     * @param bridge The bridge contract address that will receive minter/burner roles
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address originalToken_,
        uint256 sourceChainId_,
        address admin,
        address bridge
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (originalToken_ == address(0)) revert InvalidAddress();
        if (admin == address(0)) revert InvalidAddress();
        if (bridge == address(0)) revert InvalidAddress();
        if (sourceChainId_ == 0) revert InvalidChainId();

        originalToken = originalToken_;
        sourceChainId = sourceChainId_;
        _decimals = decimals_;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, bridge);
        _grantRole(BURNER_ROLE, bridge);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ============ External Functions ============

    /**
     * @notice Mints wrapped tokens to a recipient
     * @dev Only callable by addresses with the MINTER_ROLE
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _mint(to, amount);
        emit BridgeMint(to, amount, msg.sender);
    }

    /**
     * @notice Burns wrapped tokens from an address (bridge-initiated)
     * @dev Only callable by addresses with the BURNER_ROLE
     *      This is separate from the ERC20Burnable burn function
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function bridgeBurn(address from, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        _burn(from, amount);
        emit BridgeBurn(from, amount, msg.sender);
    }

    /**
     * @notice Pauses all token transfers and minting/burning
     * @dev Only callable by addresses with the PAUSER_ROLE
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Only callable by addresses with the PAUSER_ROLE
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Returns the number of decimals used by the token
     * @return The number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Returns information about the original token
     * @return token The original token address
     * @return chainId The source chain ID
     */
    function getOriginalTokenInfo() external view returns (address token, uint256 chainId) {
        return (originalToken, sourceChainId);
    }

    // ============ Internal Functions ============

    /**
     * @notice Hook that is called before any token transfer
     * @dev Adds pausable functionality to transfers
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param amount The amount of tokens transferred
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._update(from, to, amount);
    }
}
