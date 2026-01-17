/**
 * Bonding Curve Service
 * Implements constant product AMM formula similar to pump.fun
 *
 * Formula: x * y = k (constant product)
 * Where:
 *   x = SOL reserve (virtual + real)
 *   y = Token reserve (virtual - sold)
 *   k = constant product
 *
 * pump.fun uses:
 *   - Virtual SOL reserve: 30 SOL
 *   - Virtual Token reserve: ~1.073B tokens
 *   - Total supply: 1B tokens
 *   - Migration threshold: 85 SOL real reserve
 */

class BondingCurveService {
  constructor() {
    // Default parameters (similar to pump.fun)
    this.DEFAULT_VIRTUAL_SOL_RESERVE = 30; // 30 SOL
    this.DEFAULT_VIRTUAL_TOKEN_RESERVE = 1073000000; // ~1.073B tokens
    this.DEFAULT_TOTAL_SUPPLY = 1000000000; // 1B tokens
    this.DEFAULT_MIGRATION_THRESHOLD = 85; // 85 SOL
    this.PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 1;
  }

  /**
   * Initialize bonding curve data for a new token
   * @returns {Object} Initial bonding curve state
   */
  initializeBondingCurve() {
    const virtualSolReserve = this.DEFAULT_VIRTUAL_SOL_RESERVE;
    const virtualTokenReserve = this.DEFAULT_VIRTUAL_TOKEN_RESERVE;
    const constantProduct = virtualSolReserve * virtualTokenReserve;

    return {
      virtualSolReserve,
      virtualTokenReserve,
      realSolReserve: 0,
      realTokenReserve: 0,
      constantProduct,
      migrationThreshold: this.DEFAULT_MIGRATION_THRESHOLD,
      isComplete: false,
      completedAt: null,
    };
  }

  /**
   * Calculate current token price
   * @param {Object} bondingCurve - Current bonding curve state
   * @returns {number} Current price in SOL per token
   */
  calculatePrice(bondingCurve) {
    const effectiveSolReserve =
      bondingCurve.virtualSolReserve + bondingCurve.realSolReserve;
    const effectiveTokenReserve =
      bondingCurve.virtualTokenReserve - bondingCurve.realTokenReserve;

    if (effectiveTokenReserve <= 0) {
      return 0;
    }

    // Price = SOL reserve / Token reserve
    return effectiveSolReserve / effectiveTokenReserve;
  }

