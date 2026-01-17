// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInterestRateModel
 * @notice Interface for interest rate calculation model
 * @dev Implements a jump rate model similar to Compound
 */
interface IInterestRateModel {
    /**
     * @notice Calculates the current borrow rate per second
     * @param cash Total available liquidity
     * @param borrows Total outstanding borrows
     * @param reserves Total reserves
     * @return The borrow rate per second (scaled by 1e18)
     */
    function getBorrowRate(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256);

    /**
     * @notice Calculates the current supply rate per second
     * @param cash Total available liquidity
     * @param borrows Total outstanding borrows
     * @param reserves Total reserves
     * @param reserveFactor The reserve factor (scaled by 1e18)
     * @return The supply rate per second (scaled by 1e18)
     */
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactor
    ) external view returns (uint256);

    /**
     * @notice Calculates the utilization rate
     * @param cash Total available liquidity
     * @param borrows Total outstanding borrows
     * @param reserves Total reserves
     * @return The utilization rate (scaled by 1e18)
     */
    function getUtilizationRate(uint256 cash, uint256 borrows, uint256 reserves) external pure returns (uint256);
}
