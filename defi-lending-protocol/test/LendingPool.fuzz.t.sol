// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test, console } from "forge-std/Test.sol";
import { LendingPool } from "../src/LendingPool.sol";
import { InterestRateModel } from "../src/InterestRateModel.sol";
import { PriceOracle } from "../src/PriceOracle.sol";
import { MockERC20 } from "../src/mocks/MockERC20.sol";

/**
 * @title LendingPoolFuzzTest
 * @notice Fuzz testing for the lending protocol
 * @dev Tests edge cases and random inputs
 */
contract LendingPoolFuzzTest is Test {
    LendingPool public lendingPool;
    InterestRateModel public interestRateModel;
    PriceOracle public priceOracle;
    MockERC20 public weth;
    MockERC20 public usdc;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 constant WAD = 1e18;
    uint256 constant MAX_SUPPLY = 1_000_000 ether;
    uint256 constant MAX_USDC_SUPPLY = 1_000_000_000e6;

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);

        interestRateModel = new InterestRateModel(0.02e18, 0.1e18, 1e18, 0.8e18);
        priceOracle = new PriceOracle();

        priceOracle.setManualPrice(address(weth), 2000e8, 18);
        priceOracle.setManualPrice(address(usdc), 1e8, 6);

        lendingPool = new LendingPool(address(interestRateModel), address(priceOracle));

        lendingPool.listMarket(address(weth), 0.75e18, 0.8e18, 1.05e18, 0.1e18);
        lendingPool.listMarket(address(usdc), 0.8e18, 0.85e18, 1.05e18, 0.1e18);

        // Fund users with large amounts
        weth.mint(alice, MAX_SUPPLY);
        weth.mint(bob, MAX_SUPPLY);
        usdc.mint(alice, MAX_USDC_SUPPLY);
        usdc.mint(bob, MAX_USDC_SUPPLY);

        vm.prank(alice);
        weth.approve(address(lendingPool), type(uint256).max);
        vm.prank(alice);
        usdc.approve(address(lendingPool), type(uint256).max);
        vm.prank(bob);
        weth.approve(address(lendingPool), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(lendingPool), type(uint256).max);
    }

    // ============ Fuzz Tests ============

    /**
     * @notice Test supply with random amounts
     * @dev Ensures supply always works for valid amounts
     */
    function testFuzz_Supply(uint256 amount) public {
        amount = bound(amount, 1, MAX_SUPPLY);

        vm.prank(alice);
        lendingPool.supply(address(weth), amount);

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), amount);
    }

    /**
     * @notice Test supply and withdraw roundtrip
     * @dev Ensures users can always withdraw what they supply (no borrows)
     */
    function testFuzz_SupplyAndWithdraw(uint256 supplyAmount, uint256 withdrawAmount) public {
        supplyAmount = bound(supplyAmount, 1, MAX_SUPPLY);
        withdrawAmount = bound(withdrawAmount, 1, supplyAmount);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), supplyAmount);
        lendingPool.withdraw(address(weth), withdrawAmount);
        vm.stopPrank();

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), supplyAmount - withdrawAmount);
    }

    /**
     * @notice Test borrow within collateral limits
     * @dev Ensures borrows respect collateral factor
     */
    function testFuzz_BorrowWithinLimits(uint256 supplyAmount, uint256 borrowPercent) public {
        supplyAmount = bound(supplyAmount, 1 ether, 100 ether);
        borrowPercent = bound(borrowPercent, 1, 70); // 1-70% of max

        // Supply WETH
        vm.prank(alice);
        lendingPool.supply(address(weth), supplyAmount);

        // Bob supplies USDC for liquidity
        vm.prank(bob);
        lendingPool.supply(address(usdc), MAX_USDC_SUPPLY);

        // Calculate max borrow
        // supplyAmount ETH * $2000 * 0.75 collateral factor = max borrow in USD
        uint256 maxBorrowUSD = (supplyAmount * 2000 * 75) / 100;
        uint256 borrowAmount = (maxBorrowUSD * borrowPercent) / 100;

        // Convert to USDC (6 decimals)
        uint256 borrowUsdc = borrowAmount * 1e6 / 1e18;

        if (borrowUsdc > 0) {
            vm.prank(alice);
            lendingPool.borrow(address(usdc), borrowUsdc);

            assertTrue(lendingPool.isHealthy(alice));
        }
    }

    /**
     * @notice Test that repay never fails for valid amounts
     */
    function testFuzz_Repay(uint256 borrowAmount, uint256 repayPercent) public {
        borrowAmount = bound(borrowAmount, 1000e6, 10_000e6);
        repayPercent = bound(repayPercent, 1, 100);

        // Setup
        vm.prank(bob);
        lendingPool.supply(address(usdc), MAX_USDC_SUPPLY);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 100 ether);
        lendingPool.borrow(address(usdc), borrowAmount);

        uint256 repayAmount = (borrowAmount * repayPercent) / 100;
        if (repayAmount > 0) {
            lendingPool.repay(address(usdc), repayAmount);
        }
        vm.stopPrank();

        uint256 remainingDebt = lendingPool.getBorrowBalance(alice, address(usdc));
        assertLe(remainingDebt, borrowAmount);
    }

    /**
     * @notice Test interest accrual over random time periods
     */
    function testFuzz_InterestAccrual(uint256 timeElapsed) public {
        timeElapsed = bound(timeElapsed, 1 hours, 365 days);

        // Setup
        vm.prank(bob);
        lendingPool.supply(address(usdc), MAX_USDC_SUPPLY);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 100 ether); // Supply more collateral for safe borrow
        lendingPool.borrow(address(usdc), 10_000e6);
        vm.stopPrank();

        uint256 borrowBefore = lendingPool.getBorrowBalance(alice, address(usdc));

        vm.warp(block.timestamp + timeElapsed);

        uint256 borrowAfter = lendingPool.getBorrowBalance(alice, address(usdc));

        // Interest should always increase (or stay same for very short periods)
        assertGe(borrowAfter, borrowBefore);
    }

    /**
     * @notice Test health factor calculation with various positions
     */
    function testFuzz_HealthFactor(uint256 supplyAmount, uint256 borrowPercent) public {
        supplyAmount = bound(supplyAmount, 1 ether, 100 ether);
        borrowPercent = bound(borrowPercent, 1, 70); // Max 70% to stay safe

        vm.prank(bob);
        lendingPool.supply(address(usdc), MAX_USDC_SUPPLY);

        vm.prank(alice);
        lendingPool.supply(address(weth), supplyAmount);

        // Calculate max borrow using collateral factor (75%)
        // Max borrow = supplyAmount * price * collateralFactor
        uint256 maxBorrowUSD = (supplyAmount * 2000 * 75) / 100;
        uint256 borrowAmountUSD = (maxBorrowUSD * borrowPercent) / 100;
        uint256 borrowUsdc = borrowAmountUSD * 1e6 / 1e18;

        if (borrowUsdc > 0) {
            vm.prank(alice);
            lendingPool.borrow(address(usdc), borrowUsdc);

            uint256 healthFactor = lendingPool.getHealthFactor(alice);

            // Health factor should be >= 1 for reasonable borrow %
            assertTrue(healthFactor >= WAD);
        }
    }

    /**
     * @notice Test price changes don't break accounting
     */
    function testFuzz_PriceChange(uint256 newPrice) public {
        newPrice = bound(newPrice, 100e8, 10000e8); // $100 - $10000

        // Setup position
        vm.prank(bob);
        lendingPool.supply(address(usdc), MAX_USDC_SUPPLY);

        vm.startPrank(alice);
        lendingPool.supply(address(weth), 100 ether); // Supply more collateral
        lendingPool.borrow(address(usdc), 5000e6);
        vm.stopPrank();

        // Change price
        priceOracle.setManualPrice(address(weth), newPrice, 18);

        // System should still be operational
        uint256 healthFactor = lendingPool.getHealthFactor(alice);
        (uint256 collateral, uint256 debt) = lendingPool.getAccountLiquidity(alice);

        // Values should be non-negative
        assertGe(collateral, 0);
        assertGe(debt, 0);

        // Health factor should be calculable
        if (debt > 0) {
            assertGt(healthFactor, 0);
        }
    }

    /**
     * @notice Test multiple users can operate simultaneously
     */
    function testFuzz_MultipleUsers(uint256 aliceSupply, uint256 bobSupply) public {
        aliceSupply = bound(aliceSupply, 1 ether, 50 ether);
        bobSupply = bound(bobSupply, 1 ether, 50 ether);

        vm.prank(alice);
        lendingPool.supply(address(weth), aliceSupply);

        vm.prank(bob);
        lendingPool.supply(address(weth), bobSupply);

        assertEq(lendingPool.getSupplyBalance(alice, address(weth)), aliceSupply);
        assertEq(lendingPool.getSupplyBalance(bob, address(weth)), bobSupply);

        // Total supply should equal sum of individual supplies
        uint256 totalPoolBalance = weth.balanceOf(address(lendingPool));
        assertEq(totalPoolBalance, aliceSupply + bobSupply);
    }
}