  /**
   * Calculate tokens received for SOL input (buy)
   * Uses constant product formula: (x + dx) * (y - dy) = k
   * Solving for dy: dy = y - k / (x + dx)
   *
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} solAmount - Amount of SOL to spend
   * @returns {Object} { tokensOut, newPrice, priceImpact, fee }
   */
  calculateBuy(bondingCurve, solAmount) {
    if (solAmount <= 0) {
      throw new Error('SOL amount must be positive');
    }

    if (bondingCurve.isComplete) {
      throw new Error('Bonding curve is complete. Trade on Raydium.');
    }

    // Calculate fee
    const fee = (solAmount * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const solAmountAfterFee = solAmount - fee;

    // Current reserves
    const x = bondingCurve.virtualSolReserve + bondingCurve.realSolReserve;
    const y = bondingCurve.virtualTokenReserve - bondingCurve.realTokenReserve;
    const k = bondingCurve.constantProduct;

    // Calculate tokens out
    // New token reserve = k / (x + dx)
    // Tokens out = y - new token reserve
    const newSolReserve = x + solAmountAfterFee;
    const newTokenReserve = k / newSolReserve;
    const tokensOut = y - newTokenReserve;

    if (tokensOut <= 0) {
      throw new Error('Insufficient liquidity');
    }

    // Calculate price impact
    const oldPrice = x / y;
    const newPrice = newSolReserve / newTokenReserve;
    const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100;

    // Calculate average price
    const averagePrice = solAmountAfterFee / tokensOut;

    return {
      tokensOut,
      solSpent: solAmountAfterFee,
      fee,
      averagePrice,
      newPrice,
      priceImpact,
      newBondingCurve: {
        ...bondingCurve,
        realSolReserve: bondingCurve.realSolReserve + solAmountAfterFee,
        realTokenReserve: bondingCurve.realTokenReserve + tokensOut,
      },
    };
  }

  /**
   * Calculate SOL received for token input (sell)
   * Uses constant product formula: (x - dx) * (y + dy) = k
   * Solving for dx: dx = x - k / (y + dy)
   *
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} tokenAmount - Amount of tokens to sell
   * @returns {Object} { solOut, newPrice, priceImpact, fee }
   */
  calculateSell(bondingCurve, tokenAmount) {
    if (tokenAmount <= 0) {
      throw new Error('Token amount must be positive');
    }

    if (bondingCurve.isComplete) {
      throw new Error('Bonding curve is complete. Trade on Raydium.');
    }

    // Current reserves
    const x = bondingCurve.virtualSolReserve + bondingCurve.realSolReserve;
    const y = bondingCurve.virtualTokenReserve - bondingCurve.realTokenReserve;
    const k = bondingCurve.constantProduct;

    // Check if user has enough tokens in the pool
    if (tokenAmount > bondingCurve.realTokenReserve) {
      throw new Error('Cannot sell more tokens than in circulation');
    }

    // Calculate SOL out
    // New sol reserve = k / (y + dy)
    // SOL out = x - new sol reserve
    const newTokenReserve = y + tokenAmount;
    const newSolReserve = k / newTokenReserve;
    const solOutBeforeFee = x - newSolReserve;

    if (solOutBeforeFee <= 0) {
      throw new Error('Insufficient liquidity');
    }

    // Cannot withdraw more SOL than real reserve
    if (solOutBeforeFee > bondingCurve.realSolReserve) {
      throw new Error('Insufficient SOL liquidity in pool');
    }

    // Calculate fee
    const fee = (solOutBeforeFee * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const solOut = solOutBeforeFee - fee;

    // Calculate price impact
    const oldPrice = x / y;
    const newPrice = newSolReserve / newTokenReserve;
    const priceImpact = ((oldPrice - newPrice) / oldPrice) * 100;

    // Calculate average price
    const averagePrice = solOut / tokenAmount;

    return {
      solOut,
      tokensSold: tokenAmount,
      fee,
      averagePrice,
      newPrice,
      priceImpact,
      newBondingCurve: {
        ...bondingCurve,
        realSolReserve: bondingCurve.realSolReserve - solOutBeforeFee,
        realTokenReserve: bondingCurve.realTokenReserve - tokenAmount,
      },
    };
  }

  /**
   * Calculate tokens required for a specific SOL amount (reverse buy)
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} targetSolSpend - Target SOL to spend
   * @returns {Object} Calculation result
   */
  calculateTokensForSol(bondingCurve, targetSolSpend) {
    return this.calculateBuy(bondingCurve, targetSolSpend);
  }

  /**
   * Calculate SOL required for a specific token amount
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} targetTokens - Target tokens to receive
   * @returns {Object} { solRequired, fee }
   */
  calculateSolForTokens(bondingCurve, targetTokens) {
    if (targetTokens <= 0) {
      throw new Error('Token amount must be positive');
    }

    if (bondingCurve.isComplete) {
      throw new Error('Bonding curve is complete. Trade on Raydium.');
    }

    const x = bondingCurve.virtualSolReserve + bondingCurve.realSolReserve;
    const y = bondingCurve.virtualTokenReserve - bondingCurve.realTokenReserve;
    const k = bondingCurve.constantProduct;

    if (targetTokens >= y) {
      throw new Error('Insufficient token liquidity');
    }

    // Calculate required SOL
    // New token reserve = y - targetTokens
    // New sol reserve = k / new token reserve
    // SOL required = new sol reserve - x
    const newTokenReserve = y - targetTokens;
    const newSolReserve = k / newTokenReserve;
    const solRequiredBeforeFee = newSolReserve - x;

    // Add fee
    const solRequired = solRequiredBeforeFee / (1 - this.PLATFORM_FEE_PERCENTAGE / 100);
    const fee = solRequired - solRequiredBeforeFee;

    return {
      solRequired,
      fee,
      tokensOut: targetTokens,
    };
  }

  /**
   * Calculate market cap
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} circulatingSupply - Current circulating supply
   * @returns {number} Market cap in SOL
   */
  calculateMarketCap(bondingCurve, circulatingSupply) {
    const price = this.calculatePrice(bondingCurve);
    return price * circulatingSupply;
  }

  /**
   * Calculate fully diluted valuation
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number} totalSupply - Total token supply
   * @returns {number} FDV in SOL
   */
  calculateFDV(bondingCurve, totalSupply = this.DEFAULT_TOTAL_SUPPLY) {
    const price = this.calculatePrice(bondingCurve);
    return price * totalSupply;
  }

  /**
   * Calculate migration progress percentage
   * @param {Object} bondingCurve - Current bonding curve state
   * @returns {number} Progress percentage (0-100)
   */
  calculateMigrationProgress(bondingCurve) {
    if (bondingCurve.isComplete) {
      return 100;
    }
    return Math.min(
      100,
      (bondingCurve.realSolReserve / bondingCurve.migrationThreshold) * 100
    );
  }

  /**
   * Check if bonding curve should be marked as complete
   * @param {Object} bondingCurve - Current bonding curve state
   * @returns {boolean}
   */
  shouldMigrate(bondingCurve) {
    return bondingCurve.realSolReserve >= bondingCurve.migrationThreshold;
  }

  /**
   * Get price at specific market cap
   * @param {number} targetMarketCap - Target market cap in SOL
   * @param {number} circulatingSupply - Circulating supply
   * @returns {number} Price at target market cap
   */
  getPriceAtMarketCap(targetMarketCap, circulatingSupply) {
    return targetMarketCap / circulatingSupply;
  }

  /**
   * Simulate multiple buys to show price trajectory
   * @param {Object} bondingCurve - Current bonding curve state
   * @param {number[]} solAmounts - Array of SOL amounts to simulate
   * @returns {Array} Array of simulation results
   */
  simulateBuys(bondingCurve, solAmounts) {
    const results = [];
    let currentCurve = { ...bondingCurve };

    for (const amount of solAmounts) {
      try {
        const result = this.calculateBuy(currentCurve, amount);
        results.push({
          solIn: amount,
          ...result,
        });
        currentCurve = result.newBondingCurve;
      } catch (error) {
        results.push({
          solIn: amount,
          error: error.message,
        });
        break;
      }
    }

    return results;
  }

  /**
   * Calculate slippage for a trade
   * @param {number} expectedPrice - Expected price
   * @param {number} actualPrice - Actual execution price
   * @returns {number} Slippage percentage
   */
  calculateSlippage(expectedPrice, actualPrice) {
    return Math.abs(((actualPrice - expectedPrice) / expectedPrice) * 100);
  }

  /**
   * Validate a trade won't exceed slippage tolerance
   * @param {Object} tradeResult - Result from calculateBuy or calculateSell
   * @param {number} maxSlippage - Maximum slippage percentage
   * @param {number} expectedPrice - Expected price
   * @returns {boolean}
   */
  validateSlippage(tradeResult, maxSlippage, expectedPrice) {
    const slippage = this.calculateSlippage(expectedPrice, tradeResult.averagePrice);
    return slippage <= maxSlippage;
  }
}

// Export singleton instance
module.exports = new BondingCurveService();
