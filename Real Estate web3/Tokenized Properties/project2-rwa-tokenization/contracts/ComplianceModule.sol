// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IComplianceModule.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title ComplianceModule
 * @dev Handles transfer compliance checks for RWA tokens
 * @notice Implements country restrictions, investor limits, and holding periods
 */
contract ComplianceModule is IComplianceModule, Ownable {

    // ============ State Variables ============

    IIdentityRegistry public identityRegistry;

    // Maximum investors allowed
    uint256 public maxInvestors;
    uint256 public currentInvestors;

    // Minimum holding amount per investor
    uint256 public minHoldingAmount;

    // Maximum holding amount per investor (0 = no limit)
    uint256 public maxHoldingAmount;

    // Restricted countries (country code => restricted)
    mapping(uint16 => bool) public restrictedCountries;

    // Token holding per investor
    mapping(address => uint256) public investorHoldings;

    // Holding period enforcement
    mapping(address => uint256) public acquisitionTime;
    uint256 public holdingPeriod; // in seconds

    // ============ Events ============

    event MaxInvestorsUpdated(uint256 oldMax, uint256 newMax);
    event HoldingLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event CountryRestrictionUpdated(uint16 indexed country, bool restricted);
    event HoldingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event IdentityRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // ============ Errors ============

    error NotVerified();
    error CountryRestricted();
    error MaxInvestorsReached();
    error BelowMinimumHolding();
    error ExceedsMaximumHolding();
    error HoldingPeriodNotMet();
    error ZeroAddress();

    // ============ Constructor ============

    constructor(
        address _identityRegistry,
        uint256 _maxInvestors,
        uint256 _minHoldingAmount,
        uint256 _maxHoldingAmount,
        uint256 _holdingPeriod
    ) Ownable(msg.sender) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        maxInvestors = _maxInvestors;
        minHoldingAmount = _minHoldingAmount;
        maxHoldingAmount = _maxHoldingAmount;
        holdingPeriod = _holdingPeriod;
    }

    // ============ Compliance Check Functions ============

    /**
     * @dev Check if transfer is compliant
     * @param from Sender address
     * @param to Receiver address
     * @param amount Transfer amount
     */
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) external view override returns (bool) {
        // Skip checks for minting (from = address(0))
        if (from == address(0)) {
            return _canReceive(to, amount);
        }

        // Skip checks for burning (to = address(0))
        if (to == address(0)) {
            return _canSend(from, amount);
        }

        // Full transfer checks
        return _canSend(from, amount) && _canReceive(to, amount);
    }

    /**
     * @dev Internal check if address can send tokens
     */
    function _canSend(address from, uint256 amount) internal view returns (bool) {
        // Check if sender is verified
        if (!identityRegistry.isVerified(from)) {
            return false;
        }

        // Check holding period
        if (holdingPeriod > 0) {
            if (block.timestamp < acquisitionTime[from] + holdingPeriod) {
                return false;
            }
        }

        // Check remaining balance meets minimum
        uint256 remainingBalance = investorHoldings[from] - amount;
        if (remainingBalance > 0 && remainingBalance < minHoldingAmount) {
            return false;
        }

        return true;
    }

    /**
     * @dev Internal check if address can receive tokens
     */
    function _canReceive(address to, uint256 amount) internal view returns (bool) {
        // Check if receiver is verified
        if (!identityRegistry.isVerified(to)) {
            return false;
        }

        // Check country restrictions
        uint16 country = identityRegistry.getInvestorCountry(to);
        if (restrictedCountries[country]) {
            return false;
        }

        // Check max investors limit for new investors
        if (investorHoldings[to] == 0) {
            if (currentInvestors >= maxInvestors) {
                return false;
            }
        }

        // Check holding limits
        uint256 newBalance = investorHoldings[to] + amount;
        if (newBalance < minHoldingAmount) {
            return false;
        }
        if (maxHoldingAmount > 0 && newBalance > maxHoldingAmount) {
            return false;
        }

        return true;
    }

    // ============ State Update Functions ============

    /**
     * @dev Called after a successful transfer
     */
    function transferred(
        address from,
        address to,
        uint256 amount
    ) external override {
        // Update sender holdings
        if (from != address(0)) {
            investorHoldings[from] -= amount;
            if (investorHoldings[from] == 0) {
                currentInvestors--;
                delete acquisitionTime[from];
            }
        }

        // Update receiver holdings
        if (to != address(0)) {
            if (investorHoldings[to] == 0) {
                currentInvestors++;
                acquisitionTime[to] = block.timestamp;
            }
            investorHoldings[to] += amount;
        }

        emit ComplianceCheckPassed(from, to, amount);
    }

    /**
     * @dev Called after tokens are created (minted)
     */
    function created(address to, uint256 amount) external override {
        if (investorHoldings[to] == 0) {
            currentInvestors++;
            acquisitionTime[to] = block.timestamp;
        }
        investorHoldings[to] += amount;
    }

    /**
     * @dev Called after tokens are destroyed (burned)
     */
    function destroyed(address from, uint256 amount) external override {
        investorHoldings[from] -= amount;
        if (investorHoldings[from] == 0) {
            currentInvestors--;
            delete acquisitionTime[from];
        }
    }

    // ============ Admin Functions ============

    /**
     * @dev Update identity registry address
     */
    function setIdentityRegistry(address _identityRegistry) external onlyOwner {
        if (_identityRegistry == address(0)) revert ZeroAddress();
        address oldRegistry = address(identityRegistry);
        identityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryUpdated(oldRegistry, _identityRegistry);
    }

    /**
     * @dev Update maximum investors
     */
    function setMaxInvestors(uint256 _maxInvestors) external onlyOwner {
        uint256 oldMax = maxInvestors;
        maxInvestors = _maxInvestors;
        emit MaxInvestorsUpdated(oldMax, _maxInvestors);
    }

    /**
     * @dev Update holding limits
     */
    function setHoldingLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        minHoldingAmount = _minAmount;
        maxHoldingAmount = _maxAmount;
        emit HoldingLimitsUpdated(_minAmount, _maxAmount);
    }

    /**
     * @dev Add or remove country restriction
     */
    function setCountryRestriction(uint16 country, bool restricted) external onlyOwner {
        restrictedCountries[country] = restricted;
        emit CountryRestrictionUpdated(country, restricted);
    }

    /**
     * @dev Batch update country restrictions
     */
    function batchSetCountryRestrictions(
        uint16[] calldata countries,
        bool[] calldata restricted
    ) external onlyOwner {
        require(countries.length == restricted.length, "Array length mismatch");
        for (uint256 i = 0; i < countries.length; i++) {
            restrictedCountries[countries[i]] = restricted[i];
            emit CountryRestrictionUpdated(countries[i], restricted[i]);
        }
    }

    /**
     * @dev Update holding period
     */
    function setHoldingPeriod(uint256 _holdingPeriod) external onlyOwner {
        uint256 oldPeriod = holdingPeriod;
        holdingPeriod = _holdingPeriod;
        emit HoldingPeriodUpdated(oldPeriod, _holdingPeriod);
    }

    // ============ View Functions ============

    /**
     * @dev Get investor holding details
     */
    function getInvestorDetails(address investor) external view returns (
        uint256 holdings,
        uint256 acquisitionTimestamp,
        bool canSell
    ) {
        holdings = investorHoldings[investor];
        acquisitionTimestamp = acquisitionTime[investor];
        canSell = block.timestamp >= acquisitionTimestamp + holdingPeriod;
    }
}
