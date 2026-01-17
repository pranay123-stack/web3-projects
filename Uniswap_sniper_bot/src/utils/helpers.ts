import { formatEther, formatUnits, parseEther, parseUnits, keccak256, toUtf8Bytes } from 'ethers';
import { TokenInfo, V4PoolKey } from '../types';

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

export function formatEthAmount(amount: bigint): string {
  return formatEther(amount);
}

export function parseEthAmount(amount: string): bigint {
  return parseEther(amount);
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenTxHash(hash: string, chars: number = 6): string {
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

// ============================================
// PRICE CALCULATIONS
// ============================================

export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number): number {
  const Q96 = BigInt(2) ** BigInt(96);
  const price = (Number(sqrtPriceX96) / Number(Q96)) ** 2;
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  return price * decimalAdjustment;
}

export function priceToSqrtPriceX96(price: number, token0Decimals: number, token1Decimals: number): bigint {
  const Q96 = BigInt(2) ** BigInt(96);
  const decimalAdjustment = 10 ** (token1Decimals - token0Decimals);
  const adjustedPrice = price * decimalAdjustment;
  const sqrtPrice = Math.sqrt(adjustedPrice);
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

export function tickToPrice(tick: number, token0Decimals: number, token1Decimals: number): number {
  const price = 1.0001 ** tick;
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  return price * decimalAdjustment;
}

export function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// ============================================
// SLIPPAGE CALCULATIONS
// ============================================

export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number): bigint {
  const slippageFactor = BigInt(10000 - slippagePercent * 100);
  return (amountOut * slippageFactor) / BigInt(10000);
}

export function calculateMaxAmountIn(amountIn: bigint, slippagePercent: number): bigint {
  const slippageFactor = BigInt(10000 + slippagePercent * 100);
  return (amountIn * slippageFactor) / BigInt(10000);
}

// ============================================
// UNISWAP V4 UTILITIES
// ============================================

export function computePoolId(poolKey: V4PoolKey): string {
  const encoded = encodePoolKey(poolKey);
  return keccak256(encoded);
}

export function encodePoolKey(poolKey: V4PoolKey): string {
  // ABI encode the pool key
  const { currency0, currency1, fee, tickSpacing, hooks } = poolKey;
  // Simple encoding for pool key
  return keccak256(
    toUtf8Bytes(
      `${currency0.toLowerCase()}${currency1.toLowerCase()}${fee}${tickSpacing}${hooks.toLowerCase()}`
    )
  );
}

export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

// ============================================
// GAS UTILITIES
// ============================================

export function gweiToWei(gwei: number): bigint {
  return parseUnits(gwei.toString(), 'gwei');
}

export function weiToGwei(wei: bigint): number {
  return parseFloat(formatUnits(wei, 'gwei'));
}

export function calculateGasCost(gasUsed: bigint, gasPrice: bigint): bigint {
  return gasUsed * gasPrice;
}

// ============================================
// TIME UTILITIES
// ============================================

export function getDeadline(minutes: number = 20): number {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isWETH(address: string, wethAddress: string): boolean {
  return address.toLowerCase() === wethAddress.toLowerCase();
}

// ============================================
// PERCENTAGE CALCULATIONS
// ============================================

export function calculatePercentage(value: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0;
  return Number((value * BigInt(10000)) / total) / 100;
}

export function calculatePnL(entryPrice: bigint, currentPrice: bigint): number {
  if (entryPrice === BigInt(0)) return 0;
  return Number(((currentPrice - entryPrice) * BigInt(10000)) / entryPrice) / 100;
}

// ============================================
// RETRY UTILITIES
// ============================================

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }

  throw lastError;
}

// ============================================
// UNIQUE ID GENERATION
// ============================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
