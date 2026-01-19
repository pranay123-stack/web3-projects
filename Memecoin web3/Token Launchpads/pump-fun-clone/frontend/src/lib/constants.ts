import { PublicKey } from '@solana/web3.js';

// Environment variables
export const ENV = {
  SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_NETWORK: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111111',
} as const;

// Program configuration
export const PROGRAM_CONFIG = {
  PROGRAM_ID: new PublicKey(ENV.PROGRAM_ID),
  TOKEN_DECIMALS: 6,
  INITIAL_VIRTUAL_SOL_RESERVES: 30, // SOL
  INITIAL_VIRTUAL_TOKEN_RESERVES: 1_073_000_000, // tokens
  BONDING_CURVE_PERCENTAGE: 80, // % of tokens for bonding curve
  CREATOR_ALLOCATION: 0, // % for creator
  MIGRATION_THRESHOLD: 69, // SOL
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Tokens
  TOKENS: '/api/tokens',
  TOKEN_BY_MINT: (mint: string) => `/api/tokens/${mint}`,
  TRENDING_TOKENS: '/api/tokens/trending',
  NEW_TOKENS: '/api/tokens/new',
  SEARCH_TOKENS: '/api/tokens/search',

  // Trading
  BUY: '/api/trade/buy',
  SELL: '/api/trade/sell',
  TRADES: (mint: string) => `/api/tokens/${mint}/trades`,

  // Users
  USER_PROFILE: (address: string) => `/api/users/${address}`,
  USER_HOLDINGS: (address: string) => `/api/users/${address}/holdings`,
  USER_CREATED: (address: string) => `/api/users/${address}/created`,

  // Token creation
  CREATE_TOKEN: '/api/tokens/create',
  UPLOAD_IMAGE: '/api/upload/image',

  // Stats
  PLATFORM_STATS: '/api/stats',
} as const;

// WebSocket events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Token events
  NEW_TOKEN: 'new_token',
  TOKEN_UPDATE: 'token_update',
  PRICE_UPDATE: 'price_update',

  // Trade events
  NEW_TRADE: 'new_trade',
  TRADE_EXECUTED: 'trade_executed',

  // Bonding curve events
  BONDING_CURVE_PROGRESS: 'bonding_curve_progress',
  MIGRATION_STARTED: 'migration_started',
  MIGRATION_COMPLETED: 'migration_completed',

  // Subscriptions
  SUBSCRIBE_TOKEN: 'subscribe_token',
  UNSUBSCRIBE_TOKEN: 'unsubscribe_token',
  SUBSCRIBE_ALL: 'subscribe_all',
} as const;

// UI Constants
export const UI = {
  // Pagination
  TOKENS_PER_PAGE: 20,
  TRADES_PER_PAGE: 50,

  // Intervals (ms)
  PRICE_UPDATE_INTERVAL: 5000,
  BALANCE_UPDATE_INTERVAL: 10000,

  // Timeouts
  TOAST_DURATION: 4000,
  TRANSACTION_TIMEOUT: 60000,

  // Limits
  MAX_TOKEN_NAME_LENGTH: 32,
  MAX_TOKEN_SYMBOL_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_IMAGE_SIZE_MB: 5,

  // Slippage options (%)
  SLIPPAGE_OPTIONS: [0.5, 1, 2, 5],
  DEFAULT_SLIPPAGE: 1,
} as const;

// Chart configuration
export const CHART_CONFIG = {
  TIMEFRAMES: [
    { label: '5m', value: '5m', seconds: 300 },
    { label: '15m', value: '15m', seconds: 900 },
    { label: '1h', value: '1h', seconds: 3600 },
    { label: '4h', value: '4h', seconds: 14400 },
    { label: '1d', value: '1d', seconds: 86400 },
  ],
  DEFAULT_TIMEFRAME: '15m',
  MAX_CANDLES: 200,
} as const;

// Token categories/tags
export const TOKEN_CATEGORIES = [
  'meme',
  'gaming',
  'defi',
  'nft',
  'metaverse',
  'ai',
  'social',
  'other',
] as const;

// Sort options for token listings
export const SORT_OPTIONS = [
  { label: 'Trending', value: 'trending' },
  { label: 'Newest', value: 'newest' },
  { label: 'Market Cap', value: 'marketCap' },
  { label: 'Volume (24h)', value: 'volume24h' },
  { label: 'Price Change', value: 'priceChange' },
  { label: 'Bonding Curve', value: 'bondingProgress' },
] as const;

// Transaction status
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_AMOUNT: 'Please enter a valid amount',
  SLIPPAGE_EXCEEDED: 'Price changed too much. Try increasing slippage',
  TOKEN_NOT_FOUND: 'Token not found',
  UPLOAD_FAILED: 'Failed to upload image. Please try again',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TOKEN_CREATED: 'Token created successfully!',
  BUY_COMPLETED: 'Buy order completed!',
  SELL_COMPLETED: 'Sell order completed!',
  WALLET_CONNECTED: 'Wallet connected successfully',
} as const;

// External links
export const EXTERNAL_LINKS = {
  SOLSCAN: (address: string) => `https://solscan.io/account/${address}`,
  SOLSCAN_TX: (signature: string) => `https://solscan.io/tx/${signature}`,
  TWITTER: 'https://twitter.com',
  TELEGRAM: 'https://t.me',
  DISCORD: 'https://discord.gg',
  DOCS: '/docs',
} as const;
