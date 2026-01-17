/**
 * Token-related types for the pump.fun clone
 */

/**
 * Represents the bonding curve state for a token
 * Used to calculate token prices and track liquidity
 */
export interface BondingCurve {
  /** Virtual SOL reserves in lamports (1 SOL = 1e9 lamports) */
  virtualSolReserves: bigint;
  /** Virtual token reserves in smallest token units */
  virtualTokenReserves: bigint;
  /** Real SOL reserves locked in the curve (lamports) */
  realSolReserves: bigint;
  /** Real token reserves available for purchase */
  realTokenReserves: bigint;
  /** Total tokens that have been sold from the curve */
  tokenTotalSupply: bigint;
  /** Whether the token has graduated to a DEX */
  complete: boolean;
}

/**
 * Metadata associated with a token
 * Follows Metaplex token metadata standards
 */
export interface TokenMetadata {
  /** Token name (e.g., "Doge Coin") */
  name: string;
  /** Token symbol/ticker (e.g., "DOGE") */
  symbol: string;
  /** URI pointing to off-chain metadata JSON */
  uri: string;
  /** Description of the token */
  description?: string;
  /** URL to the token's image */
  image?: string;
  /** Twitter/X handle for the token */
  twitter?: string;
  /** Telegram group link */
  telegram?: string;
  /** Website URL */
  website?: string;
}

/**
 * Complete token representation including on-chain and off-chain data
 */
export interface Token {
  /** Unique token identifier (mint address) */
  id: string;
  /** Solana mint address (base58 encoded) */
  mint: string;
  /** Token name */
  name: string;
  /** Token symbol/ticker */
  symbol: string;
  /** Token description */
  description: string;
  /** URL to token image */
  imageUrl: string;
  /** Token metadata */
  metadata: TokenMetadata;
  /** Current bonding curve state */
  bondingCurve: BondingCurve;
  /** Creator's wallet address */
  creator: string;
  /** ISO timestamp of token creation */
  createdAt: string;
  /** Current price in SOL */
  currentPrice: number;
  /** Current market cap in SOL */
  marketCap: number;
  /** 24-hour trading volume in SOL */
  volume24h: number;
  /** 24-hour price change percentage */
  priceChange24h: number;
  /** Number of unique holders */
  holderCount: number;
  /** Total number of trades */
  tradeCount: number;
  /** Whether the token has graduated to a DEX */
  isGraduated: boolean;
  /** Progress towards graduation (0-100) */
  graduationProgress: number;
}

/**
 * Input data required to create a new token
 */
export interface TokenCreate {
  /** Token name (1-32 characters) */
  name: string;
  /** Token symbol (1-10 characters, uppercase) */
  symbol: string;
  /** Token description (max 500 characters) */
  description: string;
  /** Token image file or URL */
  image: string | File;
  /** Optional Twitter/X handle */
  twitter?: string;
  /** Optional Telegram group link */
  telegram?: string;
  /** Optional website URL */
  website?: string;
  /** Initial SOL amount to buy (optional) */
  initialBuyAmount?: number;
}

/**
 * Simplified token data for list views
 */
export interface TokenSummary {
  /** Token mint address */
  mint: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token image URL */
  imageUrl: string;
  /** Current price in SOL */
  currentPrice: number;
  /** Current market cap in SOL */
  marketCap: number;
  /** 24-hour price change percentage */
  priceChange24h: number;
  /** Progress towards graduation (0-100) */
  graduationProgress: number;
  /** ISO timestamp of creation */
  createdAt: string;
}

/**
 * Token holder information
 */
export interface TokenHolder {
  /** Holder's wallet address */
  address: string;
  /** Token balance in smallest units */
  balance: bigint;
  /** Percentage of total supply held */
  percentage: number;
  /** Whether this is the creator */
  isCreator: boolean;
}
