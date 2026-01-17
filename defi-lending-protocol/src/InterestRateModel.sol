// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IInterestRateModel } from "./interfaces/IInterestRateModel.sol";

/**
 * @title InterestRateModel
 * @notice Jump rate interest model for the lending protocol
 * @dev Implements a two-slope interest rate model:
 *      - Below optimal utilization: gentle slope
 *      - Above optimal utilization: steep slope (jump rate)
 *
 * This incentivizes liquidity by making borrowing expensive when utilization is high
 */
contract InterestRateModel is IInterestRateModel {
    // ============ Constants ============

    uint256 private constant WAD = 1e18;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    // ============ Immutable State ============

    /// @notice Base rate per year (e.g., 2% = 0.02e18)
    uint256 public immutable baseRatePerYear;

    /// @notice Rate slope below optimal utilization (e.g., 4% = 0.04e18)
    uint256 public immutable multiplierPerYear;

    /// @notice Rate slope above optimal utilization (e.g., 75% = 0.75e18)
    uint256 public immutable jumpMultiplierPerYear;

    /// @notice Optimal utilization rate (e.g., 80% = 0.8e18)
    uint256 public immutable optimalUtilization;

    // Derived per-second rates for gas optimization
    uint256 public immutable baseRatePerSecond;
    uint256 public immutable multiplierPerSecond;
    uint256 public immutable jumpMultiplierPerSecond;

    // ============ Constructor ============

    /**
     * @notice Initialize the interest rate model
     * @param _baseRatePerYear Base APR (scaled by 1e18)
     * @param _multiplierPerYear Slope below optimal (scaled by 1e18)
     * @param _jumpMultiplierPerYear Slope above optimal (scaled by 1e18)
     * @param _optimalUtilization Target utilization rate (scaled by 1e18)
     */
    constructor(
        uint256 _baseRatePerYear,
        uint256 _multiplierPerYear,
        uint256 _jumpMultiplierPerYear,
        uint256 _optimalUtilization
    ) {
        require(_optimalUtilization <= WAD, "Optimal utilization too high");

        baseRatePerYear = _baseRatePerYear;
        multiplierPerYear = _multiplierPerYear;
        jumpMultiplierPerYear = _jumpMultiplierPerYear;
        optimalUtilization = _optimalUtilization;

        // Pre-compute per-second rates
        baseRatePerSecond = _baseRatePerYear / SECONDS_PER_YEAR;
        multiplierPerSecond = _multiplierPerYear / SECONDS_PER_YEAR;
        jumpMultiplierPerSecond = _jumpMultiplierPerYear / SECONDS_PER_YEAR;
    }

    // ============ External View Functions ============

    /**
     * @inheritdoc IInterestRateModel
     */
    function getUtilizationRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public pure override returns (uint256) {
        // Utilization = borrows / (cash + borrows - reserves)
        if (borrows == 0) return 0;

        uint256 totalLiquidity = cash + borrows - reserves;
        if (totalLiquidity == 0) return 0;

        return (borrows * WAD) / totalLiquidity;
    }

    /**
     * @inheritdoc IInterestRateModel
     * @dev Returns the borrow rate per second
     *
     * If utilization <= optimal:
     *   rate = baseRate + (utilization * multiplier / optimal)
     *
     * If utilization > optimal:
     *   rate = baseRate + multiplier + ((utilization - optimal) * jumpMultiplier / (1 - optimal))
     */
    function getBorrowRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public view override returns (uint256) {
        uint256 util = getUtilizationRate(cash, borrows, reserves);

        if (util <= optimalUtilization) {
            // Normal rate: baseRate + (util * multiplier / optimal)
            uint256 normalRate = (util * multiplierPerSecond) / optimalUtilization;
            return baseRatePerSecond + normalRate;
        } else {
            // Jump rate: baseRate + multiplier + excess rate
            uint256 excessUtil = util - optimalUtilization;
            uint256 excessRate = (excessUtil * jumpMultiplierPerSecond) / (WAD - optimalUtilization);
            return baseRatePerSecond + multiplierPerSecond + excessRate;
        }
    }

    /**
     * @inheritdoc IInterestRateModel
     * @dev Supply rate = borrow rate * utilization * (1 - reserveFactor)
     */
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactor
    ) public view override returns (uint256) {
        uint256 oneMinusReserveFactor = WAD - reserveFactor;
        uint256 borrowRate = getBorrowRate(cash, borrows, reserves);
        uint256 util = getUtilizationRate(cash, borrows, reserves);

        // supplyRate = borrowRate * util * (1 - reserveFactor) / WAD^2
        return (borrowRate * util * oneMinusReserveFactor) / (WAD * WAD);
    }

    // ============ Helper View Functions ============

    /**
     * @notice Get the borrow APR for given market conditions
     * @param cash Total available liquidity
     * @param borrows Total outstanding borrows
     * @param reserves Total reserves
     * @return The annual borrow rate (scaled by 1e18)
     */
    function getBorrowAPR(uint256 cash, uint256 borrows, uint256 reserves) external view returns (uint256) {
        return getBorrowRate(cash, borrows, reserves) * SECONDS_PER_YEAR;
    }

    /**
     * @notice Get the supply APR for given market conditions
     * @param cash Total available liquidity
     * @param borrows Total outstanding borrows
     * @param reserves Total reserves
     * @param reserveFactor The reserve factor
     * @return The annual supply rate (scaled by 1e18)
     */
    function getSupplyAPR(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactor
    ) external view returns (uint256) {
        return getSupplyRate(cash, borrows, reserves, reserveFactor) * SECONDS_PER_YEAR;
    }
}
