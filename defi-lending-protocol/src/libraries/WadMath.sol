// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WadMath
 * @notice Fixed-point arithmetic library for 18-decimal precision
 * @dev Used for interest rate and share calculations
 */
library WadMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant HALF_WAD = 0.5e18;
    uint256 internal constant RAY = 1e27;
    uint256 internal constant HALF_RAY = 0.5e27;
    uint256 internal constant WAD_RAY_RATIO = 1e9;

    /**
     * @notice Multiplies two wad numbers
     * @param a First number (wad)
     * @param b Second number (wad)
     * @return Result of a * b / WAD
     */
    function wadMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) return 0;
        return (a * b + HALF_WAD) / WAD;
    }

    /**
     * @notice Divides two wad numbers
     * @param a Numerator (wad)
     * @param b Denominator (wad)
     * @return Result of a * WAD / b
     */
    function wadDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "WadMath: division by zero");
        return (a * WAD + b / 2) / b;
    }

    /**
     * @notice Converts a wad to ray
     * @param a The wad value
     * @return The value in ray
     */
    function wadToRay(uint256 a) internal pure returns (uint256) {
        return a * WAD_RAY_RATIO;
    }

    /**
     * @notice Converts a ray to wad
     * @param a The ray value
     * @return The value in wad
     */
    function rayToWad(uint256 a) internal pure returns (uint256) {
        return (a + HALF_RAY / WAD_RAY_RATIO) / WAD_RAY_RATIO;
    }

    /**
     * @notice Multiplies two ray numbers
     * @param a First number (ray)
     * @param b Second number (ray)
     * @return Result of a * b / RAY
     */
    function rayMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) return 0;
        return (a * b + HALF_RAY) / RAY;
    }

    /**
     * @notice Divides two ray numbers
     * @param a Numerator (ray)
     * @param b Denominator (ray)
     * @return Result of a * RAY / b
     */
    function rayDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "WadMath: division by zero");
        return (a * RAY + b / 2) / b;
    }

    /**
     * @notice Calculate compound interest using Taylor series approximation
     * @param rate The per-second interest rate (ray)
     * @param lastUpdateTimestamp The last update timestamp
     * @param currentTimestamp The current timestamp
     * @return The compounded interest factor (ray)
     */
    function calculateCompoundedInterest(
        uint256 rate,
        uint40 lastUpdateTimestamp,
        uint256 currentTimestamp
    ) internal pure returns (uint256) {
        uint256 exp = currentTimestamp - lastUpdateTimestamp;
        if (exp == 0) return RAY;
        if (rate == 0) return RAY;

        uint256 expMinusOne = exp - 1;
        uint256 expMinusTwo = exp > 2 ? exp - 2 : 0;

        // Taylor series approximation for (1 + rate)^exp
        // = 1 + rate*exp + (rate^2 * exp * (exp-1)) / 2 + (rate^3 * exp * (exp-1) * (exp-2)) / 6
        uint256 basePowerTwo = rayMul(rate, rate);
        uint256 basePowerThree = rayMul(basePowerTwo, rate);

        uint256 secondTerm = (rate * exp);
        uint256 thirdTerm = rayMul(basePowerTwo, (exp * expMinusOne) / 2);
        uint256 fourthTerm = rayMul(basePowerThree, (exp * expMinusOne * expMinusTwo) / 6);

        return RAY + secondTerm + thirdTerm + fourthTerm;
    }

    /**
     * @notice Calculate linear interest (simple interest)
     * @param rate The per-second interest rate (ray)
     * @param lastUpdateTimestamp The last update timestamp
     * @param currentTimestamp The current timestamp
     * @return The linear interest factor (ray)
     */
    function calculateLinearInterest(
        uint256 rate,
        uint40 lastUpdateTimestamp,
        uint256 currentTimestamp
    ) internal pure returns (uint256) {
        uint256 exp = currentTimestamp - lastUpdateTimestamp;
        return RAY + (rate * exp);
    }
}
