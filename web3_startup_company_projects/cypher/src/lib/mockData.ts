import { Pool, Position, Token, PoolHistoricalData, SwapEvent, ProtocolStats, FeeTierDistribution } from '@/types';
import { TOKEN_ADDRESSES, FEE_TIERS } from './constants';

// Token definitions
export const TOKENS: Record<string, Token> = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: TOKEN_ADDRESSES.ETH,
    decimals: 18,
    logoUrl: '/tokens/eth.svg',
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: TOKEN_ADDRESSES.WETH,
    decimals: 18,
    logoUrl: '/tokens/weth.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKEN_ADDRESSES.USDC,
    decimals: 6,
    logoUrl: '/tokens/usdc.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: TOKEN_ADDRESSES.USDT,
    decimals: 6,
    logoUrl: '/tokens/usdt.svg',
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: TOKEN_ADDRESSES.WBTC,
    decimals: 8,
    logoUrl: '/tokens/wbtc.svg',
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: TOKEN_ADDRESSES.DAI,
    decimals: 18,
    logoUrl: '/tokens/dai.svg',
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    address: TOKEN_ADDRESSES.LINK,
    decimals: 18,
    logoUrl: '/tokens/link.svg',
  },
  UNI: {
    symbol: 'UNI',
    name: 'Uniswap',
    address: TOKEN_ADDRESSES.UNI,
    decimals: 18,
    logoUrl: '/tokens/uni.svg',
  },
  AAVE: {
    symbol: 'AAVE',
    name: 'Aave',
    address: TOKEN_ADDRESSES.AAVE,
    decimals: 18,
    logoUrl: '/tokens/aave.svg',
  },
  CRV: {
    symbol: 'CRV',
    name: 'Curve DAO Token',
    address: TOKEN_ADDRESSES.CRV,
    decimals: 18,
    logoUrl: '/tokens/crv.svg',
  },
  MKR: {
    symbol: 'MKR',
    name: 'Maker',
    address: TOKEN_ADDRESSES.MKR,
    decimals: 18,
    logoUrl: '/tokens/mkr.svg',
  },
};