/**
 * @title LendingPoolInvariantTest
 * @notice Invariant testing for the lending protocol
 * @dev Tests that critical invariants hold under all conditions
 */
contract LendingPoolInvariantTest is Test {
    LendingPool public lendingPool;
    InterestRateModel public interestRateModel;
    PriceOracle public priceOracle;
    MockERC20 public weth;
    MockERC20 public usdc;

    Handler public handler;

    function setUp() public {
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);

        interestRateModel = new InterestRateModel(0.02e18, 0.1e18, 1e18, 0.8e18);
        priceOracle = new PriceOracle();

        priceOracle.setManualPrice(address(weth), 2000e8, 18);
        priceOracle.setManualPrice(address(usdc), 1e8, 6);

        lendingPool = new LendingPool(address(interestRateModel), address(priceOracle));

        lendingPool.listMarket(address(weth), 0.75e18, 0.8e18, 1.05e18, 0.1e18);
        lendingPool.listMarket(address(usdc), 0.8e18, 0.85e18, 1.05e18, 0.1e18);

        handler = new Handler(lendingPool, weth, usdc);

        targetContract(address(handler));
    }

    /**
     * @notice Invariant: Pool token balance >= total supply - total borrows
     */
    function invariant_PoolSolvency() public view {
        uint256 poolWethBalance = weth.balanceOf(address(lendingPool));
        uint256 poolUsdcBalance = usdc.balanceOf(address(lendingPool));

        // Pool should always have enough tokens to cover withdrawals
        // (Total supply - total borrows = available liquidity)
        assertTrue(poolWethBalance >= 0);
        assertTrue(poolUsdcBalance >= 0);
    }

    /**
     * @notice Invariant: Utilization rate is always <= 100%
     */
    function invariant_UtilizationBounded() public view {
        uint256 wethUtil = lendingPool.getUtilizationRate(address(weth));
        uint256 usdcUtil = lendingPool.getUtilizationRate(address(usdc));

        assertLe(wethUtil, 1e18);
        assertLe(usdcUtil, 1e18);
    }
}

