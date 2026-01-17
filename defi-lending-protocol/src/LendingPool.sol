// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ILendingPool } from "./interfaces/ILendingPool.sol";
import { IInterestRateModel } from "./interfaces/IInterestRateModel.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";
import { WadMath } from "./libraries/WadMath.sol";

/**
 * @title LendingPool
 * @notice Main lending protocol contract
 * @dev Implements supply, borrow, repay, withdraw, and liquidation functionality
 *
 * Security features:
 * - Reentrancy protection on all state-changing functions
 * - Pausable for emergency situations
 * - Health factor checks before withdrawals and borrows
 * - Liquidation incentives aligned with protocol safety
 *
 * Architecture:
 * - Uses share-based accounting for supplies (similar to ERC4626)
 * - Interest accrues per-second using compound interest
 * - Collateral factors and liquidation thresholds are per-market
 */
contract LendingPool is ILendingPool, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using WadMath for uint256;

    // ============ Constants ============

    uint256 private constant WAD = 1e18;
    uint256 private constant RAY = 1e27;

    /// @notice Minimum health factor (1.0)
    uint256 public constant MIN_HEALTH_FACTOR = WAD;

    /// @notice Close factor - max portion of debt that can be liquidated (50%)
    uint256 public constant CLOSE_FACTOR = 0.5e18;

    /// @notice Minimum collateral factor (10%)
    uint256 public constant MIN_COLLATERAL_FACTOR = 0.1e18;

    /// @notice Maximum collateral factor (90%)
    uint256 public constant MAX_COLLATERAL_FACTOR = 0.9e18;

    // ============ Immutable State ============

    /// @notice Interest rate model contract
    IInterestRateModel public immutable interestRateModel;

    /// @notice Price oracle contract
    IPriceOracle public immutable priceOracle;

    // ============ State ============

    /// @notice Mapping of token address to market configuration
    mapping(address => Market) public markets;

    /// @notice Mapping of user -> token -> account data
    mapping(address => mapping(address => UserAccount)) public userAccounts;

    /// @notice Mapping of user -> token -> is collateral enabled
    mapping(address => mapping(address => bool)) public isCollateralEnabled;

    /// @notice List of all listed markets
    address[] public marketList;

    /// @notice Mapping of user -> list of markets they've interacted with
    mapping(address => address[]) public userMarkets;

    /// @notice Mapping of user -> token -> has user entered market
    mapping(address => mapping(address => bool)) public hasEnteredMarket;

    // ============ Errors ============

    error MarketNotListed(address token);
    error MarketAlreadyListed(address token);
    error InsufficientLiquidity();
    error InsufficientCollateral();
    error HealthFactorTooLow(uint256 healthFactor);
    error NotLiquidatable(uint256 healthFactor);
    error InvalidAmount();
    error InvalidParameter();
    error ExceedsCloseFactor();
    error SelfLiquidation();
    error CollateralNotEnabled();
    error NoBorrowBalance();

    // ============ Constructor ============

    /**
     * @notice Initialize the lending pool
     * @param _interestRateModel Address of the interest rate model
     * @param _priceOracle Address of the price oracle
     */
    constructor(address _interestRateModel, address _priceOracle) Ownable(msg.sender) {
        if (_interestRateModel == address(0) || _priceOracle == address(0)) revert InvalidParameter();

        interestRateModel = IInterestRateModel(_interestRateModel);
        priceOracle = IPriceOracle(_priceOracle);
    }

    // ============ Admin Functions ============

    /**
     * @notice List a new market
     * @param token The token address
     * @param collateralFactor Collateral factor (scaled by 1e18)
     * @param liquidationThreshold Liquidation threshold (scaled by 1e18)
     * @param liquidationBonus Liquidation bonus (scaled by 1e18, e.g., 1.05e18 = 5%)
     * @param reserveFactor Reserve factor (scaled by 1e18)
     */
    function listMarket(
        address token,
        uint256 collateralFactor,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 reserveFactor
    ) external onlyOwner {
        if (markets[token].isListed) revert MarketAlreadyListed(token);
        if (collateralFactor < MIN_COLLATERAL_FACTOR || collateralFactor > MAX_COLLATERAL_FACTOR) {
            revert InvalidParameter();
        }
        if (liquidationThreshold <= collateralFactor || liquidationThreshold > WAD) revert InvalidParameter();
        if (liquidationBonus < WAD || liquidationBonus > 1.2e18) revert InvalidParameter();
        if (reserveFactor > 0.5e18) revert InvalidParameter();

        markets[token] = Market({
            isListed: true,
            collateralFactor: collateralFactor,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            reserveFactor: reserveFactor,
            totalSupply: 0,
            totalBorrows: 0,
            totalReserves: 0,
            borrowIndex: RAY,
            supplyIndex: RAY,
            lastUpdateTimestamp: uint40(block.timestamp)
        });

        marketList.push(token);

        emit MarketListed(token, collateralFactor, liquidationThreshold);
    }

    /**
     * @notice Pause the protocol
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw protocol reserves
     * @param token The token address
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawReserves(address token, uint256 amount, address to) external onlyOwner {
        Market storage market = markets[token];
        if (!market.isListed) revert MarketNotListed(token);
        if (amount > market.totalReserves) revert InsufficientLiquidity();

        market.totalReserves -= amount;
        IERC20(token).safeTransfer(to, amount);

        emit ReservesWithdrawn(token, amount, to);
    }

    // ============ User Functions ============

    /**
     * @inheritdoc ILendingPool
     * @dev Mints shares proportional to the supply
     */
    function supply(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        Market storage market = markets[token];
        if (!market.isListed) revert MarketNotListed(token);

        // Accrue interest first
        _accrueInterest(token);

        // Enter market if not already
        _enterMarket(msg.sender, token);

        // Calculate shares to mint
        uint256 shares = _calculateSupplyShares(token, amount);

        // Update state
        market.totalSupply += amount;
        userAccounts[msg.sender][token].supplied += shares;

        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit Supply(msg.sender, token, amount, shares);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function withdraw(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        Market storage market = markets[token];
        if (!market.isListed) revert MarketNotListed(token);

        // Accrue interest
        _accrueInterest(token);

        UserAccount storage account = userAccounts[msg.sender][token];

        // Calculate shares to burn
        uint256 shares = _calculateWithdrawShares(token, amount);
        if (shares > account.supplied) revert InsufficientLiquidity();

        // Check if withdrawal would leave account unhealthy
        uint256 supplyValue = _getSupplyValueInUSD(msg.sender, token, amount);
        (uint256 totalCollateral, uint256 totalBorrow) = getAccountLiquidity(msg.sender);

        if (totalBorrow > 0 && isCollateralEnabled[msg.sender][token]) {
            uint256 newCollateral = totalCollateral - supplyValue.wadMul(market.collateralFactor);
            if (newCollateral < totalBorrow) revert InsufficientCollateral();
        }

        // Check available liquidity
        uint256 availableLiquidity = IERC20(token).balanceOf(address(this));
        if (amount > availableLiquidity) revert InsufficientLiquidity();

        // Update state
        market.totalSupply -= amount;
        account.supplied -= shares;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount, shares);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function borrow(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        Market storage market = markets[token];
        if (!market.isListed) revert MarketNotListed(token);

        // Accrue interest
        _accrueInterest(token);

        // Check available liquidity
        uint256 availableLiquidity = IERC20(token).balanceOf(address(this));
        if (amount > availableLiquidity) revert InsufficientLiquidity();

        // Enter market if not already
        _enterMarket(msg.sender, token);

        // Check if borrow would leave account unhealthy
        (uint256 totalCollateral, uint256 totalBorrow) = getAccountLiquidity(msg.sender);
        uint256 borrowValue = priceOracle.getValueInUSD(token, amount);

        if (totalCollateral < totalBorrow + borrowValue) {
            revert InsufficientCollateral();
        }

        // Update user's borrow balance
        UserAccount storage account = userAccounts[msg.sender][token];
        account.borrowed += amount;
        account.borrowIndex = market.borrowIndex;

        // Update market totals
        market.totalBorrows += amount;

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, amount);

        // Verify health factor after borrow
        uint256 healthFactor = getHealthFactor(msg.sender);
        if (healthFactor < MIN_HEALTH_FACTOR) {
            revert HealthFactorTooLow(healthFactor);
        }

        emit Borrow(msg.sender, token, amount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function repay(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        Market storage market = markets[token];
        if (!market.isListed) revert MarketNotListed(token);

        // Accrue interest
        _accrueInterest(token);

        UserAccount storage account = userAccounts[msg.sender][token];
        uint256 borrowBalance = getBorrowBalance(msg.sender, token);

        if (borrowBalance == 0) revert NoBorrowBalance();

        // Cap repayment to outstanding balance
        uint256 repayAmount = amount > borrowBalance ? borrowBalance : amount;

        // Update state
        account.borrowed = borrowBalance - repayAmount;
        account.borrowIndex = market.borrowIndex;
        market.totalBorrows -= repayAmount;

        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), repayAmount);

        emit Repay(msg.sender, token, repayAmount);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function liquidate(
        address borrower,
        address collateralToken,
        address debtToken,
        uint256 repayAmount
    ) external nonReentrant whenNotPaused {
        if (borrower == msg.sender) revert SelfLiquidation();
        if (repayAmount == 0) revert InvalidAmount();

        // Check markets are listed
        if (!markets[collateralToken].isListed) revert MarketNotListed(collateralToken);
        if (!markets[debtToken].isListed) revert MarketNotListed(debtToken);

        // Accrue interest on both markets
        _accrueInterest(collateralToken);
        _accrueInterest(debtToken);

        // Validate liquidation and calculate amounts
        (uint256 seizeTokens, uint256 borrowBalance) = _validateAndCalculateLiquidation(
            borrower,
            collateralToken,
            debtToken,
            repayAmount
        );

        // Execute liquidation
        _executeLiquidation(borrower, collateralToken, debtToken, repayAmount, seizeTokens, borrowBalance);
    }

    /**
     * @notice Validate liquidation parameters and calculate seize amounts
     */
    function _validateAndCalculateLiquidation(
        address borrower,
        address collateralToken,
        address debtToken,
        uint256 repayAmount
    ) internal view returns (uint256 seizeTokens, uint256 borrowBalance) {
        // Check borrower is liquidatable
        uint256 healthFactor = getHealthFactor(borrower);
        if (healthFactor >= MIN_HEALTH_FACTOR) {
            revert NotLiquidatable(healthFactor);
        }

        // Check collateral is enabled
        if (!isCollateralEnabled[borrower][collateralToken]) {
            revert CollateralNotEnabled();
        }

        // Get borrower's debt
        borrowBalance = getBorrowBalance(borrower, debtToken);
        if (borrowBalance == 0) revert NoBorrowBalance();

        // Calculate max repayable (close factor)
        uint256 maxRepay = borrowBalance.wadMul(CLOSE_FACTOR);
        if (repayAmount > maxRepay) revert ExceedsCloseFactor();

        // Calculate collateral to seize
        seizeTokens = _calculateSeizeTokens(collateralToken, debtToken, repayAmount);

        // Cap at borrower's collateral
        uint256 borrowerCollateral = getSupplyBalance(borrower, collateralToken);
        if (seizeTokens > borrowerCollateral) {
            seizeTokens = borrowerCollateral;
        }
    }

    /**
     * @notice Calculate tokens to seize in liquidation
     */
    function _calculateSeizeTokens(
        address collateralToken,
        address debtToken,
        uint256 repayAmount
    ) internal view returns (uint256) {
        uint256 debtValue = priceOracle.getValueInUSD(debtToken, repayAmount);
        uint256 collateralPrice = priceOracle.getPrice(collateralToken);
        uint256 liquidationBonus = markets[collateralToken].liquidationBonus;

        // seizeValue = debtValue * liquidationBonus
        uint256 seizeValue = debtValue.wadMul(liquidationBonus);

        // Convert to collateral tokens (adjust for price decimals)
        return (seizeValue * 10 ** 8) / collateralPrice;
    }

    /**
     * @notice Execute the liquidation transfers
     */
    function _executeLiquidation(
        address borrower,
        address collateralToken,
        address debtToken,
        uint256 repayAmount,
        uint256 seizeTokens,
        uint256 borrowBalance
    ) internal {
        // Calculate shares to transfer
        uint256 seizeShares = _calculateWithdrawShares(collateralToken, seizeTokens);

        // Update debt position
        userAccounts[borrower][debtToken].borrowed = borrowBalance - repayAmount;
        userAccounts[borrower][debtToken].borrowIndex = markets[debtToken].borrowIndex;
        markets[debtToken].totalBorrows -= repayAmount;

        // Transfer collateral shares from borrower to liquidator
        userAccounts[borrower][collateralToken].supplied -= seizeShares;
        userAccounts[msg.sender][collateralToken].supplied += seizeShares;
        _enterMarket(msg.sender, collateralToken);

        // Transfer debt tokens from liquidator
        IERC20(debtToken).safeTransferFrom(msg.sender, address(this), repayAmount);

        emit Liquidation(msg.sender, borrower, collateralToken, debtToken, repayAmount, seizeTokens);
    }

    // ============ Collateral Management ============

    /**
     * @inheritdoc ILendingPool
     */
    function enableCollateral(address token) external {
        if (!markets[token].isListed) revert MarketNotListed(token);
        if (userAccounts[msg.sender][token].supplied == 0) revert InvalidAmount();

        isCollateralEnabled[msg.sender][token] = true;
        emit CollateralEnabled(msg.sender, token);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function disableCollateral(address token) external {
        if (!markets[token].isListed) revert MarketNotListed(token);

        // Check if disabling would make account unhealthy
        (uint256 totalCollateral, uint256 totalBorrow) = getAccountLiquidity(msg.sender);

        if (totalBorrow > 0) {
            uint256 tokenCollateralValue = _getSupplyValueInUSD(
                msg.sender,
                token,
                getSupplyBalance(msg.sender, token)
            );
            uint256 adjustedValue = tokenCollateralValue.wadMul(markets[token].collateralFactor);

            if (totalCollateral - adjustedValue < totalBorrow) {
                revert InsufficientCollateral();
            }
        }

        isCollateralEnabled[msg.sender][token] = false;
        emit CollateralDisabled(msg.sender, token);
    }

    // ============ View Functions ============

    /**
     * @inheritdoc ILendingPool
     */
    function getMarket(address token) external view override returns (Market memory) {
        return markets[token];
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getUserAccount(address user, address token) external view override returns (UserAccount memory) {
        return userAccounts[user][token];
    }

    /**
     * @inheritdoc ILendingPool
     * @dev Returns collateral value (adjusted by collateral factor) and borrow value
     */
    function getAccountLiquidity(
        address user
    ) public view override returns (uint256 totalCollateral, uint256 totalBorrow) {
        address[] memory userMarketList = userMarkets[user];

        for (uint256 i = 0; i < userMarketList.length; i++) {
            address token = userMarketList[i];
            Market storage market = markets[token];

            // Add collateral value (only if enabled)
            if (isCollateralEnabled[user][token]) {
                uint256 supplyBalance = getSupplyBalance(user, token);
                uint256 supplyValue = priceOracle.getValueInUSD(token, supplyBalance);
                totalCollateral += supplyValue.wadMul(market.collateralFactor);
            }

            // Add borrow value
            uint256 borrowBalance = getBorrowBalance(user, token);
            if (borrowBalance > 0) {
                totalBorrow += priceOracle.getValueInUSD(token, borrowBalance);
            }
        }
    }

    /**
     * @inheritdoc ILendingPool
     */
    function isHealthy(address user) public view override returns (bool) {
        return getHealthFactor(user) >= MIN_HEALTH_FACTOR;
    }

    /**
     * @inheritdoc ILendingPool
     * @dev Health factor = (collateral * liquidation threshold) / borrows
     */
    function getHealthFactor(address user) public view override returns (uint256) {
        address[] memory userMarketList = userMarkets[user];

        uint256 totalCollateral = 0;
        uint256 totalBorrow = 0;

        for (uint256 i = 0; i < userMarketList.length; i++) {
            address token = userMarketList[i];
            Market storage market = markets[token];

            // Add collateral value adjusted by liquidation threshold
            if (isCollateralEnabled[user][token]) {
                uint256 supplyBalance = getSupplyBalance(user, token);
                uint256 supplyValue = priceOracle.getValueInUSD(token, supplyBalance);
                totalCollateral += supplyValue.wadMul(market.liquidationThreshold);
            }

            // Add borrow value
            uint256 borrowBalance = getBorrowBalance(user, token);
            if (borrowBalance > 0) {
                totalBorrow += priceOracle.getValueInUSD(token, borrowBalance);
            }
        }

        if (totalBorrow == 0) return type(uint256).max;
        return totalCollateral.wadDiv(totalBorrow);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getSupplyBalance(address user, address token) public view override returns (uint256) {
        UserAccount storage account = userAccounts[user][token];
        if (account.supplied == 0) return 0;

        // For simplicity, using 1:1 share ratio
        // In a production system, you would track shares separately and calculate based on index
        return account.supplied;
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getBorrowBalance(address user, address token) public view override returns (uint256) {
        UserAccount storage account = userAccounts[user][token];
        if (account.borrowed == 0) return 0;

        Market storage market = markets[token];

        // Calculate current borrow index
        uint256 currentBorrowIndex = _calculateCurrentBorrowIndex(token);

        // balance = principal * currentIndex / userIndex
        return (account.borrowed * currentBorrowIndex) / account.borrowIndex;
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getSupplyRate(address token) public view override returns (uint256) {
        Market storage market = markets[token];
        uint256 cash = IERC20(token).balanceOf(address(this));
        return interestRateModel.getSupplyRate(cash, market.totalBorrows, market.totalReserves, market.reserveFactor);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getBorrowRate(address token) public view override returns (uint256) {
        Market storage market = markets[token];
        uint256 cash = IERC20(token).balanceOf(address(this));
        return interestRateModel.getBorrowRate(cash, market.totalBorrows, market.totalReserves);
    }

    /**
     * @inheritdoc ILendingPool
     */
    function getUtilizationRate(address token) public view override returns (uint256) {
        Market storage market = markets[token];
        uint256 cash = IERC20(token).balanceOf(address(this));
        return interestRateModel.getUtilizationRate(cash, market.totalBorrows, market.totalReserves);
    }

    /**
     * @notice Get all listed markets
     * @return Array of market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return marketList;
    }

    /**
     * @notice Get user's entered markets
     * @param user The user address
     * @return Array of market addresses
     */
    function getUserMarkets(address user) external view returns (address[] memory) {
        return userMarkets[user];
    }

    // ============ Internal Functions ============

    /**
     * @notice Accrue interest for a market
     * @param token The token address
     */
    function _accrueInterest(address token) internal {
        Market storage market = markets[token];

        uint40 currentTimestamp = uint40(block.timestamp);
        if (currentTimestamp == market.lastUpdateTimestamp) return;

        uint256 cash = IERC20(token).balanceOf(address(this));

        // Get current borrow rate
        uint256 borrowRate = interestRateModel.getBorrowRate(cash, market.totalBorrows, market.totalReserves);

        // Calculate interest accumulated
        uint256 interestFactor = WadMath.calculateCompoundedInterest(
            borrowRate * 1e9, // Convert to ray
            market.lastUpdateTimestamp,
            currentTimestamp
        );

        // Update borrow index
        market.borrowIndex = market.borrowIndex.rayMul(interestFactor);

        // Calculate interest earned
        uint256 interestAccumulated = market.totalBorrows.rayMul(interestFactor - RAY);

        // Update totals
        market.totalBorrows += interestAccumulated;

        // Add reserves
        uint256 reserveIncrease = interestAccumulated.wadMul(market.reserveFactor);
        market.totalReserves += reserveIncrease;

        // Update supply index (interest goes to suppliers minus reserves)
        if (market.totalSupply > 0) {
            uint256 supplyInterest = interestAccumulated - reserveIncrease;
            market.supplyIndex += (supplyInterest * RAY) / market.totalSupply;
        }

        market.lastUpdateTimestamp = currentTimestamp;
    }

    /**
     * @notice Enter a market for a user
     * @param user The user address
     * @param token The token address
     */
    function _enterMarket(address user, address token) internal {
        if (!hasEnteredMarket[user][token]) {
            hasEnteredMarket[user][token] = true;
            userMarkets[user].push(token);

            // Auto-enable as collateral on first supply
            if (userAccounts[user][token].supplied == 0) {
                isCollateralEnabled[user][token] = true;
            }
        }
    }

    /**
     * @notice Calculate shares for a supply amount
     * @param token The token address
     * @param amount The amount to supply
     * @return shares The number of shares to mint
     */
    function _calculateSupplyShares(address token, uint256 amount) internal view returns (uint256 shares) {
        Market storage market = markets[token];

        if (market.totalSupply == 0) {
            return amount;
        }

        // shares = amount * totalShares / totalSupply
        // For simplicity, we use totalSupply as both underlying and shares base
        // In a more complex system, you'd track total shares separately
        return amount;
    }

    /**
     * @notice Calculate shares for a withdrawal amount
     * @param token The token address
     * @param amount The amount to withdraw
     * @return shares The number of shares to burn
     */
    function _calculateWithdrawShares(address token, uint256 amount) internal view returns (uint256 shares) {
        return amount; // Simplified: 1:1 for now
    }

    /**
     * @notice Calculate current supply index
     * @param token The token address
     * @return The current supply index
     */
    function _calculateCurrentSupplyIndex(address token) internal view returns (uint256) {
        Market storage market = markets[token];

        if (block.timestamp == market.lastUpdateTimestamp) {
            return market.supplyIndex;
        }

        uint256 cash = IERC20(token).balanceOf(address(this));
        uint256 borrowRate = interestRateModel.getBorrowRate(cash, market.totalBorrows, market.totalReserves);

        uint256 interestFactor = WadMath.calculateCompoundedInterest(
            borrowRate * 1e9,
            market.lastUpdateTimestamp,
            uint40(block.timestamp)
        );

        uint256 interestAccumulated = market.totalBorrows.rayMul(interestFactor - RAY);
        uint256 reserveIncrease = interestAccumulated.wadMul(market.reserveFactor);

        if (market.totalSupply == 0) return market.supplyIndex;

        uint256 supplyInterest = interestAccumulated - reserveIncrease;
        return market.supplyIndex + (supplyInterest * RAY) / market.totalSupply;
    }

    /**
     * @notice Calculate current borrow index
     * @param token The token address
     * @return The current borrow index
     */
    function _calculateCurrentBorrowIndex(address token) internal view returns (uint256) {
        Market storage market = markets[token];

        if (block.timestamp == market.lastUpdateTimestamp) {
            return market.borrowIndex;
        }

        uint256 cash = IERC20(token).balanceOf(address(this));
        uint256 borrowRate = interestRateModel.getBorrowRate(cash, market.totalBorrows, market.totalReserves);

        uint256 interestFactor = WadMath.calculateCompoundedInterest(
            borrowRate * 1e9,
            market.lastUpdateTimestamp,
            uint40(block.timestamp)
        );

        return market.borrowIndex.rayMul(interestFactor);
    }

    /**
     * @notice Get supply value in USD for a user's position
     * @param user The user address
     * @param token The token address
     * @param amount The amount of tokens
     * @return The USD value (scaled by 1e18)
     */
    function _getSupplyValueInUSD(address user, address token, uint256 amount) internal view returns (uint256) {
        return priceOracle.getValueInUSD(token, amount);
    }
}
