// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test, console } from "forge-std/Test.sol";
import { LendingPool } from "../src/LendingPool.sol";
import { InterestRateModel } from "../src/InterestRateModel.sol";
import { PriceOracle } from "../src/PriceOracle.sol";
import { MockERC20 } from "../src/mocks/MockERC20.sol";
import { ILendingPool } from "../src/interfaces/ILendingPool.sol";

/**
 * @title LendingPoolTest
 * @notice Comprehensive test suite for the lending protocol
 */
contract LendingPoolTest is Test {
    // ============ Contracts ============
    LendingPool public lendingPool;
    InterestRateModel public interestRateModel;
    PriceOracle public priceOracle;

    MockERC20 public weth;
    MockERC20 public usdc;
    MockERC20 public dai;

    // ============ Users ============
    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public liquidator = makeAddr("liquidator");

    // ============ Constants ============
    uint256 constant WAD = 1e18;
    uint256 constant INITIAL_ETH_PRICE = 2000e8; // $2000
    uint256 constant INITIAL_USDC_PRICE = 1e8; // $1
    uint256 constant INITIAL_DAI_PRICE = 1e8; // $1

    // ============ Setup ============

    function setUp() public {
        // Deploy mock tokens
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);
        dai = new MockERC20("Dai Stablecoin", "DAI", 18);

        // Deploy interest rate model
        // Base: 2%, Multiplier: 10%, Jump: 100%, Optimal: 80%
        interestRateModel = new InterestRateModel(
            0.02e18, // 2% base rate
            0.1e18, // 10% multiplier
            1e18, // 100% jump multiplier
            0.8e18 // 80% optimal utilization
        );

        // Deploy price oracle
        priceOracle = new PriceOracle();

        // Set prices
        priceOracle.setManualPrice(address(weth), INITIAL_ETH_PRICE, 18);
        priceOracle.setManualPrice(address(usdc), INITIAL_USDC_PRICE, 6);
        priceOracle.setManualPrice(address(dai), INITIAL_DAI_PRICE, 18);

        // Deploy lending pool
        lendingPool = new LendingPool(address(interestRateModel), address(priceOracle));

        // List markets
        // WETH: 75% collateral factor, 80% liquidation threshold, 5% bonus, 10% reserve
        lendingPool.listMarket(address(weth), 0.75e18, 0.8e18, 1.05e18, 0.1e18);

        // USDC: 80% collateral factor, 85% liquidation threshold, 5% bonus, 10% reserve
        lendingPool.listMarket(address(usdc), 0.8e18, 0.85e18, 1.05e18, 0.1e18);

        // DAI: 75% collateral factor, 80% liquidation threshold, 5% bonus, 10% reserve
        lendingPool.listMarket(address(dai), 0.75e18, 0.8e18, 1.05e18, 0.1e18);

        // Fund users
        _fundUser(alice, 100 ether, 100_000e6, 100_000e18);
        _fundUser(bob, 100 ether, 100_000e6, 100_000e18);
        _fundUser(liquidator, 100 ether, 100_000e6, 100_000e18);
    }

    function _fundUser(address user, uint256 wethAmount, uint256 usdcAmount, uint256 daiAmount) internal {
        weth.mint(user, wethAmount);
        usdc.mint(user, usdcAmount);
        dai.mint(user, daiAmount);

        vm.startPrank(user);
        weth.approve(address(lendingPool), type(uint256).max);
        usdc.approve(address(lendingPool), type(uint256).max);
        dai.approve(address(lendingPool), type(uint256).max);
        vm.stopPrank();
    }

    // ============ Supply Tests ============

    function test_Supply() public {
        uint256 supplyAmount = 10 ether;

        vm.startPrank(alice);
        lendingPool.supply(address(weth), supplyAmount);
        vm.stopPrank();

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), supplyAmount);
        assertEq(weth.balanceOf(address(lendingPool)), supplyAmount);
    }

    function test_Supply_MultipleTokens() public {
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.supply(address(usdc), 10_000e6);
        vm.stopPrank();

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), 10 ether);
        assertEq(lendingPool.getSupplyBalance(alice, address(usdc)), 10_000e6);
    }

    function test_Supply_RevertIfZeroAmount() public {
        vm.startPrank(alice);
        vm.expectRevert(LendingPool.InvalidAmount.selector);
        lendingPool.supply(address(weth), 0);
        vm.stopPrank();
    }

    function test_Supply_RevertIfMarketNotListed() public {
        MockERC20 unlisted = new MockERC20("Unlisted", "UNL", 18);

        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(LendingPool.MarketNotListed.selector, address(unlisted)));
        lendingPool.supply(address(unlisted), 1 ether);
        vm.stopPrank();
    }

    // ============ Withdraw Tests ============

    function test_Withdraw() public {
        uint256 supplyAmount = 10 ether;
        uint256 withdrawAmount = 5 ether;

        vm.startPrank(alice);
        lendingPool.supply(address(weth), supplyAmount);
        lendingPool.withdraw(address(weth), withdrawAmount);
        vm.stopPrank();

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), supplyAmount - withdrawAmount);
    }

    function test_Withdraw_Full() public {
        uint256 supplyAmount = 10 ether;

        vm.startPrank(alice);
        lendingPool.supply(address(weth), supplyAmount);
        lendingPool.withdraw(address(weth), supplyAmount);
        vm.stopPrank();

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), 0);
        assertEq(weth.balanceOf(alice), 100 ether); // Back to original
    }

    function test_Withdraw_RevertIfInsufficientBalance() public {
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);

        vm.expectRevert(LendingPool.InsufficientLiquidity.selector);
        lendingPool.withdraw(address(weth), 20 ether);
        vm.stopPrank();
    }

    // ============ Borrow Tests ============

    function test_Borrow() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        // Alice supplies WETH as collateral
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        // 10 ETH * $2000 * 0.75 (collateral factor) = $15,000 borrowing power
        // Borrow $5000 worth of USDC
        lendingPool.borrow(address(usdc), 5000e6);
        vm.stopPrank();

        assertEq(lendingPool.getBorrowBalance(alice, address(usdc)), 5000e6);
        assertEq(usdc.balanceOf(alice), 100_000e6 + 5000e6);
    }

    function test_Borrow_MaxAmount() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        // Max borrow = 10 * 2000 * 0.75 = $15,000
        // Leave some margin for health factor
        lendingPool.borrow(address(usdc), 14_000e6);
        vm.stopPrank();

        assertTrue(lendingPool.isHealthy(alice));
    }

    function test_Borrow_RevertIfInsufficientCollateral() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        // Try to borrow more than collateral allows
        // 10 ETH * $2000 * 0.75 = $15,000 max borrow
        vm.expectRevert(LendingPool.InsufficientCollateral.selector);
        lendingPool.borrow(address(usdc), 20_000e6);
        vm.stopPrank();
    }

    function test_Borrow_RevertIfInsufficientLiquidity() public {
        // Alice supplies WETH
        vm.prank(alice);
        lendingPool.supply(address(weth), 10 ether);

        // Bob supplies small amount of USDC
        vm.prank(bob);
        lendingPool.supply(address(usdc), 1000e6);

        // Alice tries to borrow more than available
        vm.startPrank(alice);
        vm.expectRevert(LendingPool.InsufficientLiquidity.selector);
        lendingPool.borrow(address(usdc), 5000e6);
        vm.stopPrank();
    }

    // ============ Repay Tests ============

    function test_Repay() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 5000e6);

        lendingPool.repay(address(usdc), 2500e6);
        vm.stopPrank();

        assertEq(lendingPool.getBorrowBalance(alice, address(usdc)), 2500e6);
    }

    function test_Repay_Full() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 5000e6);

        // Repay full amount
        lendingPool.repay(address(usdc), 5000e6);
        vm.stopPrank();

        assertEq(lendingPool.getBorrowBalance(alice, address(usdc)), 0);
    }

    function test_Repay_MoreThanOwed() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 5000e6);

        uint256 balanceBefore = usdc.balanceOf(alice);
        // Try to repay more than owed - should cap at debt
        lendingPool.repay(address(usdc), 10000e6);
        uint256 balanceAfter = usdc.balanceOf(alice);
        vm.stopPrank();

        assertEq(lendingPool.getBorrowBalance(alice, address(usdc)), 0);
        // Should only have transferred the owed amount
        assertEq(balanceBefore - balanceAfter, 5000e6);
    }

    // ============ Interest Accrual Tests ============

    function test_InterestAccrual() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        // Alice borrows
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 10_000e6);
        vm.stopPrank();

        uint256 borrowBefore = lendingPool.getBorrowBalance(alice, address(usdc));

        // Fast forward 1 year
        vm.warp(block.timestamp + 365 days);

        uint256 borrowAfter = lendingPool.getBorrowBalance(alice, address(usdc));

        // Interest should have accrued
        assertGt(borrowAfter, borrowBefore);
        console.log("Borrow before:", borrowBefore);
        console.log("Borrow after:", borrowAfter);
        console.log("Interest accrued:", borrowAfter - borrowBefore);
    }

    // ============ Liquidation Tests ============

    function test_Liquidation() public {
        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        // Alice supplies WETH and borrows max USDC
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 14_000e6); // Near max
        vm.stopPrank();

        assertTrue(lendingPool.isHealthy(alice));

        // Price drops - ETH goes from $2000 to $1500
        priceOracle.setManualPrice(address(weth), 1500e8, 18);

        // Now Alice is underwater
        assertFalse(lendingPool.isHealthy(alice));
        uint256 healthFactor = lendingPool.getHealthFactor(alice);
        console.log("Health factor after price drop:", healthFactor);

        // Liquidator repays some of Alice's debt
        uint256 repayAmount = 5000e6; // Repay $5000

        vm.prank(liquidator);
        lendingPool.liquidate(alice, address(weth), address(usdc), repayAmount);

        // Alice's debt should be reduced
        assertLt(lendingPool.getBorrowBalance(alice, address(usdc)), 14_000e6);

        // Liquidator should have received WETH
        assertGt(lendingPool.getSupplyBalance(liquidator, address(weth)), 0);
    }

    function test_Liquidation_RevertIfHealthy() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 5000e6); // Conservative borrow
        vm.stopPrank();

        assertTrue(lendingPool.isHealthy(alice));

        vm.prank(liquidator);
        vm.expectRevert(abi.encodeWithSelector(LendingPool.NotLiquidatable.selector, lendingPool.getHealthFactor(alice)));
        lendingPool.liquidate(alice, address(weth), address(usdc), 1000e6);
    }

    function test_Liquidation_RevertIfSelfLiquidation() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 14_000e6);
        vm.stopPrank();

        priceOracle.setManualPrice(address(weth), 1500e8, 18);

        vm.prank(alice);
        vm.expectRevert(LendingPool.SelfLiquidation.selector);
        lendingPool.liquidate(alice, address(weth), address(usdc), 1000e6);
    }

    function test_Liquidation_RevertIfExceedsCloseFactor() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 14_000e6);
        vm.stopPrank();

        priceOracle.setManualPrice(address(weth), 1500e8, 18);

        // Try to liquidate more than 50%
        vm.prank(liquidator);
        vm.expectRevert(LendingPool.ExceedsCloseFactor.selector);
        lendingPool.liquidate(alice, address(weth), address(usdc), 10_000e6);
    }

    // ============ Health Factor Tests ============

    function test_HealthFactor_NoDebt() public {
        vm.prank(alice);
        lendingPool.supply(address(weth), 10 ether);

        // With no debt, health factor should be max
        assertEq(lendingPool.getHealthFactor(alice), type(uint256).max);
    }

    function test_HealthFactor_WithDebt() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 10_000e6);
        vm.stopPrank();

        // 10 ETH * $2000 * 0.8 (liquidation threshold) = $16,000 collateral value
        // $10,000 debt
        // Health factor = 16000 / 10000 = 1.6
        uint256 healthFactor = lendingPool.getHealthFactor(alice);
        assertApproxEqRel(healthFactor, 1.6e18, 0.01e18);
    }

    // ============ Collateral Management Tests ============

    function test_DisableCollateral() public {
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.supply(address(usdc), 10_000e6);

        // Should be able to disable one collateral if no borrows
        lendingPool.disableCollateral(address(weth));
        vm.stopPrank();

        assertFalse(lendingPool.isCollateralEnabled(alice, address(weth)));
    }

    function test_DisableCollateral_RevertIfNeeded() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 10_000e6);

        // Should not be able to disable collateral if it would make account unhealthy
        vm.expectRevert(LendingPool.InsufficientCollateral.selector);
        lendingPool.disableCollateral(address(weth));
        vm.stopPrank();
    }

    // ============ Admin Tests ============

    function test_Pause() public {
        lendingPool.pause();

        vm.prank(alice);
        vm.expectRevert();
        lendingPool.supply(address(weth), 1 ether);
    }

    function test_Unpause() public {
        lendingPool.pause();
        lendingPool.unpause();

        vm.prank(alice);
        lendingPool.supply(address(weth), 1 ether);
        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), 1 ether);
    }

    function test_WithdrawReserves() public {
        // Setup: Bob supplies, Alice borrows, time passes for interest
        vm.prank(bob);
        lendingPool.supply(address(usdc), 50_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 10_000e6);
        vm.stopPrank();

        // Fast forward to accrue interest
        vm.warp(block.timestamp + 365 days);

        // Trigger interest accrual
        vm.prank(alice);
        lendingPool.repay(address(usdc), 1e6);

        ILendingPool.Market memory market = lendingPool.getMarket(address(usdc));
        uint256 reserves = market.totalReserves;

        if (reserves > 0) {
            address treasury = makeAddr("treasury");
            lendingPool.withdrawReserves(address(usdc), reserves, treasury);
            assertEq(usdc.balanceOf(treasury), reserves);
        }
    }

    // ============ View Function Tests ============

    function test_GetAllMarkets() public {
        address[] memory markets = lendingPool.getAllMarkets();
        assertEq(markets.length, 3);
        assertEq(markets[0], address(weth));
        assertEq(markets[1], address(usdc));
        assertEq(markets[2], address(dai));
    }

    function test_GetUserMarkets() public {
        vm.startPrank(alice);
        lendingPool.supply(address(weth), 1 ether);
        lendingPool.supply(address(usdc), 1000e6);
        vm.stopPrank();

        address[] memory userMarkets = lendingPool.getUserMarkets(alice);
        assertEq(userMarkets.length, 2);
    }

    function test_GetUtilizationRate() public {
        vm.prank(bob);
        lendingPool.supply(address(usdc), 20_000e6);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 10 ether);
        lendingPool.borrow(address(usdc), 10_000e6);
        vm.stopPrank();

        // Utilization = 25000 / 50000 = 50%
        uint256 utilization = lendingPool.getUtilizationRate(address(usdc));
        assertApproxEqRel(utilization, 0.5e18, 0.01e18);
    }
}
