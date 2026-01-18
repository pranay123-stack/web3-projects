// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title IdentityRegistry
 * @dev Manages investor identities for KYC/AML compliance
 * @notice Simplified ERC-3643 identity registry for RWA tokenization
 */
contract IdentityRegistry is IIdentityRegistry, AccessControl {

    // ============ Roles ============
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    // ============ State Variables ============

    // Investor identity mapping (address => identity hash)
    mapping(address => bytes32) private _identities;

    // Investor country mapping (address => country code)
    mapping(address => uint16) private _investorCountries;

    // Verification status
    mapping(address => bool) private _verified;

    // Total registered investors
    uint256 public totalInvestors;

    // ============ Errors ============
    error IdentityAlreadyRegistered();
    error IdentityNotFound();
    error InvalidIdentityHash();
    error InvalidCountryCode();
    error ZeroAddress();

    // ============ Constructor ============

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
    }

    // ============ External Functions ============

    /**
     * @dev Register a new investor identity
     * @param investor Address of the investor
     * @param identityHash Hash of KYC documents
     * @param country ISO 3166-1 numeric country code
     */
    function registerIdentity(
        address investor,
        bytes32 identityHash,
        uint16 country
    ) external override onlyRole(REGISTRAR_ROLE) {
        if (investor == address(0)) revert ZeroAddress();
        if (_verified[investor]) revert IdentityAlreadyRegistered();
        if (identityHash == bytes32(0)) revert InvalidIdentityHash();
        if (country == 0) revert InvalidCountryCode();

        _identities[investor] = identityHash;
        _investorCountries[investor] = country;
        _verified[investor] = true;
        totalInvestors++;

        emit IdentityRegistered(investor, identityHash);
        emit CountryUpdated(investor, country);
    }

    /**
     * @dev Update investor identity hash
     * @param investor Address of the investor
     * @param identityHash New identity hash
     */
    function updateIdentity(
        address investor,
        bytes32 identityHash
    ) external override onlyRole(AGENT_ROLE) {
        if (!_verified[investor]) revert IdentityNotFound();
        if (identityHash == bytes32(0)) revert InvalidIdentityHash();

        _identities[investor] = identityHash;
        emit IdentityUpdated(investor, identityHash);
    }

    /**
     * @dev Update investor country
     * @param investor Address of the investor
     * @param country New country code
     */
    function updateCountry(
        address investor,
        uint16 country
    ) external override onlyRole(AGENT_ROLE) {
        if (!_verified[investor]) revert IdentityNotFound();
        if (country == 0) revert InvalidCountryCode();

        _investorCountries[investor] = country;
        emit CountryUpdated(investor, country);
    }

    /**
     * @dev Remove investor identity
     * @param investor Address of the investor
     */
    function deleteIdentity(
        address investor
    ) external override onlyRole(REGISTRAR_ROLE) {
        if (!_verified[investor]) revert IdentityNotFound();

        delete _identities[investor];
        delete _investorCountries[investor];
        _verified[investor] = false;
        totalInvestors--;

        emit IdentityRemoved(investor);
    }

    /**
     * @dev Batch register identities
     * @param investors Array of investor addresses
     * @param identityHashes Array of identity hashes
     * @param countries Array of country codes
     */
    function batchRegisterIdentity(
        address[] calldata investors,
        bytes32[] calldata identityHashes,
        uint16[] calldata countries
    ) external onlyRole(REGISTRAR_ROLE) {
        require(
            investors.length == identityHashes.length &&
            investors.length == countries.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < investors.length; i++) {
            if (investors[i] != address(0) && !_verified[investors[i]]) {
                _identities[investors[i]] = identityHashes[i];
                _investorCountries[investors[i]] = countries[i];
                _verified[investors[i]] = true;
                totalInvestors++;
                emit IdentityRegistered(investors[i], identityHashes[i]);
            }
        }
    }

    // ============ View Functions ============

    /**
     * @dev Check if investor is verified
     * @param investor Address to check
     */
    function isVerified(address investor) external view override returns (bool) {
        return _verified[investor];
    }

    /**
     * @dev Get investor identity hash
     * @param investor Address of investor
     */
    function getIdentity(address investor) external view override returns (bytes32) {
        return _identities[investor];
    }

    /**
     * @dev Get investor country code
     * @param investor Address of investor
     */
    function getInvestorCountry(address investor) external view override returns (uint16) {
        return _investorCountries[investor];
    }
}
