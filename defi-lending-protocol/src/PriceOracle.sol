// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPriceOracle } from "./interfaces/IPriceOracle.sol";

/**
 * @title PriceOracle
 * @notice Price oracle with Chainlink integration for the lending protocol
 * @dev Supports both Chainlink price feeds and manual price setting for testing
 *
 * Security features:
 * - Stale price detection
 * - Price feed validation
 * - Owner-controlled feed management
 */
contract PriceOracle is IPriceOracle, Ownable {
    // ============ Structs ============

    struct PriceFeed {
        address feedAddress; // Chainlink aggregator address (0 for manual)
        uint256 manualPrice; // Manual price if no Chainlink feed
        uint8 decimals; // Token decimals
        uint256 maxStaleness; // Maximum age of price in seconds
        bool isManual; // True if using manual price
    }

    // ============ State ============

    /// @notice Mapping of token address to price feed configuration
    mapping(address => PriceFeed) public priceFeeds;

    /// @notice Default staleness threshold (1 hour)
    uint256 public constant DEFAULT_STALENESS = 1 hours;

    /// @notice Precision for USD values (1e18)
    uint256 private constant USD_PRECISION = 1e18;

    /// @notice Chainlink price precision (1e8)
    uint256 private constant CHAINLINK_PRECISION = 1e8;

    // ============ Events ============

    event PriceFeedSet(address indexed token, address feedAddress, uint8 decimals);
    event ManualPriceSet(address indexed token, uint256 price);

    // ============ Errors ============

    error PriceFeedNotSet(address token);
    error StalePrice(address token, uint256 updatedAt);
    error InvalidPrice(address token, int256 price);
    error InvalidFeedAddress();

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Admin Functions ============

    /**
     * @notice Set a Chainlink price feed for a token
     * @param token The token address
     * @param feedAddress The Chainlink aggregator address
     * @param tokenDecimals The token's decimal places
     * @param maxStaleness Maximum acceptable age of price data
     */
    function setPriceFeed(
        address token,
        address feedAddress,
        uint8 tokenDecimals,
        uint256 maxStaleness
    ) external onlyOwner {
        if (feedAddress == address(0)) revert InvalidFeedAddress();

        priceFeeds[token] = PriceFeed({
            feedAddress: feedAddress,
            manualPrice: 0,
            decimals: tokenDecimals,
            maxStaleness: maxStaleness > 0 ? maxStaleness : DEFAULT_STALENESS,
            isManual: false
        });

        emit PriceFeedSet(token, feedAddress, tokenDecimals);
    }

    /**
     * @notice Set a manual price for a token (useful for testing or tokens without feeds)
     * @param token The token address
     * @param price The price in USD (scaled by 1e8, e.g., $2000 = 2000e8)
     * @param tokenDecimals The token's decimal places
     */
    function setManualPrice(address token, uint256 price, uint8 tokenDecimals) external onlyOwner {
        priceFeeds[token] = PriceFeed({
            feedAddress: address(0),
            manualPrice: price,
            decimals: tokenDecimals,
            maxStaleness: type(uint256).max, // Manual prices don't go stale
            isManual: true
        });

        emit ManualPriceSet(token, price);
    }

    // ============ View Functions ============

    /**
     * @inheritdoc IPriceOracle
     */
    function getPrice(address token) public view override returns (uint256 price) {
        PriceFeed storage feed = priceFeeds[token];

        if (feed.decimals == 0 && feed.feedAddress == address(0) && feed.manualPrice == 0) {
            revert PriceFeedNotSet(token);
        }

        if (feed.isManual) {
            return feed.manualPrice;
        }

        // Call Chainlink aggregator
        (, int256 answer, , uint256 updatedAt, ) = IChainlinkAggregator(feed.feedAddress).latestRoundData();

        // Validate price
        if (answer <= 0) {
            revert InvalidPrice(token, answer);
        }

        // Check staleness
        if (block.timestamp - updatedAt > feed.maxStaleness) {
            revert StalePrice(token, updatedAt);
        }

        return uint256(answer);
    }

    /**
     * @inheritdoc IPriceOracle
     * @dev Returns value with 18 decimal precision
     *
     * Calculation: (amount * price * 1e18) / (10^tokenDecimals * 10^8)
     */
    function getValueInUSD(address token, uint256 amount) public view override returns (uint256 value) {
        if (amount == 0) return 0;

        uint256 price = getPrice(token);
        PriceFeed storage feed = priceFeeds[token];

        // Normalize to 18 decimals
        // value = amount * price / 10^(tokenDecimals + 8 - 18)
        uint256 tokenDecimals = feed.decimals;

        // amount is in token decimals, price is in 1e8
        // We want result in 1e18
        return (amount * price * USD_PRECISION) / (10 ** tokenDecimals * CHAINLINK_PRECISION);
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function isPriceFeedValid(address token) public view override returns (bool) {
        PriceFeed storage feed = priceFeeds[token];

        if (feed.decimals == 0 && feed.feedAddress == address(0) && feed.manualPrice == 0) {
            return false;
        }

        if (feed.isManual) {
            return feed.manualPrice > 0;
        }

        try IChainlinkAggregator(feed.feedAddress).latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            if (answer <= 0) return false;
            if (block.timestamp - updatedAt > feed.maxStaleness) return false;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Get the token decimals for a registered token
     * @param token The token address
     * @return The number of decimals
     */
    function getTokenDecimals(address token) external view returns (uint8) {
        return priceFeeds[token].decimals;
    }
}

/**
 * @title IChainlinkAggregator
 * @notice Minimal Chainlink aggregator interface
 */
interface IChainlinkAggregator {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

    function decimals() external view returns (uint8);
}
