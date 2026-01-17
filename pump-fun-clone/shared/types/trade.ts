/**
 * Trade-related types for the pump.fun clone
 */

/**
 * Enum representing the type of trade
 */
export enum TradeType {
  /** Buying tokens with SOL */
  BUY = 'BUY',
  /** Selling tokens for SOL */
  SELL = 'SELL',
}

/**
 * Trade status enum
 */
export enum TradeStatus {
  /** Trade is pending confirmation */
  PENDING = 'PENDING',
  /** Trade has been confirmed on-chain */
  CONFIRMED = 'CONFIRMED',
  /** Trade failed or was rejected */
  FAILED = 'FAILED',
}

/**
 * Represents a completed trade
 */
export interface Trade {
  /** Unique trade identifier */
  id: string;
  /** Solana transaction signature */
  txSignature: string;
  /** Token mint address */
  tokenMint: string;
  /** Trader's wallet address */
  trader: string;
  /** Type of trade (BUY or SELL) */
  type: TradeType;
  /** Amount of SOL involved (in lamports) */
  solAmount: bigint;
  /** Amount of tokens involved (in smallest units) */
  tokenAmount: bigint;
  /** Price per token in SOL at time of trade */
  pricePerToken: number;
  /** Trading fee paid (in lamports) */
  fee: bigint;
  /** Trade status */
  status: TradeStatus;
  /** Market cap after this trade (in SOL) */
  marketCapAfter: number;
  /** Bonding curve progress after trade (0-100) */
  progressAfter: number;
  /** ISO timestamp of the trade */
  timestamp: string;
  /** Solana slot number */
  slot: number;
  /** Block time (Unix timestamp) */
  blockTime: number;
}

/**
 * Input for creating a new trade (buy)
 */
export interface BuyTradeInput {
  /** Token mint address to buy */
  tokenMint: string;
  /** Amount of SOL to spend (in lamports) */
  solAmount: bigint;
  /** Minimum tokens expected (slippage protection) */
  minTokensOut: bigint;
  /** Maximum slippage tolerance (percentage, e.g., 1 = 1%) */
  slippageTolerance: number;
}

/**
 * Input for creating a new trade (sell)
 */
export interface SellTradeInput {
  /** Token mint address to sell */
  tokenMint: string;
  /** Amount of tokens to sell (in smallest units) */
  tokenAmount: bigint;
  /** Minimum SOL expected (slippage protection) */
  minSolOut: bigint;
  /** Maximum slippage tolerance (percentage, e.g., 1 = 1%) */
  slippageTolerance: number;
}

/**
 * Union type for trade inputs
 */
export type TradeInput = BuyTradeInput | SellTradeInput;

/**
 * Quote for a potential trade (preview before execution)
 */
export interface TradeQuote {
  /** Type of trade */
  type: TradeType;
  /** Token mint address */
  tokenMint: string;
  /** Input amount (SOL for buy, tokens for sell) */
  inputAmount: bigint;
  /** Expected output amount (tokens for buy, SOL for sell) */
  expectedOutput: bigint;
  /** Minimum output after slippage */
  minimumOutput: bigint;
  /** Price impact percentage */
  priceImpact: number;
  /** Trading fee (in lamports) */
  fee: bigint;
  /** Effective price per token */
  effectivePrice: number;
  /** Quote expiration timestamp */
  expiresAt: string;
}

/**
 * Trade execution result
 */
export interface TradeResult {
  /** Whether the trade was successful */
  success: boolean;
  /** The completed trade (if successful) */
  trade?: Trade;
  /** Error message (if failed) */
  error?: string;
  /** Transaction signature */
  txSignature?: string;
}

/**
 * Trade history filters
 */
export interface TradeHistoryFilters {
  /** Filter by token mint */
  tokenMint?: string;
  /** Filter by trader address */
  trader?: string;
  /** Filter by trade type */
  type?: TradeType;
  /** Start date for range filter */
  startDate?: string;
  /** End date for range filter */
  endDate?: string;
  /** Minimum SOL amount */
  minSolAmount?: number;
  /** Maximum SOL amount */
  maxSolAmount?: number;
}

/**
 * Aggregated trade statistics for a token
 */
export interface TokenTradeStats {
  /** Token mint address */
  tokenMint: string;
  /** Total number of trades */
  totalTrades: number;
  /** Total number of buys */
  buyCount: number;
  /** Total number of sells */
  sellCount: number;
  /** Total volume in SOL */
  totalVolume: number;
  /** 24-hour volume in SOL */
  volume24h: number;
  /** Number of unique traders */
  uniqueTraders: number;
  /** Largest single trade in SOL */
  largestTrade: number;
  /** Average trade size in SOL */
  averageTradeSize: number;
}
