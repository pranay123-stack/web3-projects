/**
 * Bonding curve calculation utilities for the pump.fun clone
 *
 * The bonding curve uses a constant product formula (x * y = k) similar to Uniswap.
 * This creates a price that increases as more tokens are bought.
 *
 * Key concepts:
 * - Virtual reserves: Used to calculate the current price and bonding curve position
 * - Real reserves: Actual SOL/tokens locked in the curve
 * - The curve graduates when market cap reaches the graduation threshold
 */

import {
  GRADUATION_MARKET_CAP,
  LAMPORTS_PER_SOL,
  TOKEN_DECIMALS,
  INITIAL_VIRTUAL_SOL_RESERVES,
  INITIAL_VIRTUAL_TOKEN_RESERVES,
  TOTAL_TOKEN_SUPPLY,
  TRADE_FEE_BPS,
} from '../constants';

/**
 * Reserves structure for bonding curve calculations
 */
export interface Reserves {
  /** Virtual SOL reserves in lamports */
  virtualSolReserves: bigint;
  /** Virtual token reserves in smallest units */
  virtualTokenReserves: bigint;
  /** Real SOL reserves in lamports */
  realSolReserves: bigint;
  /** Real token reserves */
  realTokenReserves: bigint;
}

/**
 * Calculates the current price per token in SOL
 * Uses the constant product formula: price = virtualSolReserves / virtualTokenReserves
 *
 * @param virtualSolReserves - Virtual SOL reserves in lamports
 * @param virtualTokenReserves - Virtual token reserves
 * @returns Price per token in SOL
 *
 * @example
 * const price = calculatePrice(30_000_000_000n, 1_073_000_000_000_000n);
 * console.log(price); // ~0.000000028 SOL per token
 */
export function calculatePrice(
  virtualSolReserves: bigint,
  virtualTokenReserves: bigint
): number {
  if (virtualTokenReserves === 0n) {
    return 0;
  }

  // Convert to numbers for floating point division
  const solReserves = Number(virtualSolReserves) / LAMPORTS_PER_SOL;
  const tokenReserves = Number(virtualTokenReserves) / Math.pow(10, TOKEN_DECIMALS);

  return solReserves / tokenReserves;
}

/**
 * Calculates the amount of tokens received for a given SOL input
 * Uses the constant product formula with fee consideration
 *
 * Formula: tokensOut = virtualTokenReserves - (k / (virtualSolReserves + solAmountAfterFee))
 * Where k = virtualSolReserves * virtualTokenReserves
 *
 * @param solAmount - Amount of SOL to spend (in lamports)
 * @param reserves - Current bonding curve reserves
 * @param includeFee - Whether to deduct trading fee (default: true)
 * @returns Amount of tokens to receive
 *
 * @example
 * const tokensOut = calculateBuyReturn(1_000_000_000n, reserves); // Buy with 1 SOL
 */
export function calculateBuyReturn(
  solAmount: bigint,
  reserves: Reserves,
  includeFee: boolean = true
): bigint {
  if (solAmount <= 0n) {
    return 0n;
  }

  // Calculate fee
  const fee = includeFee ? (solAmount * BigInt(TRADE_FEE_BPS)) / 10000n : 0n;
  const solAmountAfterFee = solAmount - fee;

  // k = x * y (constant product)
  const k = reserves.virtualSolReserves * reserves.virtualTokenReserves;

  // New virtual SOL reserves after trade
  const newVirtualSolReserves = reserves.virtualSolReserves + solAmountAfterFee;

  // New virtual token reserves (k / new_sol_reserves)
  const newVirtualTokenReserves = k / newVirtualSolReserves;

  // Tokens out = old token reserves - new token reserves
  const tokensOut = reserves.virtualTokenReserves - newVirtualTokenReserves;

  // Ensure we don't return more than available
  if (tokensOut > reserves.realTokenReserves) {
    return reserves.realTokenReserves;
  }

  return tokensOut;
}

