// Token types
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl?: string;
}

// Pool types
export interface Pool {
  id: string;
  address: string;
  token0: Token;
  token1: Token;
  feeTier: number; // in basis points (e.g., 30 = 0.30%)
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  fees7d: number;
  apy: number;
  apr: number;
  tickSpacing: number;
  currentTick: number;
  currentPrice: number;
  priceChange24h: number;
  liquidity: string;
  sqrtPriceX96: string;
}

export interface PoolHistoricalData {
  timestamp: number;
  date: string;
  tvl: number;
  volume: number;
  fees: number;
  apy: number;
}

// Position types
export interface Position {
  id: string;
  poolId: string;
  pool: Pool;
  owner: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  token0Amount: number;
  token1Amount: number;
  entryPrice: number;
  currentPrice: number;
  valueUSD: number;
  feesEarnedUSD: number;
  feesEarned0: number;
  feesEarned1: number;
  impermanentLoss: number;
  impermanentLossUSD: number;
  pnl: number;
  pnlPercentage: number;
  inRange: boolean;
  createdAt: number;
}

// Wallet types
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
}

// Analytics types
export interface ProtocolStats {
  totalTVL: number;
  totalVolume24h: number;
  totalVolume7d: number;
  totalFees24h: number;
  totalFees7d: number;
  totalPools: number;
  totalPositions: number;
  uniqueTraders24h: number;
}

export interface SwapEvent {
  id: string;
  poolId: string;
  pool: Pool;
  sender: string;
  recipient: string;
  amount0: number;
  amount1: number;
  amountUSD: number;
  sqrtPriceX96: string;
  tick: number;
  timestamp: number;
  txHash: string;
}

export interface FeeTierDistribution {
  feeTier: number;
  poolCount: number;
  tvl: number;
  volume24h: number;
  percentage: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: number;
  date: string;
  value: number;
}

export interface VolumeDataPoint extends ChartDataPoint {
  volume: number;
}

export interface TVLDataPoint extends ChartDataPoint {
  tvl: number;
}

export interface FeeAPYDataPoint extends ChartDataPoint {
  apy: number;
  fees: number;
}

// IL Calculator types
export interface ILCalculatorInput {
  entryPrice: number;
  currentPrice: number;
  lowerRangePrice: number;
  upperRangePrice: number;
  initialInvestment: number;
}

export interface ILCalculatorResult {
  impermanentLossPercentage: number;
  impermanentLossUSD: number;
  currentPositionValue: number;
  hodlValue: number;
  token0Amount: number;
  token1Amount: number;
  inRange: boolean;
}

// Table types
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  search: string;
  feeTier?: number;
  minTVL?: number;
  maxTVL?: number;
}

// Time range types
export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

// Component prop types
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}
