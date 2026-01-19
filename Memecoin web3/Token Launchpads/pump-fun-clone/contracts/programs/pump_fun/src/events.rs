use anchor_lang::prelude::*;

/// Event emitted when a new token is created
#[event]
pub struct TokenCreatedEvent {
    /// The token mint address
    pub mint: Pubkey,
    /// Creator of the token
    pub creator: Pubkey,
    /// Token name
    pub name: String,
    /// Token symbol
    pub symbol: String,
    /// Metadata URI
    pub uri: String,
    /// Bonding curve account
    pub bonding_curve: Pubkey,
    /// Initial virtual SOL reserves
    pub initial_virtual_sol_reserves: u64,
    /// Initial virtual token reserves
    pub initial_virtual_token_reserves: u64,
    /// Total supply
    pub total_supply: u64,
    /// Timestamp
    pub timestamp: i64,
}

/// Event emitted on every trade (buy or sell)
#[event]
pub struct TradeEvent {
    /// The token mint
    pub mint: Pubkey,
    /// Trader address
    pub trader: Pubkey,
    /// Whether this was a buy (true) or sell (false)
    pub is_buy: bool,
    /// SOL amount involved
    pub sol_amount: u64,
    /// Token amount involved
    pub token_amount: u64,
    /// Platform fee paid (in lamports)
    pub platform_fee: u64,
    /// New virtual SOL reserves after trade
    pub virtual_sol_reserves: u64,
    /// New virtual token reserves after trade
    pub virtual_token_reserves: u64,
    /// New real SOL reserves after trade
    pub real_sol_reserves: u64,
    /// New real token reserves after trade
    pub real_token_reserves: u64,
    /// Current price after trade (lamports per token, scaled by 1e9)
    pub price: u64,
    /// Current market cap (in lamports)
    pub market_cap: u64,
    /// Timestamp
    pub timestamp: i64,
}

/// Event emitted when a token graduates to Raydium
#[event]
pub struct GraduationEvent {
    /// The token mint
    pub mint: Pubkey,
    /// Creator of the token
    pub creator: Pubkey,
    /// Bonding curve account
    pub bonding_curve: Pubkey,
    /// Final market cap at graduation (in lamports)
    pub final_market_cap: u64,
    /// SOL liquidity added to Raydium
    pub sol_liquidity: u64,
    /// Token liquidity added to Raydium
    pub token_liquidity: u64,
    /// Raydium pool address
    pub raydium_pool: Pubkey,
    /// Timestamp
    pub timestamp: i64,
}

/// Event emitted when global config is updated
#[event]
pub struct ConfigUpdatedEvent {
    /// Authority that made the update
    pub authority: Pubkey,
    /// New fee recipient (if changed)
    pub fee_recipient: Pubkey,
    /// New platform fee in basis points
    pub platform_fee_bps: u16,
    /// Whether protocol is paused
    pub paused: bool,
    /// Timestamp
    pub timestamp: i64,
}

/// Event emitted when protocol is paused/unpaused
#[event]
pub struct ProtocolPausedEvent {
    /// Authority that triggered the pause
    pub authority: Pubkey,
    /// New paused state
    pub paused: bool,
    /// Timestamp
    pub timestamp: i64,
}
