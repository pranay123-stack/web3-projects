// Token addresses (mainnet-style mock addresses)
export const TOKEN_ADDRESSES = {
  ETH: '0x0000000000000000000000000000000000000000',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  DAI: '0x6B175474E89094C44Da98b954EescdeBDC5EE5AF3',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  CRV: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
} as const;

// Fee tiers in basis points
export const FEE_TIERS = {
  LOWEST: 1, // 0.01%
  LOW: 5, // 0.05%
  MEDIUM: 30, // 0.30%
  HIGH: 100, // 1.00%
} as const;

// Tick spacing for each fee tier
export const TICK_SPACING: Record<number, number> = {
  1: 1,
  5: 10,
  30: 60,
  100: 200,
};

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: 1,
  name: 'Ethereum Mainnet',
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
  blockExplorer: 'https://etherscan.io',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Cypher Protocol addresses (mock)
export const CYPHER_ADDRESSES = {
  factory: '0x1234567890123456789012345678901234567890',
  router: '0x2345678901234567890123456789012345678901',
  positionManager: '0x3456789012345678901234567890123456789012',
  quoter: '0x4567890123456789012345678901234567890123',
};

// Time constants
export const TIME_PERIODS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
} as const;

// UI Constants
export const ITEMS_PER_PAGE = 10;

// Math constants for concentrated liquidity
export const Q96 = BigInt(2) ** BigInt(96);
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

// Default chart colors
export const CHART_COLORS = {
  primary: '#f7c948',
  secondary: '#3b82f6',
  tertiary: '#8b5cf6',
  purple: '#8b5cf6',
  green: '#22c55e',
  red: '#ef4444',
  gray: '#71717a',
  gradient: ['#f7c948', '#d4a83a'],
};

// APY calculation constants
export const DAYS_IN_YEAR = 365;
export const BLOCKS_PER_DAY = 7200; // ~12s block time
