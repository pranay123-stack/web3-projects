/// Token decimals (standard SPL token decimals)
pub const TOKEN_DECIMALS: u8 = 6;

/// Total supply of tokens (1 billion with 6 decimals)
pub const TOTAL_SUPPLY: u64 = 1_000_000_000 * 1_000_000; // 1B tokens

/// Initial virtual SOL reserves (30 SOL in lamports)
/// This determines the initial price curve
pub const DEFAULT_VIRTUAL_SOL_RESERVES: u64 = 30 * 1_000_000_000; // 30 SOL

/// Initial virtual token reserves (1.073B tokens)
/// This is the token amount in the virtual pool
pub const DEFAULT_VIRTUAL_TOKEN_RESERVES: u64 = 1_073_000_000 * 1_000_000; // ~1.073B tokens

/// Initial real token reserves (793M tokens available for sale)
/// The remaining tokens are virtual
pub const INITIAL_REAL_TOKEN_RESERVES: u64 = 793_000_000 * 1_000_000; // 793M tokens

/// Graduation market cap threshold (~$69k USD)
/// At ~$200/SOL, this is approximately 345 SOL
/// We use 85 SOL in the bonding curve as the graduation threshold
pub const GRADUATION_MARKET_CAP_THRESHOLD: u64 = 345 * 1_000_000_000; // 345 SOL equivalent

/// SOL threshold for graduation (when this much SOL is in the curve)
pub const GRADUATION_SOL_THRESHOLD: u64 = 85 * 1_000_000_000; // 85 SOL

/// Platform fee in basis points (1% = 100 bps)
pub const DEFAULT_PLATFORM_FEE_BPS: u16 = 100;

/// Maximum platform fee (10% = 1000 bps)
pub const MAX_PLATFORM_FEE_BPS: u16 = 1000;

/// Minimum trade amount in lamports (0.001 SOL)
pub const MIN_TRADE_AMOUNT: u64 = 1_000_000;

/// Liquidity percentage for Raydium (percentage of raised SOL to add as liquidity)
pub const GRADUATION_LIQUIDITY_PERCENTAGE: u64 = 85; // 85% of raised SOL goes to Raydium

/// Creator reward on graduation (percentage of raised SOL)
pub const CREATOR_GRADUATION_REWARD_PERCENTAGE: u64 = 10; // 10% goes to creator

/// Platform graduation fee (percentage of raised SOL)
pub const PLATFORM_GRADUATION_FEE_PERCENTAGE: u64 = 5; // 5% goes to platform

/// Seeds for PDA derivation
pub const GLOBAL_CONFIG_SEED: &[u8] = b"global_config";
pub const BONDING_CURVE_SEED: &[u8] = b"bonding_curve";
pub const TOKEN_LAUNCH_SEED: &[u8] = b"token_launch";
pub const VAULT_SEED: &[u8] = b"vault";
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint_authority";

/// Maximum name length
pub const MAX_NAME_LENGTH: usize = 32;

/// Maximum symbol length
pub const MAX_SYMBOL_LENGTH: usize = 10;

/// Maximum URI length
pub const MAX_URI_LENGTH: usize = 200;
