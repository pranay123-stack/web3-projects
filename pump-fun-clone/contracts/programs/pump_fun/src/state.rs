use anchor_lang::prelude::*;

/// Global configuration for the pump.fun protocol
#[account]
#[derive(Default)]
pub struct GlobalConfig {
    /// Authority that can update global settings
    pub authority: Pubkey,
    /// Fee recipient address
    pub fee_recipient: Pubkey,
    /// Platform fee in basis points (e.g., 100 = 1%)
    pub platform_fee_bps: u16,
    /// Whether the protocol is paused
    pub paused: bool,
    /// Total tokens launched
    pub total_tokens_launched: u64,
    /// Total SOL volume traded
    pub total_volume_sol: u64,
    /// Bump seed for PDA
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 64],
}

impl GlobalConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // fee_recipient
        2 + // platform_fee_bps
        1 + // paused
        8 + // total_tokens_launched
        8 + // total_volume_sol
        1 + // bump
        64; // reserved
}

/// Bonding curve state for each token
#[account]
#[derive(Default)]
pub struct BondingCurve {
    /// The token mint this curve is for
    pub mint: Pubkey,
    /// Creator of this token
    pub creator: Pubkey,
    /// Virtual SOL reserves (starts with initial virtual reserves)
    pub virtual_sol_reserves: u64,
    /// Virtual token reserves (starts with initial virtual reserves)
    pub virtual_token_reserves: u64,
    /// Real SOL reserves (actual SOL locked in the curve)
    pub real_sol_reserves: u64,
    /// Real token reserves (actual tokens available for sale)
    pub real_token_reserves: u64,
    /// Total tokens sold
    pub tokens_sold: u64,
    /// Whether the token has graduated to Raydium
    pub graduated: bool,
    /// Timestamp when the token was created
    pub created_at: i64,
    /// Timestamp when graduation occurred (0 if not graduated)
    pub graduated_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 64],
}

impl BondingCurve {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // creator
        8 + // virtual_sol_reserves
        8 + // virtual_token_reserves
        8 + // real_sol_reserves
        8 + // real_token_reserves
        8 + // tokens_sold
        1 + // graduated
        8 + // created_at
        8 + // graduated_at
        1 + // bump
        64; // reserved

    /// Calculate the current price (SOL per token)
    /// Price = virtual_sol_reserves / virtual_token_reserves
    pub fn get_current_price(&self) -> u64 {
        if self.virtual_token_reserves == 0 {
            return 0;
        }
        // Price in lamports per token (scaled by 1e9 for precision)
        (self.virtual_sol_reserves as u128)
            .checked_mul(1_000_000_000)
            .unwrap()
            .checked_div(self.virtual_token_reserves as u128)
            .unwrap() as u64
    }

    /// Calculate tokens out for a given SOL amount (buy)
    /// Uses constant product formula: (x + dx) * (y - dy) = x * y
    /// dy = y - (x * y) / (x + dx)
    pub fn calculate_tokens_out(&self, sol_amount: u64) -> Result<u64> {
        if sol_amount == 0 {
            return Ok(0);
        }

        let k = (self.virtual_sol_reserves as u128)
            .checked_mul(self.virtual_token_reserves as u128)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let new_virtual_sol = (self.virtual_sol_reserves as u128)
            .checked_add(sol_amount as u128)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let new_virtual_tokens = k
            .checked_div(new_virtual_sol)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let tokens_out = (self.virtual_token_reserves as u128)
            .checked_sub(new_virtual_tokens)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        // Ensure we don't sell more than available
        let tokens_out = tokens_out.min(self.real_token_reserves as u128);

        Ok(tokens_out as u64)
    }

    /// Calculate SOL out for a given token amount (sell)
    /// Uses constant product formula: (x - dx) * (y + dy) = x * y
    /// dx = x - (x * y) / (y + dy)
    pub fn calculate_sol_out(&self, token_amount: u64) -> Result<u64> {
        if token_amount == 0 {
            return Ok(0);
        }

        let k = (self.virtual_sol_reserves as u128)
            .checked_mul(self.virtual_token_reserves as u128)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let new_virtual_tokens = (self.virtual_token_reserves as u128)
            .checked_add(token_amount as u128)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let new_virtual_sol = k
            .checked_div(new_virtual_tokens)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        let sol_out = (self.virtual_sol_reserves as u128)
            .checked_sub(new_virtual_sol)
            .ok_or(error!(crate::errors::PumpFunError::MathOverflow))?;

        // Ensure we don't return more SOL than available
        let sol_out = sol_out.min(self.real_sol_reserves as u128);

        Ok(sol_out as u64)
    }

    /// Calculate current market cap in lamports
    /// Market cap = current_price * total_supply
    pub fn get_market_cap(&self, total_supply: u64) -> u64 {
        let price = self.get_current_price();
        ((price as u128) * (total_supply as u128) / 1_000_000_000) as u64
    }
}

/// Token launch metadata
#[account]
#[derive(Default)]
pub struct TokenLaunch {
    /// The token mint
    pub mint: Pubkey,
    /// Token name
    pub name: [u8; 32],
    /// Token symbol
    pub symbol: [u8; 10],
    /// Metadata URI
    pub uri: [u8; 200],
    /// Creator
    pub creator: Pubkey,
    /// Associated bonding curve
    pub bonding_curve: Pubkey,
    /// Total supply
    pub total_supply: u64,
    /// Decimals
    pub decimals: u8,
    /// Created timestamp
    pub created_at: i64,
    /// Bump seed
    pub bump: u8,
    /// Reserved for future use
    pub _reserved: [u8; 64],
}

impl TokenLaunch {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // name
        10 + // symbol
        200 + // uri
        32 + // creator
        32 + // bonding_curve
        8 + // total_supply
        1 + // decimals
        8 + // created_at
        1 + // bump
        64; // reserved

    pub fn get_name(&self) -> String {
        String::from_utf8_lossy(&self.name)
            .trim_matches(char::from(0))
            .to_string()
    }

    pub fn get_symbol(&self) -> String {
        String::from_utf8_lossy(&self.symbol)
            .trim_matches(char::from(0))
            .to_string()
    }

    pub fn get_uri(&self) -> String {
        String::from_utf8_lossy(&self.uri)
            .trim_matches(char::from(0))
            .to_string()
    }

    pub fn set_name(&mut self, name: &str) {
        let bytes = name.as_bytes();
        let len = bytes.len().min(32);
        self.name[..len].copy_from_slice(&bytes[..len]);
    }

    pub fn set_symbol(&mut self, symbol: &str) {
        let bytes = symbol.as_bytes();
        let len = bytes.len().min(10);
        self.symbol[..len].copy_from_slice(&bytes[..len]);
    }

    pub fn set_uri(&mut self, uri: &str) {
        let bytes = uri.as_bytes();
        let len = bytes.len().min(200);
        self.uri[..len].copy_from_slice(&bytes[..len]);
    }
}
