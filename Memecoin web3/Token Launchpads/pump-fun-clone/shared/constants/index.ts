/**
 * Shared constants for the pump.fun clone
 * These values match the on-chain program configuration
 */

// =============================================================================
// Solana Constants
// =============================================================================

/**
 * Number of lamports in 1 SOL
 * 1 SOL = 1,000,000,000 lamports (10^9)
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;

// =============================================================================
// Token Constants
// =============================================================================

/**
 * Number of decimals for pump.fun tokens
 * All tokens created on pump.fun have 6 decimals
 */
export const TOKEN_DECIMALS = 6;

/**
 * Total supply of each token (in smallest units)
 * 1 billion tokens with 6 decimals = 1_000_000_000 * 10^6
 */
export const TOTAL_TOKEN_SUPPLY = BigInt(1_000_000_000) * BigInt(10 ** TOKEN_DECIMALS);

/**
 * Tokens available for purchase through the bonding curve
 * 800 million tokens (80% of total supply)
 */
export const TOKENS_FOR_BONDING_CURVE = BigInt(800_000_000) * BigInt(10 ** TOKEN_DECIMALS);

/**
 * Tokens reserved for liquidity pool after graduation
 * 200 million tokens (20% of total supply)
 */
export const TOKENS_FOR_LIQUIDITY = BigInt(200_000_000) * BigInt(10 ** TOKEN_DECIMALS);

// =============================================================================
// Token Validation Constants
// =============================================================================

/**
 * Minimum length for token name
 */
export const TOKEN_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for token name
 */
export const TOKEN_NAME_MAX_LENGTH = 32;

/**
 * Minimum length for token symbol
 */
export const TOKEN_SYMBOL_MIN_LENGTH = 1;

/**
 * Maximum length for token symbol
 */
export const TOKEN_SYMBOL_MAX_LENGTH = 10;

/**
 * Maximum length for token description
 */
export const TOKEN_DESCRIPTION_MAX_LENGTH = 500;

// =============================================================================
// Bonding Curve Constants
// =============================================================================

/**
 * Market cap threshold for graduation (in SOL)
 * When a token reaches this market cap, it graduates to a DEX
 */
export const GRADUATION_MARKET_CAP = 69;

/**
 * Initial virtual SOL reserves (in lamports)
 * Used to set the starting price of the bonding curve
 * 30 SOL = 30,000,000,000 lamports
 */
export const INITIAL_VIRTUAL_SOL_RESERVES = BigInt(30) * BigInt(LAMPORTS_PER_SOL);

/**
 * Initial virtual token reserves (in smallest units)
 * Matches the tokens available for bonding curve
 * ~1.073 billion tokens to achieve target pricing
 */
export const INITIAL_VIRTUAL_TOKEN_RESERVES = BigInt(1_073_000_000) * BigInt(10 ** TOKEN_DECIMALS);

/**
 * Real SOL required to fill the bonding curve (in lamports)
 * ~85 SOL to reach graduation
 */
export const SOL_TO_FILL_CURVE = BigInt(85) * BigInt(LAMPORTS_PER_SOL);

// =============================================================================
// Fee Constants
// =============================================================================

/**
 * Token creation fee (in SOL)
 * Cost to create a new token on the platform
 */
export const CREATION_FEE = 0.02;

/**
 * Token creation fee (in lamports)
 */
export const CREATION_FEE_LAMPORTS = BigInt(CREATION_FEE * LAMPORTS_PER_SOL);

/**
 * Trading fee percentage
 * Applied to all buy and sell transactions
 */
export const TRADE_FEE_PERCENTAGE = 1;

/**
 * Trading fee in basis points (1% = 100 bps)
 * Used for precise calculations
 */
export const TRADE_FEE_BPS = 100;

/**
 * Platform fee split (percentage that goes to platform)
 */
export const PLATFORM_FEE_PERCENTAGE = 100;

// =============================================================================
// Trading Constants
// =============================================================================

/**
 * Default slippage tolerance (in percentage)
 */
export const DEFAULT_SLIPPAGE = 1;

/**
 * Maximum allowed slippage (in percentage)
 */
export const MAX_SLIPPAGE = 50;

/**
 * Minimum allowed slippage (in percentage)
 */
export const MIN_SLIPPAGE = 0.1;

/**
 * Minimum SOL amount for a trade (in SOL)
 */
export const MIN_TRADE_AMOUNT_SOL = 0.0001;

/**
 * Minimum SOL amount for a trade (in lamports)
 */
export const MIN_TRADE_AMOUNT_LAMPORTS = BigInt(MIN_TRADE_AMOUNT_SOL * LAMPORTS_PER_SOL);

// =============================================================================
// API Constants
// =============================================================================

/**
 * Default page size for paginated responses
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated responses
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Cache duration for token data (in seconds)
 */
export const TOKEN_CACHE_TTL = 10;

/**
 * Cache duration for price data (in seconds)
 */
export const PRICE_CACHE_TTL = 5;

// =============================================================================
// WebSocket Constants
// =============================================================================

/**
 * WebSocket heartbeat interval (in milliseconds)
 */
export const WS_HEARTBEAT_INTERVAL = 30_000;

/**
 * WebSocket reconnection delay (in milliseconds)
 */
export const WS_RECONNECT_DELAY = 1_000;

/**
 * Maximum WebSocket reconnection attempts
 */
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

// =============================================================================
// Rate Limiting Constants
// =============================================================================

/**
 * Maximum requests per minute for unauthenticated users
 */
export const RATE_LIMIT_ANONYMOUS = 60;

/**
 * Maximum requests per minute for authenticated users
 */
export const RATE_LIMIT_AUTHENTICATED = 300;

/**
 * Maximum token creations per hour per wallet
 */
export const MAX_TOKENS_PER_HOUR = 10;

// =============================================================================
// Display Constants
// =============================================================================

/**
 * Number of characters to show at start when shortening address
 */
export const ADDRESS_START_CHARS = 4;

/**
 * Number of characters to show at end when shortening address
 */
export const ADDRESS_END_CHARS = 4;

/**
 * Default number of decimal places for SOL display
 */
export const SOL_DISPLAY_DECIMALS = 4;

/**
 * Default number of decimal places for token display
 */
export const TOKEN_DISPLAY_DECIMALS = 2;

/**
 * Default number of decimal places for percentage display
 */
export const PERCENTAGE_DISPLAY_DECIMALS = 2;
