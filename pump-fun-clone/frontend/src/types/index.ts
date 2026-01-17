// User types
export interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

export interface UserStats {
  tokensCreated: number;
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
  followers: number;
  following: number;
}

// Token types
export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creator: string;
  createdAt: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
}

// Holding types
export interface Holding {
  id: string;
  token: Token;
  amount: number;
  value: number;
  averageBuyPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
}

// Trade types
export type TradeType = 'buy' | 'sell';

export interface Trade {
  id: string;
  token: Token;
  type: TradeType;
  amount: number;
  price: number;
  totalValue: number;
  timestamp: string;
  txHash: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

// Notification preferences
export interface NotificationPreferences {
  priceAlerts: boolean;
  tradeConfirmations: boolean;
  newFollowers: boolean;
  tokenGraduations: boolean;
  marketingEmails: boolean;
}

// Connected wallet
export interface ConnectedWallet {
  address: string;
  name: string;
  isPrimary: boolean;
  connectedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Extended Token with full details for token page
export interface TokenDetails extends Token {
  totalSupply: number;
  circulatingSupply: number;
  creatorAddress: string;
  creatorProfile?: User;
  bondingCurve: BondingCurve;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
  };
  tradingEnabled: boolean;
  liquidityPool?: string;
  raydiumPool?: string;
}

// Bonding Curve types
export interface BondingCurve {
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  realTokenReserves: number;
  tokenTotalSupply: number;
  complete: boolean;
  graduationThreshold: number;
  currentProgress: number;
}

// Trade with trader info
export interface TradeWithTrader extends Trade {
  trader: {
    address: string;
    username?: string;
    avatar?: string;
  };
  solAmount: number;
  tokenAmount: number;
  pricePerToken: number;
  isBuy: boolean;
}

// Price chart data point
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Holder distribution
export interface Holder {
  address: string;
  username?: string;
  balance: number;
  percentage: number;
  isCreator: boolean;
}

// Comment types
export interface Comment {
  id: string;
  tokenAddress: string;
  author: {
    address: string;
    username?: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replyTo?: string;
  replies?: Comment[];
}

// Transaction status
export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  signature?: string;
  error?: string;
}

// Trading params
export interface TradingParams {
  slippageBps: number;
  priorityFee: number;
}

// Price estimate response
export interface PriceEstimate {
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  minOutputAmount: number;
}

// WebSocket message types
export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}

export interface PriceUpdate {
  mint: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  bondingCurveProgress: number;
}

export interface NewTradeEvent {
  mint: string;
  trade: TradeWithTrader;
}

export interface NewTokenEvent {
  token: Token;
}

export interface BondingCurveProgressEvent {
  mint: string;
  progress: number;
  realSolReserves: number;
  threshold: number;
}

export interface MigrationEvent {
  mint: string;
  status: 'started' | 'completed';
  raydiumPoolAddress?: string;
  timestamp: string;
}

// UI State types
export interface ModalState {
  isOpen: boolean;
  type?: 'buy' | 'sell' | 'settings' | 'wallet' | 'confirm';
  data?: unknown;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Filter and sort types
export type SortOption = 'trending' | 'newest' | 'marketCap' | 'volume24h' | 'priceChange' | 'bondingProgress';

export type TokenCategory = 'meme' | 'gaming' | 'defi' | 'nft' | 'metaverse' | 'ai' | 'social' | 'other';

export interface FilterState {
  category?: TokenCategory;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  showMigrated?: boolean;
  searchQuery?: string;
}

// Form types
export interface CreateTokenFormData {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  website: string;
  twitter: string;
  telegram: string;
  initialBuyAmount: string;
}

export interface TradeFormData {
  amount: string;
  slippage: number;
  isSolAmount: boolean;
}

// User preference types
export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultSlippage: number;
  showPriceInUsd: boolean;
  enableNotifications: boolean;
  enableSounds: boolean;
}

// Wallet types
export interface WalletBalance {
  sol: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
  }>;
}

// Platform stats
export interface PlatformStats {
  totalTokens: number;
  totalTrades: number;
  totalVolume: number;
  activeUsers24h: number;
  tokensCreated24h: number;
  volumeChange24h: number;
}