/**
 * Calculates the amount of SOL received for selling tokens
 *
 * Formula: solOut = virtualSolReserves - (k / (virtualTokenReserves + tokenAmount))
 *
 * @param tokenAmount - Amount of tokens to sell
 * @param reserves - Current bonding curve reserves
 * @param includeFee - Whether to deduct trading fee (default: true)
 * @returns Amount of SOL to receive (in lamports)
 *
 * @example
 * const solOut = calculateSellReturn(1_000_000_000_000n, reserves); // Sell 1M tokens
 */
export function calculateSellReturn(
  tokenAmount: bigint,
  reserves: Reserves,
  includeFee: boolean = true
): bigint {
  if (tokenAmount <= 0n) {
    return 0n;
  }

  // k = x * y (constant product)
  const k = reserves.virtualSolReserves * reserves.virtualTokenReserves;

  // New virtual token reserves after trade
  const newVirtualTokenReserves = reserves.virtualTokenReserves + tokenAmount;

  // New virtual SOL reserves (k / new_token_reserves)
  const newVirtualSolReserves = k / newVirtualTokenReserves;

  // SOL out = old SOL reserves - new SOL reserves
  let solOut = reserves.virtualSolReserves - newVirtualSolReserves;

  // Ensure we don't return more than available
  if (solOut > reserves.realSolReserves) {
    solOut = reserves.realSolReserves;
  }

  // Deduct fee
  if (includeFee) {
    const fee = (solOut * BigInt(TRADE_FEE_BPS)) / 10000n;
    solOut = solOut - fee;
  }

  return solOut;
}

/**
 * Calculates the current market cap in SOL
 * Market cap = current price * total supply
 *
 * @param reserves - Current bonding curve reserves
 * @returns Market cap in SOL
 *
 * @example
 * const marketCap = calculateMarketCap(reserves); // e.g., 50 SOL
 */
export function calculateMarketCap(reserves: Reserves): number {
  const price = calculatePrice(
    reserves.virtualSolReserves,
    reserves.virtualTokenReserves
  );

  const totalSupply = TOTAL_TOKEN_SUPPLY / Math.pow(10, TOKEN_DECIMALS);
  return price * totalSupply;
}

/**
 * Calculates the progress towards graduation as a percentage (0-100)
 *
 * @param marketCap - Current market cap in SOL
 * @param graduationThreshold - Market cap threshold for graduation (default: GRADUATION_MARKET_CAP)
 * @returns Progress percentage (0-100)
 *
 * @example
 * const progress = calculateProgress(40); // If graduation is at 69 SOL, returns ~58%
 */
