/**
 * WebSocket event types for real-time updates
 * Used for live trading feeds, price updates, and notifications
 */

import type { Token, TokenSummary, BondingCurve } from './token';
import type { Trade, TradeType } from './trade';

/**
 * Base interface for all WebSocket events
 */
export interface BaseWebSocketEvent {
  /** Event type identifier */
  type: WebSocketEventType;
  /** ISO timestamp of the event */
  timestamp: string;
  /** Unique event ID for deduplication */
  eventId: string;
}

/**
 * All possible WebSocket event types
 */
export enum WebSocketEventType {
  // Connection events
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  HEARTBEAT = 'HEARTBEAT',

  // Token events
  NEW_TOKEN = 'NEW_TOKEN',
  TOKEN_GRADUATED = 'TOKEN_GRADUATED',
  TOKEN_UPDATED = 'TOKEN_UPDATED',

  // Trade events
  TRADE = 'TRADE',
  TRADE_PENDING = 'TRADE_PENDING',
  TRADE_CONFIRMED = 'TRADE_CONFIRMED',
  TRADE_FAILED = 'TRADE_FAILED',

  // Price events
  PRICE_UPDATE = 'PRICE_UPDATE',
  MARKET_CAP_UPDATE = 'MARKET_CAP_UPDATE',

  // User events
  BALANCE_UPDATE = 'BALANCE_UPDATE',
  NOTIFICATION = 'NOTIFICATION',

  // Subscription events
  SUBSCRIBE_ACK = 'SUBSCRIBE_ACK',
  UNSUBSCRIBE_ACK = 'UNSUBSCRIBE_ACK',
}

/**
 * Event emitted when a new token is created
 */
export interface NewTokenEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.NEW_TOKEN;
  /** The newly created token */
  token: Token;
  /** Creator's wallet address */
  creator: string;
  /** Transaction signature of the creation */
  txSignature: string;
  /** Initial buy amount (if creator made initial purchase) */
  initialBuyAmount?: number;
}

/**
 * Event emitted when a token graduates to a DEX
 */
export interface TokenGraduatedEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.TOKEN_GRADUATED;
  /** Token that graduated */
  token: TokenSummary;
  /** Final market cap at graduation */
  finalMarketCap: number;
  /** DEX pool address (e.g., Raydium) */
  poolAddress: string;
  /** Graduation transaction signature */
  txSignature: string;
}

/**
 * Event emitted when a trade occurs
 */
export interface TradeEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.TRADE;
  /** The trade details */
  trade: Trade;
  /** Token involved in the trade */
  token: TokenSummary;
  /** Updated bonding curve state */
  bondingCurve: BondingCurve;
  /** New price after trade */
  newPrice: number;
  /** New market cap after trade */
  newMarketCap: number;
}

/**
 * Event emitted for price updates (aggregated/throttled)
 */
export interface PriceUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.PRICE_UPDATE;
  /** Token mint address */
  tokenMint: string;
  /** Current price in SOL */
  price: number;
  /** Previous price in SOL */
  previousPrice: number;
  /** Price change percentage */
  priceChange: number;
  /** Current market cap in SOL */
  marketCap: number;
  /** 24-hour price change percentage */
  priceChange24h: number;
  /** 24-hour volume in SOL */
  volume24h: number;
}

/**
 * Event emitted for market cap updates
 */
export interface MarketCapUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.MARKET_CAP_UPDATE;
  /** Token mint address */
  tokenMint: string;
  /** Current market cap in SOL */
  marketCap: number;
  /** Progress towards graduation (0-100) */
  graduationProgress: number;
  /** Whether token is close to graduating (>90%) */
  nearGraduation: boolean;
}

/**
 * Event for user balance updates
 */
export interface BalanceUpdateEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.BALANCE_UPDATE;
  /** User's wallet address */
  walletAddress: string;
  /** Token mint address (null for SOL) */
  tokenMint: string | null;
  /** New balance */
  balance: bigint;
  /** Change in balance */
  change: bigint;
}

/**
 * Connection established event
 */
export interface ConnectedEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.CONNECTED;
  /** Session ID */
  sessionId: string;
  /** Server time for sync */
  serverTime: string;
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.ERROR;
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Heartbeat/ping event
 */
export interface HeartbeatEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.HEARTBEAT;
  /** Server timestamp */
  serverTime: string;
}

/**
 * Subscription acknowledgment event
 */
export interface SubscribeAckEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.SUBSCRIBE_ACK;
  /** Channel that was subscribed to */
  channel: SubscriptionChannel;
  /** Subscription parameters */
  params?: Record<string, unknown>;
}

/**
 * Unsubscription acknowledgment event
 */
export interface UnsubscribeAckEvent extends BaseWebSocketEvent {
  type: WebSocketEventType.UNSUBSCRIBE_ACK;
  /** Channel that was unsubscribed from */
  channel: SubscriptionChannel;
}

/**
 * Available subscription channels
 */
export enum SubscriptionChannel {
  /** All new token creations */
  NEW_TOKENS = 'NEW_TOKENS',
  /** Trades for a specific token */
  TOKEN_TRADES = 'TOKEN_TRADES',
  /** Price updates for a specific token */
  TOKEN_PRICE = 'TOKEN_PRICE',
  /** All trades (firehose) */
  ALL_TRADES = 'ALL_TRADES',
  /** User-specific events */
  USER_EVENTS = 'USER_EVENTS',
  /** Graduation events */
  GRADUATIONS = 'GRADUATIONS',
}

/**
 * Client-to-server subscription message
 */
export interface SubscribeMessage {
  action: 'subscribe';
  channel: SubscriptionChannel;
  /** Optional parameters (e.g., tokenMint for specific token) */
  params?: {
    tokenMint?: string;
    walletAddress?: string;
  };
}

/**
 * Client-to-server unsubscription message
 */
export interface UnsubscribeMessage {
  action: 'unsubscribe';
  channel: SubscriptionChannel;
  params?: {
    tokenMint?: string;
    walletAddress?: string;
  };
}

/**
 * Union type of all WebSocket events
 */
export type WebSocketEvent =
  | NewTokenEvent
  | TokenGraduatedEvent
  | TradeEvent
  | PriceUpdateEvent
  | MarketCapUpdateEvent
  | BalanceUpdateEvent
  | ConnectedEvent
  | ErrorEvent
  | HeartbeatEvent
  | SubscribeAckEvent
  | UnsubscribeAckEvent;

/**
 * Union type of all client-to-server messages
 */
export type ClientMessage = SubscribeMessage | UnsubscribeMessage;
