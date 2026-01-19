// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IIdentityRegistry.sol";
import "./interfaces/IComplianceModule.sol";

/**
 * @title RealEstateToken
 * @dev ERC-3643 inspired security token for fractional real estate ownership
 * @notice Represents fractional ownership of a real estate property with dividend distribution
 */
contract RealEstateToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {

    // ============ Roles ============
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ============ State Variables ============

    // Compliance components
    IIdentityRegistry public identityRegistry;
    IComplianceModule public complianceModule;

    // Property details
    struct PropertyInfo {
        string propertyId;
        string propertyAddress;
        string propertyType;
        uint256 totalValue;          // Total property value in USD (scaled by 1e18)
        uint256 tokenizedPercentage; // Percentage tokenized (scaled by 1e4, e.g., 10000 = 100%)
        string legalDocumentURI;     // IPFS URI of legal documents
        uint256 createdAt;
    }

    PropertyInfo public property;

    // Dividend distribution
    uint256 public totalDividendsDistributed;
    uint256 public dividendsPerToken;
    uint256 private constant DIVIDEND_PRECISION = 1e18;

    mapping(address => uint256) public withdrawnDividends;
    mapping(address => uint256) public creditedDividends;

    // Token recovery (for lost wallets - requires governance)
    mapping(address => bool) public frozenAccounts;

    // ============ Events ============

    event PropertyInfoUpdated(string propertyId, uint256 totalValue);
    event DividendsDeposited(uint256 amount, uint256 newDividendsPerToken);
    event DividendsClaimed(address indexed investor, uint256 amount);
    event AccountFrozen(address indexed account, bool frozen);
    event TokensRecovered(address indexed from, address indexed to, uint256 amount);
    event ComplianceModuleUpdated(address indexed oldModule, address indexed newModule);
    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // ============ Errors ============

    error TransferNotCompliant();
    error AccountFrozenError();
    error NoDividendsToClaim();
    error InvalidRecovery();
    error ZeroAddress();
    error InvalidAmount();

    // ============ Constructor ============

    constructor(
        string memory name_,
        string memory symbol_,
        address _identityRegistry,
        address _complianceModule,
        string memory _propertyId,
        string memory _propertyAddress,
        string memory _propertyType,
        uint256 _totalValue,
        uint256 _tokenizedPercentage,
        string memory _legalDocumentURI
    ) ERC20(name_, symbol_) {
        if (_identityRegistry == address(0)) revert ZeroAddress();
        if (_complianceModule == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        identityRegistry = IIdentityRegistry(_identityRegistry);
        complianceModule = IComplianceModule(_complianceModule);

        property = PropertyInfo({
            propertyId: _propertyId,
            propertyAddress: _propertyAddress,
            propertyType: _propertyType,
            totalValue: _totalValue,
            tokenizedPercentage: _tokenizedPercentage,
            legalDocumentURI: _legalDocumentURI,
            createdAt: block.timestamp
        });
    }

    // ============ Token Functions ============

    /**
     * @dev Mint new tokens to a verified investor
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        // Check compliance
        if (!complianceModule.canTransfer(address(0), to, amount)) {
            revert TransferNotCompliant();
        }

        // Credit pending dividends before minting
        _creditDividends(to);

        _mint(to, amount);

        // Update compliance module
        complianceModule.created(to, amount);
    }

    /**
     * @dev Burn tokens (for redemption)
     */
    function burn(uint256 amount) public override {
        if (frozenAccounts[msg.sender]) revert AccountFrozenError();

        // Credit pending dividends before burning
        _creditDividends(msg.sender);

        super.burn(amount);

        // Update compliance module
        complianceModule.destroyed(msg.sender, amount);
    }

    /**
     * @dev Force transfer for recovery (requires AGENT_ROLE)
     * @param from Original holder (lost wallet)
     * @param to New verified address
     * @param amount Amount to recover
     */
    function recoveryTransfer(
        address from,
        address to,
        uint256 amount
    ) external onlyRole(AGENT_ROLE) {
        if (!frozenAccounts[from]) revert InvalidRecovery();
        if (!identityRegistry.isVerified(to)) revert TransferNotCompliant();

        _creditDividends(from);
        _creditDividends(to);

        _transfer(from, to, amount);
        complianceModule.transferred(from, to, amount);

        emit TokensRecovered(from, to, amount);
    }

    // ============ Dividend Functions ============

    /**
     * @dev Deposit dividends (rent income) for distribution
     */
    function depositDividends() external payable onlyRole(AGENT_ROLE) nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        if (totalSupply() == 0) revert InvalidAmount();

        uint256 newDividendsPerToken = (msg.value * DIVIDEND_PRECISION) / totalSupply();
        dividendsPerToken += newDividendsPerToken;
        totalDividendsDistributed += msg.value;

        emit DividendsDeposited(msg.value, dividendsPerToken);
    }

    /**
     * @dev Claim accumulated dividends
     */
    function claimDividends() external nonReentrant {
        if (frozenAccounts[msg.sender]) revert AccountFrozenError();

        uint256 owed = _pendingDividends(msg.sender);
        if (owed == 0) revert NoDividendsToClaim();

        withdrawnDividends[msg.sender] += owed;
        creditedDividends[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: owed}("");
        require(success, "Transfer failed");

        emit DividendsClaimed(msg.sender, owed);
    }

    /**
     * @dev View pending dividends for an investor
     */
    function pendingDividends(address investor) external view returns (uint256) {
        return _pendingDividends(investor);
    }

    /**
     * @dev Internal function to calculate pending dividends
     */
    function _pendingDividends(address investor) internal view returns (uint256) {
        uint256 totalOwed = (balanceOf(investor) * dividendsPerToken) / DIVIDEND_PRECISION;
        uint256 alreadyWithdrawn = withdrawnDividends[investor];
        uint256 credited = creditedDividends[investor];

        if (totalOwed + credited > alreadyWithdrawn) {
            return totalOwed + credited - alreadyWithdrawn;
        }
        return 0;
    }

    /**
     * @dev Credit dividends before balance changes
     */
    function _creditDividends(address account) internal {
        uint256 pending = _pendingDividends(account);
        if (pending > 0) {
            creditedDividends[account] += pending;
            withdrawnDividends[account] = (balanceOf(account) * dividendsPerToken) / DIVIDEND_PRECISION;
        }
    }

    // ============ Admin Functions ============

    /**
     * @dev Update property information
     */
    function updatePropertyInfo(
        uint256 _totalValue,
        string calldata _legalDocumentURI
    ) external onlyRole(AGENT_ROLE) {
        property.totalValue = _totalValue;
        property.legalDocumentURI = _legalDocumentURI;
        emit PropertyInfoUpdated(property.propertyId, _totalValue);
    }

    /**
     * @dev Freeze/unfreeze an account
     */
    function setAccountFrozen(address account, bool frozen) external onlyRole(AGENT_ROLE) {
        frozenAccounts[account] = frozen;
        emit AccountFrozen(account, frozen);
    }

    /**
     * @dev Update compliance module
     */
    function setComplianceModule(address _complianceModule) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_complianceModule == address(0)) revert ZeroAddress();
        address oldModule = address(complianceModule);
        complianceModule = IComplianceModule(_complianceModule);
        emit ComplianceModuleUpdated(oldModule, _complianceModule);
    }

    /**
     * @dev Update identity registry
     */
    function setIdentityRegistry(address _identityRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_identityRegistry == address(0)) revert ZeroAddress();
        address oldRegistry = address(identityRegistry);
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryUpdated(oldRegistry, _identityRegistry);
    }

    /**
     * @dev Pause token transfers
     */
    function pause() external onlyRole(AGENT_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(AGENT_ROLE) {
        _unpause();
    }

    // ============ Override Functions ============

    /**
     * @dev Override transfer to include compliance checks
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        // Skip compliance for minting/burning (handled separately)
        if (from != address(0) && to != address(0)) {
            if (frozenAccounts[from]) revert AccountFrozenError();
            if (frozenAccounts[to]) revert AccountFrozenError();

            if (!complianceModule.canTransfer(from, to, amount)) {
                revert TransferNotCompliant();
            }

            // Credit dividends before transfer
            _creditDividends(from);
            _creditDividends(to);
        }

        super._update(from, to, amount);

        // Update compliance module for transfers
        if (from != address(0) && to != address(0)) {
            complianceModule.transferred(from, to, amount);
        }
    }

    // ============ View Functions ============

    /**
     * @dev Get property details
     */
    function getPropertyInfo() external view returns (PropertyInfo memory) {
        return property;
    }

    /**
     * @dev Get token value per share (based on property value)
     */
    function tokenValueUSD() external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (property.totalValue * property.tokenizedPercentage) / (totalSupply() * 10000);
    }

    /**
     * @dev Check if transfer would be compliant
     */
    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        if (frozenAccounts[from] || frozenAccounts[to]) return false;
        return complianceModule.canTransfer(from, to, amount);
    }

    // ============ Receive Function ============

    receive() external payable {
        // Accept ETH for dividends
    }
}