// Generate random address
function randomAddress(): string {
  return `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

// Generate random liquidity string
function randomLiquidity(): string {
  return BigInt(Math.floor(Math.random() * 1e20) + 1e18).toString();
}

// Pool definitions
export const MOCK_POOLS: Pool[] = [
  {
    id: 'eth-usdc-30',
    address: randomAddress(),
    token0: TOKENS.WETH,
    token1: TOKENS.USDC,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 125_432_567,
    volume24h: 45_234_890,
    volume7d: 312_456_789,
    fees24h: 135_704,
    fees7d: 937_370,
    apy: 39.52,
    apr: 33.76,
    tickSpacing: 60,
    currentTick: 201250,
    currentPrice: 2456.78,
    priceChange24h: 2.34,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '1234567890123456789012345678',
  },
  {
    id: 'wbtc-eth-30',
    address: randomAddress(),
    token0: TOKENS.WBTC,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 89_234_123,
    volume24h: 23_456_789,
    volume7d: 178_234_567,
    fees24h: 70_370,
    fees7d: 534_703,
    apy: 28.78,
    apr: 25.21,
    tickSpacing: 60,
    currentTick: 55890,
    currentPrice: 17.23,
    priceChange24h: -0.89,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '2345678901234567890123456789',
  },
  {
    id: 'usdc-usdt-1',
    address: randomAddress(),
    token0: TOKENS.USDC,
    token1: TOKENS.USDT,
    feeTier: FEE_TIERS.LOWEST,
    tvl: 234_567_890,
    volume24h: 89_012_345,
    volume7d: 623_456_789,
    fees24h: 8_901,
    fees7d: 62_345,
    apy: 1.38,
    apr: 1.37,
    tickSpacing: 1,
    currentTick: 0,
    currentPrice: 0.9998,
    priceChange24h: 0.01,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '79228162514264337593543950336',
  },
  {
    id: 'eth-dai-30',
    address: randomAddress(),
    token0: TOKENS.WETH,
    token1: TOKENS.DAI,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 45_678_901,
    volume24h: 12_345_678,
    volume7d: 87_654_321,
    fees24h: 37_037,
    fees7d: 262_962,
    apy: 29.59,
    apr: 25.89,
    tickSpacing: 60,
    currentTick: 201100,
    currentPrice: 2452.34,
    priceChange24h: 2.12,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '3456789012345678901234567890',
  },
  {
    id: 'link-eth-30',
    address: randomAddress(),
    token0: TOKENS.LINK,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 23_456_789,
    volume24h: 5_678_901,
    volume7d: 42_345_678,
    fees24h: 17_036,
    fees7d: 127_037,
    apy: 26.51,
    apr: 23.47,
    tickSpacing: 60,
    currentTick: -83450,
    currentPrice: 0.00612,
    priceChange24h: -1.23,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '4567890123456789012345678901',
  },
  {
    id: 'uni-eth-30',
    address: randomAddress(),
    token0: TOKENS.UNI,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 18_765_432,
    volume24h: 4_321_098,
    volume7d: 31_234_567,
    fees24h: 12_963,
    fees7d: 93_703,
    apy: 25.23,
    apr: 22.43,
    tickSpacing: 60,
    currentTick: -72890,
    currentPrice: 0.00356,
    priceChange24h: 3.45,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '5678901234567890123456789012',
  },
  {
    id: 'aave-eth-30',
    address: randomAddress(),
    token0: TOKENS.AAVE,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 12_345_678,
    volume24h: 2_345_678,
    volume7d: 18_765_432,
    fees24h: 7_037,
    fees7d: 56_296,
    apy: 20.81,
    apr: 18.89,
    tickSpacing: 60,
    currentTick: -43210,
    currentPrice: 0.0412,
    priceChange24h: -2.67,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '6789012345678901234567890123',
  },
  {
    id: 'wbtc-usdc-30',
    address: randomAddress(),
    token0: TOKENS.WBTC,
    token1: TOKENS.USDC,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 67_890_123,
    volume24h: 18_901_234,
    volume7d: 134_567_890,
    fees24h: 56_703,
    fees7d: 403_703,
    apy: 30.47,
    apr: 26.58,
    tickSpacing: 60,
    currentTick: 257890,
    currentPrice: 42345.67,
    priceChange24h: 1.78,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '7890123456789012345678901234',
  },
  {
    id: 'crv-eth-100',
    address: randomAddress(),
    token0: TOKENS.CRV,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.HIGH,
    tvl: 8_901_234,
    volume24h: 1_234_567,
    volume7d: 9_876_543,
    fees24h: 12_345,
    fees7d: 98_765,
    apy: 50.63,
    apr: 41.23,
    tickSpacing: 200,
    currentTick: -98765,
    currentPrice: 0.000234,
    priceChange24h: -4.56,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '8901234567890123456789012345',
  },
  {
    id: 'mkr-eth-30',
    address: randomAddress(),
    token0: TOKENS.MKR,
    token1: TOKENS.WETH,
    feeTier: FEE_TIERS.MEDIUM,
    tvl: 15_432_109,
    volume24h: 3_456_789,
    volume7d: 25_678_901,
    fees24h: 10_370,
    fees7d: 77_036,
    apy: 24.54,
    apr: 21.89,
    tickSpacing: 60,
    currentTick: 23456,
    currentPrice: 0.612,
    priceChange24h: 0.78,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '9012345678901234567890123456',
  },
  {
    id: 'eth-usdc-5',
    address: randomAddress(),
    token0: TOKENS.WETH,
    token1: TOKENS.USDC,
    feeTier: FEE_TIERS.LOW,
    tvl: 78_901_234,
    volume24h: 34_567_890,
    volume7d: 245_678_901,
    fees24h: 17_283,
    fees7d: 122_839,
    apy: 7.99,
    apr: 7.69,
    tickSpacing: 10,
    currentTick: 201248,
    currentPrice: 2456.12,
    priceChange24h: 2.31,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '0123456789012345678901234567',
  },
  {
    id: 'dai-usdc-1',
    address: randomAddress(),
    token0: TOKENS.DAI,
    token1: TOKENS.USDC,
    feeTier: FEE_TIERS.LOWEST,
    tvl: 156_789_012,
    volume24h: 67_890_123,
    volume7d: 489_012_345,
    fees24h: 6_789,
    fees7d: 48_901,
    apy: 1.58,
    apr: 1.57,
    tickSpacing: 1,
    currentTick: 2,
    currentPrice: 1.0002,
    priceChange24h: -0.01,
    liquidity: randomLiquidity(),
    sqrtPriceX96: '79236085330515764027303304731',
  },
];

// Generate historical data for a pool
export function generatePoolHistory(pool: Pool, days: number = 30): PoolHistoricalData[] {
  const data: PoolHistoricalData[] = [];
  const now = Date.now();
  let tvl = pool.tvl * (0.7 + Math.random() * 0.2); // Start at 70-90% of current
  let volume = pool.volume24h * (0.5 + Math.random() * 0.3);

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp).toISOString().split('T')[0];

    // Random walk with slight upward trend
    tvl = tvl * (0.97 + Math.random() * 0.08);
    volume = pool.volume24h * (0.3 + Math.random() * 1.4);
    const fees = volume * (pool.feeTier / 10000);
    const apy = (fees * 365 / tvl) * 100;

    data.push({
      timestamp,
      date,
      tvl: Math.round(tvl),
      volume: Math.round(volume),
      fees: Math.round(fees),
      apy: Math.round(apy * 100) / 100,
    });
  }

  return data;
}

// Mock user positions
export const MOCK_POSITIONS: Position[] = [
  {
    id: 'pos-1',
    poolId: 'eth-usdc-30',
    pool: MOCK_POOLS[0],
    owner: '0x1234567890123456789012345678901234567890',
    tickLower: 199000,
    tickUpper: 203000,
    liquidity: '5000000000000000000000',
    token0Amount: 12.5,
    token1Amount: 28750,
    entryPrice: 2300,
    currentPrice: 2456.78,
    valueUSD: 59483.75,
    feesEarnedUSD: 1234.56,
    feesEarned0: 0.25,
    feesEarned1: 612.34,
    impermanentLoss: -1.23,
    impermanentLossUSD: -732.45,
    pnl: 502.11,
    pnlPercentage: 0.85,
    inRange: true,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'pos-2',
    poolId: 'wbtc-eth-30',
    pool: MOCK_POOLS[1],
    owner: '0x1234567890123456789012345678901234567890',
    tickLower: 54000,
    tickUpper: 58000,
    liquidity: '2000000000000000000000',
    token0Amount: 0.5,
    token1Amount: 7.8,
    entryPrice: 16.5,
    currentPrice: 17.23,
    valueUSD: 40345.67,
    feesEarnedUSD: 567.89,
    feesEarned0: 0.005,
    feesEarned1: 0.15,
    impermanentLoss: -0.87,
    impermanentLossUSD: -351.01,
    pnl: 216.88,
    pnlPercentage: 0.54,
    inRange: true,
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'pos-3',
    poolId: 'usdc-usdt-1',
    pool: MOCK_POOLS[2],
    owner: '0x1234567890123456789012345678901234567890',
    tickLower: -10,
    tickUpper: 10,
    liquidity: '10000000000000000000000',
    token0Amount: 50000,
    token1Amount: 50000,
    entryPrice: 1.0,
    currentPrice: 0.9998,
    valueUSD: 99980,
    feesEarnedUSD: 234.56,
    feesEarned0: 117.28,
    feesEarned1: 117.28,
    impermanentLoss: -0.0001,
    impermanentLossUSD: -10,
    pnl: 224.56,
    pnlPercentage: 0.22,
    inRange: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'pos-4',
    poolId: 'link-eth-30',
    pool: MOCK_POOLS[4],
    owner: '0x1234567890123456789012345678901234567890',
    tickLower: -85000,
    tickUpper: -81000,
    liquidity: '1500000000000000000000',
    token0Amount: 1500,
    token1Amount: 8.2,
    entryPrice: 0.0058,
    currentPrice: 0.00612,
    valueUSD: 22456.78,
    feesEarnedUSD: 345.67,
    feesEarned0: 25.5,
    feesEarned1: 0.12,
    impermanentLoss: -2.15,
    impermanentLossUSD: -483.12,
    pnl: -137.45,
    pnlPercentage: -0.61,
    inRange: true,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

// Generate mock swap events
export function generateMockSwaps(count: number = 20): SwapEvent[] {
  const swaps: SwapEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const pool = MOCK_POOLS[Math.floor(Math.random() * MOCK_POOLS.length)];
    const timestamp = now - Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    const amountUSD = 1000 + Math.random() * 500000;
    const isZeroForOne = Math.random() > 0.5;

    swaps.push({
      id: `swap-${i}`,
      poolId: pool.id,
      pool,
      sender: randomAddress(),
      recipient: randomAddress(),
      amount0: isZeroForOne ? amountUSD / pool.currentPrice : -(amountUSD / pool.currentPrice),
      amount1: isZeroForOne ? -amountUSD : amountUSD,
      amountUSD,
      sqrtPriceX96: pool.sqrtPriceX96,
      tick: pool.currentTick,
      timestamp,
      txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    });
  }

  return swaps.sort((a, b) => b.timestamp - a.timestamp);
}

// Protocol stats
export const MOCK_PROTOCOL_STATS: ProtocolStats = {
  totalTVL: MOCK_POOLS.reduce((sum, p) => sum + p.tvl, 0),
  totalVolume24h: MOCK_POOLS.reduce((sum, p) => sum + p.volume24h, 0),
  totalVolume7d: MOCK_POOLS.reduce((sum, p) => sum + p.volume7d, 0),
  totalFees24h: MOCK_POOLS.reduce((sum, p) => sum + p.fees24h, 0),
  totalFees7d: MOCK_POOLS.reduce((sum, p) => sum + p.fees7d, 0),
  totalPools: MOCK_POOLS.length,
  totalPositions: 4532,
  uniqueTraders24h: 1234,
};

// Fee tier distribution
export const MOCK_FEE_DISTRIBUTION: FeeTierDistribution[] = [
  {
    feeTier: FEE_TIERS.LOWEST,
    poolCount: 2,
    tvl: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.LOWEST).reduce((s, p) => s + p.tvl, 0),
    volume24h: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.LOWEST).reduce((s, p) => s + p.volume24h, 0),
    percentage: 0,
  },
  {
    feeTier: FEE_TIERS.LOW,
    poolCount: 1,
    tvl: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.LOW).reduce((s, p) => s + p.tvl, 0),
    volume24h: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.LOW).reduce((s, p) => s + p.volume24h, 0),
    percentage: 0,
  },
  {
    feeTier: FEE_TIERS.MEDIUM,
    poolCount: 8,
    tvl: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.MEDIUM).reduce((s, p) => s + p.tvl, 0),
    volume24h: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.MEDIUM).reduce((s, p) => s + p.volume24h, 0),
    percentage: 0,
  },
  {
    feeTier: FEE_TIERS.HIGH,
    poolCount: 1,
    tvl: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.HIGH).reduce((s, p) => s + p.tvl, 0),
    volume24h: MOCK_POOLS.filter(p => p.feeTier === FEE_TIERS.HIGH).reduce((s, p) => s + p.volume24h, 0),
    percentage: 0,
  },
];

// Calculate percentages
const totalDistTVL = MOCK_FEE_DISTRIBUTION.reduce((s, d) => s + d.tvl, 0);
MOCK_FEE_DISTRIBUTION.forEach(d => {
  d.percentage = (d.tvl / totalDistTVL) * 100;
});
