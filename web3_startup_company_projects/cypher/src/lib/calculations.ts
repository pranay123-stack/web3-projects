import { ILCalculatorInput, ILCalculatorResult } from '@/types';
import { DAYS_IN_YEAR } from './constants';

/**
 * Calculate the price at a given tick
 * price = 1.0001^tick
 */
export function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

/**
 * Calculate the tick for a given price
 * tick = log(price) / log(1.0001)
 */
export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * Calculate sqrt price from tick
 * sqrtPrice = sqrt(1.0001^tick) = 1.0001^(tick/2)
 */
export function tickToSqrtPrice(tick: number): number {
  return Math.pow(1.0001, tick / 2);
}

/**
 * Calculate impermanent loss for concentrated liquidity
 * This is more complex than standard AMM IL due to the price range
 */
export function calculateConcentratedIL(input: ILCalculatorInput): ILCalculatorResult {
  const {
    entryPrice,
    currentPrice,
    lowerRangePrice,
    upperRangePrice,
    initialInvestment,
  } = input;

  // Check if price is in range
  const inRange = currentPrice >= lowerRangePrice && currentPrice <= upperRangePrice;

  // Calculate sqrt prices
  const sqrtEntryPrice = Math.sqrt(entryPrice);
  const sqrtCurrentPrice = Math.sqrt(currentPrice);
  const sqrtLower = Math.sqrt(lowerRangePrice);
  const sqrtUpper = Math.sqrt(upperRangePrice);

  // Calculate initial token amounts at entry
  // For concentrated liquidity: L = sqrt(k) where k = x * y
  // We need to solve for liquidity first
  let L: number;
  let initialToken0: number;
  let initialToken1: number;

  const halfInvestment = initialInvestment / 2;

  if (entryPrice <= lowerRangePrice) {
    // All in token0
    initialToken0 = initialInvestment / entryPrice;
    initialToken1 = 0;
    L = initialToken0 * sqrtLower * sqrtUpper / (sqrtUpper - sqrtLower);
  } else if (entryPrice >= upperRangePrice) {
    // All in token1
    initialToken0 = 0;
    initialToken1 = initialInvestment;
    L = initialToken1 / (sqrtUpper - sqrtLower);
  } else {
    // In range - calculate based on 50/50 value split at entry price
    // Use the concentrated liquidity formulas
    L = halfInvestment / (sqrtEntryPrice - sqrtLower + (sqrtUpper - sqrtEntryPrice) / sqrtEntryPrice * sqrtEntryPrice);
    initialToken0 = L * (1/sqrtEntryPrice - 1/sqrtUpper);
    initialToken1 = L * (sqrtEntryPrice - sqrtLower);
  }

  // Calculate current token amounts
  let currentToken0: number;
  let currentToken1: number;

  if (currentPrice <= lowerRangePrice) {
    // All in token0
    currentToken0 = L * (1/sqrtLower - 1/sqrtUpper);
    currentToken1 = 0;
  } else if (currentPrice >= upperRangePrice) {
    // All in token1
    currentToken0 = 0;
    currentToken1 = L * (sqrtUpper - sqrtLower);
  } else {
    // In range
    currentToken0 = L * (1/sqrtCurrentPrice - 1/sqrtUpper);
    currentToken1 = L * (sqrtCurrentPrice - sqrtLower);
  }

  // Calculate current position value
  const currentPositionValue = currentToken0 * currentPrice + currentToken1;

  // Calculate HODL value (if we just held the initial amounts)
  const hodlValue = initialInvestment * (currentPrice / entryPrice + 1) / 2;

  // Calculate impermanent loss
  const impermanentLossUSD = currentPositionValue - hodlValue;
  const impermanentLossPercentage = (impermanentLossUSD / hodlValue) * 100;

  return {
    impermanentLossPercentage,
    impermanentLossUSD,
    currentPositionValue,
    hodlValue,
    token0Amount: currentToken0,
    token1Amount: currentToken1,
    inRange,
  };
}

/**
 * Calculate simple APY from APR
 * APY = (1 + APR/n)^n - 1
 */
export function aprToApy(apr: number, compoundingPeriods: number = 365): number {
  return (Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1) * 100;
}

/**
 * Calculate APR from fees
 * APR = (fees * 365 / TVL) * 100
 */
export function calculateAPR(fees24h: number, tvl: number): number {
  if (tvl === 0) return 0;
  return (fees24h * DAYS_IN_YEAR / tvl) * 100;
}

/**
 * Calculate APY from fees
 */
export function calculateAPY(fees24h: number, tvl: number): number {
  const apr = calculateAPR(fees24h, tvl);
  return aprToApy(apr / 100); // Convert percentage to decimal for calculation
}

/**
 * Calculate fee amount from swap
 */
export function calculateSwapFee(amount: number, feeTier: number): number {
  return amount * (feeTier / 10000);
}

/**
 * Calculate price impact for a swap
 * This is a simplified model
 */
export function calculatePriceImpact(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeTier: number
): number {
  const amountInWithFee = amountIn * (1 - feeTier / 10000);
  const newReserveIn = reserveIn + amountInWithFee;
  const newReserveOut = (reserveIn * reserveOut) / newReserveIn;
  const amountOut = reserveOut - newReserveOut;

  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;

  return ((spotPrice - executionPrice) / spotPrice) * 100;
}

/**
 * Calculate liquidity value in range
 */
export function calculateLiquidityValue(
  liquidity: number,
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number,
  token0Price: number,
  token1Price: number
): { token0Amount: number; token1Amount: number; valueUSD: number } {
  const sqrtPrice = Number(sqrtPriceX96) / Number(BigInt(2) ** BigInt(96));
  const sqrtLower = tickToSqrtPrice(tickLower);
  const sqrtUpper = tickToSqrtPrice(tickUpper);

  let token0Amount: number;
  let token1Amount: number;

  const currentTick = Math.floor(Math.log(sqrtPrice ** 2) / Math.log(1.0001));

  if (currentTick < tickLower) {
    token0Amount = liquidity * (1/sqrtLower - 1/sqrtUpper);
    token1Amount = 0;
  } else if (currentTick >= tickUpper) {
    token0Amount = 0;
    token1Amount = liquidity * (sqrtUpper - sqrtLower);
  } else {
    token0Amount = liquidity * (1/sqrtPrice - 1/sqrtUpper);
    token1Amount = liquidity * (sqrtPrice - sqrtLower);
  }

  const valueUSD = token0Amount * token0Price + token1Amount * token1Price;

  return { token0Amount, token1Amount, valueUSD };
}

/**
 * Calculate the percentage of liquidity in a price range
 */
export function calculateRangePercentage(
  lowerPrice: number,
  upperPrice: number,
  currentPrice: number
): number {
  if (currentPrice <= lowerPrice) return 0;
  if (currentPrice >= upperPrice) return 100;
  return ((currentPrice - lowerPrice) / (upperPrice - lowerPrice)) * 100;
}

/**
 * Generate historical data points with realistic random walk
 */
export function generateHistoricalData(
  startValue: number,
  days: number,
  volatility: number = 0.05,
  trend: number = 0.001
): { timestamp: number; value: number }[] {
  const data: { timestamp: number; value: number }[] = [];
  let currentValue = startValue;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    currentValue = currentValue * (1 + randomChange + trend);
    data.push({ timestamp, value: Math.max(0, currentValue) });
  }

  return data;
}