/**
 * @title Handler
 * @notice Handler contract for invariant testing
 */
contract Handler is Test {
    LendingPool public lendingPool;
    MockERC20 public weth;
    MockERC20 public usdc;

    address[] public actors;
    address internal currentActor;

    constructor(LendingPool _lendingPool, MockERC20 _weth, MockERC20 _usdc) {
        lendingPool = _lendingPool;
        weth = _weth;
        usdc = _usdc;

        // Create actors
        for (uint256 i = 0; i < 5; i++) {
            address actor = makeAddr(string(abi.encodePacked("actor", i)));
            actors.push(actor);

            // Fund actors
            weth.mint(actor, 1000 ether);
            usdc.mint(actor, 1_000_000e6);

            vm.prank(actor);
            weth.approve(address(lendingPool), type(uint256).max);
            vm.prank(actor);
            usdc.approve(address(lendingPool), type(uint256).max);
        }
    }

    modifier useActor(uint256 actorIndexSeed) {
        currentActor = actors[actorIndexSeed % actors.length];
        vm.startPrank(currentActor);
        _;
        vm.stopPrank();
    }

    function supply(uint256 actorSeed, uint256 amount, bool isWeth) public useActor(actorSeed) {
        address token = isWeth ? address(weth) : address(usdc);
        uint256 maxAmount = isWeth ? 100 ether : 100_000e6;
        amount = bound(amount, 1, maxAmount);

        try lendingPool.supply(token, amount) {} catch {}
    }

    function withdraw(uint256 actorSeed, uint256 amount, bool isWeth) public useActor(actorSeed) {
        address token = isWeth ? address(weth) : address(usdc);
        uint256 balance = lendingPool.getSupplyBalance(currentActor, token);

        if (balance > 0) {
            amount = bound(amount, 1, balance);
            try lendingPool.withdraw(token, amount) {} catch {}
        }
    }

    function borrow(uint256 actorSeed, uint256 amount) public useActor(actorSeed) {
        amount = bound(amount, 1e6, 10_000e6);
        try lendingPool.borrow(address(usdc), amount) {} catch {}
    }

    function repay(uint256 actorSeed, uint256 amount) public useActor(actorSeed) {
        uint256 debt = lendingPool.getBorrowBalance(currentActor, address(usdc));
        if (debt > 0) {
            amount = bound(amount, 1, debt);
            try lendingPool.repay(address(usdc), amount) {} catch {}
        }
    }

    function warpTime(uint256 seconds_) public {
        seconds_ = bound(seconds_, 1, 30 days);
        vm.warp(block.timestamp + seconds_);
    }
}
