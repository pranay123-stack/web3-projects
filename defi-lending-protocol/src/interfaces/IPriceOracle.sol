// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 * @dev Provides USD prices for assets (scaled by 1e8 to match Chainlink format)
 */
interface IPriceOracle {
    /**
     * @notice Get the price of an asset in USD
     * @param token The token address
     * @return price The price scaled by 1e8 (e.g., $2000 = 2000e8)
     */
    function getPrice(address token) external view returns (uint256 price);

    /**
     * @notice Get the value of an amount of tokens in USD
     * @param token The token address
     * @param amount The amount of tokens (in token decimals)
     * @return value The USD value scaled by 1e18
     */
    function getValueInUSD(address token, uint256 amount) external view returns (uint256 value);

    /**
     * @notice Check if price feed exists and is valid for a token
     * @param token The token address
     * @return True if the price feed is valid
     */
    function isPriceFeedValid(address token) external view returns (bool);
}
