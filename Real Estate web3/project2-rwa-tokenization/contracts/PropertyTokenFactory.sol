// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RealEstateToken.sol";
import "./IdentityRegistry.sol";
import "./ComplianceModule.sol";

/**
 * @title PropertyTokenFactory
 * @dev Factory contract for deploying new tokenized real estate properties
 * @notice Creates RealEstateToken contracts with associated compliance infrastructure
 */
contract PropertyTokenFactory is Ownable, ReentrancyGuard {

    // ============ State Variables ============

    // Global identity registry (shared across all properties)
    IdentityRegistry public identityRegistry;

    // Default compliance parameters
    uint256 public defaultMaxInvestors = 500;
    uint256 public defaultMinHolding = 1e18; // 1 token minimum
    uint256 public defaultMaxHolding = 0;    // No maximum by default
    uint256 public defaultHoldingPeriod = 0; // No holding period by default

    // Property tokens created
    address[] public propertyTokens;
    mapping(address => bool) public isPropertyToken;
    mapping(string => address) public propertyIdToToken;

    // Deployment fee
    uint256 public deploymentFee;

    // ============ Structs ============

    struct PropertyParams {
        string name;
        string symbol;
        string propertyId;
        string propertyAddress;
        string propertyType;
        uint256 totalValue;
        uint256 tokenizedPercentage;
        string legalDocumentURI;
        uint256 totalSupply;
    }

    struct ComplianceParams {
        uint256 maxInvestors;
        uint256 minHoldingAmount;
        uint256 maxHoldingAmount;
        uint256 holdingPeriod;
        uint16[] restrictedCountries;
    }

    // ============ Events ============

    event PropertyTokenCreated(
        address indexed tokenAddress,
        address indexed complianceModule,
        string propertyId,
        string name,
        uint256 totalSupply
    );

    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event DefaultComplianceUpdated(uint256 maxInvestors, uint256 minHolding, uint256 maxHolding, uint256 holdingPeriod);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Errors ============

    error PropertyIdAlreadyExists();
    error InsufficientDeploymentFee();
    error InvalidParameters();

    // ============ Constructor ============

    constructor(uint256 _deploymentFee) Ownable(msg.sender) {
        deploymentFee = _deploymentFee;

        // Deploy global identity registry
        identityRegistry = new IdentityRegistry();
    }

    // ============ Factory Functions ============

    /**
     * @dev Create a new tokenized property
     * @param propertyParams Property configuration
     * @param complianceParams Compliance configuration
     */
    function createPropertyToken(
        PropertyParams calldata propertyParams,
        ComplianceParams calldata complianceParams
    ) external payable nonReentrant returns (address tokenAddress, address complianceAddress) {
        if (msg.value < deploymentFee) revert InsufficientDeploymentFee();
        if (bytes(propertyParams.propertyId).length == 0) revert InvalidParameters();
        if (propertyIdToToken[propertyParams.propertyId] != address(0)) {
            revert PropertyIdAlreadyExists();
        }

        // Use provided compliance params or defaults
        uint256 maxInvestors = complianceParams.maxInvestors > 0
            ? complianceParams.maxInvestors
            : defaultMaxInvestors;
        uint256 minHolding = complianceParams.minHoldingAmount > 0
            ? complianceParams.minHoldingAmount
            : defaultMinHolding;
        uint256 maxHolding = complianceParams.maxHoldingAmount;
        uint256 holdingPeriod = complianceParams.holdingPeriod;

        // Deploy compliance module
        ComplianceModule compliance = new ComplianceModule(
            address(identityRegistry),
            maxInvestors,
            minHolding,
            maxHolding,
            holdingPeriod
        );

        // Set country restrictions
        if (complianceParams.restrictedCountries.length > 0) {
            bool[] memory restricted = new bool[](complianceParams.restrictedCountries.length);
            for (uint256 i = 0; i < restricted.length; i++) {
                restricted[i] = true;
            }
            compliance.batchSetCountryRestrictions(complianceParams.restrictedCountries, restricted);
        }

        // Deploy token
        RealEstateToken token = new RealEstateToken(
            propertyParams.name,
            propertyParams.symbol,
            address(identityRegistry),
            address(compliance),
            propertyParams.propertyId,
            propertyParams.propertyAddress,
            propertyParams.propertyType,
            propertyParams.totalValue,
            propertyParams.tokenizedPercentage,
            propertyParams.legalDocumentURI
        );

        // Transfer ownership
        compliance.transferOwnership(msg.sender);
        token.grantRole(token.DEFAULT_ADMIN_ROLE(), msg.sender);
        token.grantRole(token.AGENT_ROLE(), msg.sender);
        token.grantRole(token.MINTER_ROLE(), msg.sender);

        // Register in factory
        tokenAddress = address(token);
        complianceAddress = address(compliance);

        propertyTokens.push(tokenAddress);
        isPropertyToken[tokenAddress] = true;
        propertyIdToToken[propertyParams.propertyId] = tokenAddress;

        emit PropertyTokenCreated(
            tokenAddress,
            complianceAddress,
            propertyParams.propertyId,
            propertyParams.name,
            propertyParams.totalSupply
        );

        // Refund excess payment
        if (msg.value > deploymentFee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - deploymentFee}("");
            require(success, "Refund failed");
        }

        return (tokenAddress, complianceAddress);
    }

    /**
     * @dev Create property token with default compliance
     */
    function createPropertyTokenSimple(
        string calldata name,
        string calldata symbol,
        string calldata propertyId,
        string calldata propertyAddress,
        string calldata propertyType,
        uint256 totalValue,
        uint256 tokenizedPercentage,
        string calldata legalDocumentURI
    ) external payable returns (address tokenAddress, address complianceAddress) {
        PropertyParams memory propertyParams = PropertyParams({
            name: name,
            symbol: symbol,
            propertyId: propertyId,
            propertyAddress: propertyAddress,
            propertyType: propertyType,
            totalValue: totalValue,
            tokenizedPercentage: tokenizedPercentage,
            legalDocumentURI: legalDocumentURI,
            totalSupply: 0
        });

        ComplianceParams memory complianceParams = ComplianceParams({
            maxInvestors: defaultMaxInvestors,
            minHoldingAmount: defaultMinHolding,
            maxHoldingAmount: defaultMaxHolding,
            holdingPeriod: defaultHoldingPeriod,
            restrictedCountries: new uint16[](0)
        });

        return this.createPropertyToken{value: msg.value}(propertyParams, complianceParams);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update default compliance parameters
     */
    function setDefaultCompliance(
        uint256 _maxInvestors,
        uint256 _minHolding,
        uint256 _maxHolding,
        uint256 _holdingPeriod
    ) external onlyOwner {
        defaultMaxInvestors = _maxInvestors;
        defaultMinHolding = _minHolding;
        defaultMaxHolding = _maxHolding;
        defaultHoldingPeriod = _holdingPeriod;

        emit DefaultComplianceUpdated(_maxInvestors, _minHolding, _maxHolding, _holdingPeriod);
    }

    /**
     * @dev Update deployment fee
     */
    function setDeploymentFee(uint256 _fee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = _fee;
        emit DeploymentFeeUpdated(oldFee, _fee);
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Register investor in global identity registry
     */
    function registerInvestor(
        address investor,
        bytes32 identityHash,
        uint16 country
    ) external onlyOwner {
        identityRegistry.registerIdentity(investor, identityHash, country);
    }

    /**
     * @dev Batch register investors
     */
    function batchRegisterInvestors(
        address[] calldata investors,
        bytes32[] calldata identityHashes,
        uint16[] calldata countries
    ) external onlyOwner {
        identityRegistry.batchRegisterIdentity(investors, identityHashes, countries);
    }

    // ============ View Functions ============

    /**
     * @dev Get all property tokens
     */
    function getAllPropertyTokens() external view returns (address[] memory) {
        return propertyTokens;
    }

    /**
     * @dev Get total number of properties
     */
    function totalProperties() external view returns (uint256) {
        return propertyTokens.length;
    }

    /**
     * @dev Get property token by index
     */
    function getPropertyToken(uint256 index) external view returns (address) {
        return propertyTokens[index];
    }

    /**
     * @dev Check if address is registered property token
     */
    function isValidPropertyToken(address token) external view returns (bool) {
        return isPropertyToken[token];
    }

    // ============ Receive Function ============

    receive() external payable {}
}
