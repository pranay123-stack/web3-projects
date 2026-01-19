// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComplianceModule
 * @dev Interface for compliance modules - ERC-3643 style
 */
interface IComplianceModule {
    // Events
    event ComplianceCheckPassed(address indexed from, address indexed to, uint256 amount);
    event ComplianceCheckFailed(address indexed from, address indexed to, uint256 amount, string reason);

    // Functions
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function transferred(address from, address to, uint256 amount) external;
    function created(address to, uint256 amount) external;
    function destroyed(address from, uint256 amount) external;
}
