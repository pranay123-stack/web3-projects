// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILendingPool
 * @notice Interface for the main lending pool contract
 * @dev Defines all external functions for the lending protocol
 */
interface ILendingPool {
    // ============ Structs ============

    struct Market {
        bool isListed;
        uint256 collateralFactor; // Scaled by 1e18, e.g., 0.75e18 = 75%
        uint256 liquidationThreshold; // Scaled by 1e18, e.g., 0.8e18 = 80%
        uint256 liquidationBonus; // Scaled by 1e18, e.g., 1.05e18 = 5% bonus
        uint256 reserveFactor; // Scaled by 1e18, e.g., 0.1e18 = 10%
        uint256 totalSupply; // Total supplied (in underlying)
        uint256 totalBorrows; // Total borrowed (in underlying)
        uint256 totalReserves; // Protocol reserves
        uint256 borrowIndex; // Accumulated interest index
        uint256 supplyIndex; // Accumulated supply index
        uint40 lastUpdateTimestamp;
    }

    struct UserAccount {
        uint256 supplied; // Shares of supply
        uint256 borrowed; // Borrow balance (principal)
        uint256 borrowIndex; // User's borrow index at last interaction
    }

    // ============ Events ============

    event MarketListed(address indexed token, uint256 collateralFactor, uint256 liquidationThreshold);
    event Supply(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event Borrow(address indexed user, address indexed token, uint256 amount);
    event Repay(address indexed user, address indexed token, uint256 amount);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed collateralToken,
        address debtToken,
        uint256 debtRepaid,
        uint256 collateralSeized
    );
    event ReservesWithdrawn(address indexed token, uint256 amount, address indexed to);
    event CollateralEnabled(address indexed user, address indexed token);
    event CollateralDisabled(address indexed user, address indexed token);

    // ============ User Functions ============

    function supply(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
    function borrow(address token, uint256 amount) external;
    function repay(address token, uint256 amount) external;
    function liquidate(address borrower, address collateralToken, address debtToken, uint256 repayAmount) external;

    // ============ Collateral Management ============

    function enableCollateral(address token) external;
    function disableCollateral(address token) external;

    // ============ View Functions ============

    function getMarket(address token) external view returns (Market memory);
    function getUserAccount(address user, address token) external view returns (UserAccount memory);
    function getAccountLiquidity(address user) external view returns (uint256 collateralValue, uint256 borrowValue);
    function isHealthy(address user) external view returns (bool);
    function getHealthFactor(address user) external view returns (uint256);
    function getSupplyBalance(address user, address token) external view returns (uint256);
    function getBorrowBalance(address user, address token) external view returns (uint256);
    function getSupplyRate(address token) external view returns (uint256);
    function getBorrowRate(address token) external view returns (uint256);
    function getUtilizationRate(address token) external view returns (uint256);
}
