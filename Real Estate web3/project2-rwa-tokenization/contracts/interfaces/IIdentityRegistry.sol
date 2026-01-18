// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIdentityRegistry
 * @dev Interface for identity registry - simplified ERC-3643 compliance
 */
interface IIdentityRegistry {
    // Events
    event IdentityRegistered(address indexed investor, bytes32 indexed identityHash);
    event IdentityUpdated(address indexed investor, bytes32 indexed identityHash);
    event IdentityRemoved(address indexed investor);
    event CountryUpdated(address indexed investor, uint16 indexed country);

    // Functions
    function registerIdentity(address investor, bytes32 identityHash, uint16 country) external;
    function updateIdentity(address investor, bytes32 identityHash) external;
    function updateCountry(address investor, uint16 country) external;
    function deleteIdentity(address investor) external;
    function isVerified(address investor) external view returns (bool);
    function getIdentity(address investor) external view returns (bytes32);
    function getInvestorCountry(address investor) external view returns (uint16);
}
