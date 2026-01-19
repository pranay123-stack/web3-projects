/**
 * User-related types for the pump.fun clone
 */

import type { TokenSummary } from './token';
import type { Trade } from './trade';

/**
 * Core user representation
 */
export interface User {
  /** Unique user identifier (wallet address) */
  id: string;
  /** Solana wallet address (base58 encoded) */
  walletAddress: string;
  /** Optional display name */
  displayName?: string;
  /** Optional profile picture URL */
  avatarUrl?: string;
  /** Optional bio/description */
  bio?: string;
  /** ISO timestamp of first interaction */
  createdAt: string;
  /** ISO timestamp of last activity */
  lastActiveAt: string;
}

/**
 * Extended user profile with additional details
 */
export interface UserProfile extends User {
  /** User's trading statistics */
  stats: UserStats;
  /** Tokens created by this user */
  createdTokens: TokenSummary[];
  /** Tokens currently held by this user */
  heldTokens: UserTokenHolding[];
  /** Whether the user is verified */
  isVerified: boolean;
  /** User's social links */
  socials?: UserSocials;
}

/**
 * User's social media links
 */
export interface UserSocials {
  /** Twitter/X handle */
  twitter?: string;
  /** Telegram username */
  telegram?: string;
  /** Discord username */
  discord?: string;
  /** Personal website */
  website?: string;
}

/**
 * Aggregated statistics for a user
 */
export interface UserStats {
  /** Total number of tokens created */
  tokensCreated: number;
  /** Total number of trades executed */
  totalTrades: number;
  /** Total number of buy transactions */
  buyCount: number;
  /** Total number of sell transactions */
  sellCount: number;
  /** Total SOL volume traded (in SOL, not lamports) */
  totalVolumeSOL: number;
  /** Total realized profit/loss in SOL */
  totalPnlSOL: number;
  /** Percentage of profitable trades */
  winRate: number;
  /** Number of tokens currently held */
  tokensHeld: number;
  /** Number of graduated tokens created */
  graduatedTokens: number;
  /** Total fees paid in SOL */
  totalFeesPaid: number;
  /** First trade timestamp */
  firstTradeAt?: string;
  /** Most recent trade timestamp */
  lastTradeAt?: string;
}

/**
 * Represents a token holding for a user
 */
export interface UserTokenHolding {
  /** Token information */
  token: TokenSummary;
  /** Current balance in smallest units */
  balance: bigint;
  /** Balance formatted as a number with decimals */
  balanceFormatted: number;
  /** Average buy price in SOL */
  averageBuyPrice: number;
  /** Current value in SOL */
  currentValue: number;
  /** Unrealized profit/loss in SOL */
  unrealizedPnl: number;
  /** Unrealized profit/loss percentage */
  unrealizedPnlPercentage: number;
  /** Percentage of token supply held */
  percentageOfSupply: number;
  /** First purchase timestamp */
  firstBuyAt: string;
  /** Most recent purchase timestamp */
  lastBuyAt: string;
}

/**
 * User's trade history entry
 */
export interface UserTradeHistory {
  /** Trade details */
  trade: Trade;
  /** Token information at time of trade */
  token: TokenSummary;
  /** Realized PnL for this trade (for sells) */
  realizedPnl?: number;
}

/**
 * User notification preferences
 */
export interface UserNotificationSettings {
  /** Notify on token graduation */
  graduationAlerts: boolean;
  /** Notify on price movements */
  priceAlerts: boolean;
  /** Notify on new trades for held tokens */
  tradeAlerts: boolean;
  /** Notify on new tokens from followed creators */
  creatorAlerts: boolean;
  /** Email notifications enabled */
  emailNotifications: boolean;
  /** Push notifications enabled */
  pushNotifications: boolean;
}

/**
 * Leaderboard entry for top traders/creators
 */
export interface LeaderboardEntry {
  /** User's rank */
  rank: number;
  /** User information */
  user: User;
  /** Metric value (varies by leaderboard type) */
  value: number;
  /** Change in rank from previous period */
  rankChange: number;
}