export function calculateProgress(
  marketCap: number,
  graduationThreshold: number = GRADUATION_MARKET_CAP
): number {
  if (graduationThreshold <= 0) {
    return 100;
  }

  const progress = (marketCap / graduationThreshold) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Calculates price impact for a trade
 *
 * @param solAmount - SOL amount for buy, or token amount for sell
 * @param reserves - Current reserves
 * @param isBuy - Whether this is a buy or sell
 * @returns Price impact as a percentage
 */
export function calculatePriceImpact(
  amount: bigint,
  reserves: Reserves,
  isBuy: boolean
): number {
  const currentPrice = calculatePrice(
    reserves.virtualSolReserves,
    reserves.virtualTokenReserves
  );

  // Simulate the trade
  let newVirtualSolReserves: bigint;
  let newVirtualTokenReserves: bigint;

  if (isBuy) {
    const tokensOut = calculateBuyReturn(amount, reserves, false);
    newVirtualSolReserves = reserves.virtualSolReserves + amount;
    newVirtualTokenReserves = reserves.virtualTokenReserves - tokensOut;
  } else {
    const solOut = calculateSellReturn(amount, reserves, false);
    newVirtualSolReserves = reserves.virtualSolReserves - solOut;
    newVirtualTokenReserves = reserves.virtualTokenReserves + amount;
  }

  const newPrice = calculatePrice(newVirtualSolReserves, newVirtualTokenReserves);

  // Calculate price impact
  const priceChange = Math.abs(newPrice - currentPrice);
  const priceImpact = (priceChange / currentPrice) * 100;

  return priceImpact;
}

/**
 * Calculates the SOL amount needed to buy a specific amount of tokens
 *
 * @param tokenAmount - Desired amount of tokens
 * @param reserves - Current reserves
 * @param includeFee - Whether to include fee in calculation
 * @returns SOL amount needed (in lamports)
 */
export function calculateSolForTokens(
  tokenAmount: bigint,
  reserves: Reserves,
  includeFee: boolean = true
): bigint {
  if (tokenAmount <= 0n) {
    return 0n;
  }

  // k = x * y
  const k = reserves.virtualSolReserves * reserves.virtualTokenReserves;

  // New token reserves after buying
  const newTokenReserves = reserves.virtualTokenReserves - tokenAmount;

  if (newTokenReserves <= 0n) {
    // Cannot buy this many tokens
    return BigInt(Number.MAX_SAFE_INTEGER);
  }

  // New SOL reserves needed
  const newSolReserves = k / newTokenReserves;

  // SOL needed = new reserves - current reserves
  let solNeeded = newSolReserves - reserves.virtualSolReserves;

  // Add fee
  if (includeFee) {
    // solNeeded is after fee, so we need to calculate the pre-fee amount
    // solAfterFee = solBefore * (1 - fee)
    // solBefore = solAfterFee / (1 - fee)
    solNeeded = (solNeeded * 10000n) / (10000n - BigInt(TRADE_FEE_BPS));
  }

  return solNeeded;
}

/**
 * Checks if the bonding curve is ready for graduation
 *
 * @param reserves - Current reserves
 * @returns True if ready for graduation
 */
export function isReadyForGraduation(reserves: Reserves): boolean {
  const marketCap = calculateMarketCap(reserves);
  return marketCap >= GRADUATION_MARKET_CAP;
}

/**
 * Creates initial reserves for a new token
 *
 * @returns Initial reserve state
 */
export function createInitialReserves(): Reserves {
  return {
    virtualSolReserves: INITIAL_VIRTUAL_SOL_RESERVES,
    virtualTokenReserves: INITIAL_VIRTUAL_TOKEN_RESERVES,
    realSolReserves: 0n,
    realTokenReserves: INITIAL_VIRTUAL_TOKEN_RESERVES,
  };
}

/**
 * Simulates a buy and returns the new reserve state
 *
 * @param solAmount - SOL to spend
 * @param reserves - Current reserves
 * @returns New reserve state after the buy
 */
export function simulateBuy(
  solAmount: bigint,
  reserves: Reserves
): { newReserves: Reserves; tokensReceived: bigint; fee: bigint } {
  const fee = (solAmount * BigInt(TRADE_FEE_BPS)) / 10000n;
  const solAfterFee = solAmount - fee;
  const tokensReceived = calculateBuyReturn(solAmount, reserves);

  return {
    newReserves: {
      virtualSolReserves: reserves.virtualSolReserves + solAfterFee,
      virtualTokenReserves: reserves.virtualTokenReserves - tokensReceived,
      realSolReserves: reserves.realSolReserves + solAfterFee,
      realTokenReserves: reserves.realTokenReserves - tokensReceived,
    },
    tokensReceived,
    fee,
  };
}

/**
 * Simulates a sell and returns the new reserve state
 *
 * @param tokenAmount - Tokens to sell
 * @param reserves - Current reserves
 * @returns New reserve state after the sell
 */
export function simulateSell(
  tokenAmount: bigint,
  reserves: Reserves
): { newReserves: Reserves; solReceived: bigint; fee: bigint } {
  const solBeforeFee = calculateSellReturn(tokenAmount, reserves, false);
  const fee = (solBeforeFee * BigInt(TRADE_FEE_BPS)) / 10000n;
  const solReceived = solBeforeFee - fee;

  return {
    newReserves: {
      virtualSolReserves: reserves.virtualSolReserves - solBeforeFee,
      virtualTokenReserves: reserves.virtualTokenReserves + tokenAmount,
      realSolReserves: reserves.realSolReserves - solBeforeFee,
      realTokenReserves: reserves.realTokenReserves + tokenAmount,
    },
    solReceived,
    fee,
  };
}
