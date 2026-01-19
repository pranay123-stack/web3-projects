use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

pub mod constants;
pub mod errors;
pub mod events;
pub mod state;

use constants::*;
use errors::PumpFunError;
use events::*;
use state::*;

declare_id!("PumpFun11111111111111111111111111111111111");

#[program]
pub mod pump_fun {
    use super::*;

    /// Initialize the global configuration
    pub fn initialize(ctx: Context<Initialize>, platform_fee_bps: u16) -> Result<()> {
        require!(
            platform_fee_bps <= MAX_PLATFORM_FEE_BPS,
            PumpFunError::InvalidPlatformFee
        );

        let config = &mut ctx.accounts.global_config;
        config.authority = ctx.accounts.authority.key();
        config.fee_recipient = ctx.accounts.fee_recipient.key();
        config.platform_fee_bps = platform_fee_bps;
        config.paused = false;
        config.total_tokens_launched = 0;
        config.total_volume_sol = 0;
        config.bump = ctx.bumps.global_config;

        Ok(())
    }

    /// Create a new token with bonding curve
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        initial_virtual_sol_reserves: u64,
        initial_virtual_token_reserves: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.global_config;
        require!(!config.paused, PumpFunError::ProtocolPaused);

        // Validate inputs
        require!(
            !name.is_empty() && name.len() <= MAX_NAME_LENGTH,
            PumpFunError::InvalidNameLength
        );
        require!(
            !symbol.is_empty() && symbol.len() <= MAX_SYMBOL_LENGTH,
            PumpFunError::InvalidSymbolLength
        );
        require!(uri.len() <= MAX_URI_LENGTH, PumpFunError::InvalidUriLength);
        require!(
            initial_virtual_sol_reserves > 0 && initial_virtual_token_reserves > 0,
            PumpFunError::InvalidInitialReserves
        );

        let clock = Clock::get()?;

        // Initialize bonding curve
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        bonding_curve.mint = ctx.accounts.mint.key();
        bonding_curve.creator = ctx.accounts.creator.key();
        bonding_curve.virtual_sol_reserves = initial_virtual_sol_reserves;
        bonding_curve.virtual_token_reserves = initial_virtual_token_reserves;
        bonding_curve.real_sol_reserves = 0;
        bonding_curve.real_token_reserves = INITIAL_REAL_TOKEN_RESERVES;
        bonding_curve.tokens_sold = 0;
        bonding_curve.graduated = false;
        bonding_curve.created_at = clock.unix_timestamp;
        bonding_curve.graduated_at = 0;
        bonding_curve.bump = ctx.bumps.bonding_curve;

        // Initialize token launch metadata
        let token_launch = &mut ctx.accounts.token_launch;
        token_launch.mint = ctx.accounts.mint.key();
        token_launch.set_name(&name);
        token_launch.set_symbol(&symbol);
        token_launch.set_uri(&uri);
        token_launch.creator = ctx.accounts.creator.key();
        token_launch.bonding_curve = bonding_curve.key();
        token_launch.total_supply = TOTAL_SUPPLY;
        token_launch.decimals = TOKEN_DECIMALS;
        token_launch.created_at = clock.unix_timestamp;
        token_launch.bump = ctx.bumps.token_launch;

        // Mint initial supply to bonding curve vault
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            MINT_AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.bonding_curve_vault.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            INITIAL_REAL_TOKEN_RESERVES,
        )?;

        // Create token metadata
        let metadata_seeds = &[
            MINT_AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let metadata_signer_seeds = &[&metadata_seeds[..]];

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint_authority.to_account_info(),
                    payer: ctx.accounts.creator.to_account_info(),
                    update_authority: ctx.accounts.mint_authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                metadata_signer_seeds,
            ),
            DataV2 {
                name: name.clone(),
                symbol: symbol.clone(),
                uri: uri.clone(),
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true,  // is_mutable
            true,  // update_authority_is_signer
            None,  // collection_details
        )?;

        // Update global config
        let config = &mut ctx.accounts.global_config;
        config.total_tokens_launched = config
            .total_tokens_launched
            .checked_add(1)
            .ok_or(PumpFunError::MathOverflow)?;

        // Emit event
        emit!(TokenCreatedEvent {
            mint: ctx.accounts.mint.key(),
            creator: ctx.accounts.creator.key(),
            name,
            symbol,
            uri,
            bonding_curve: bonding_curve.key(),
            initial_virtual_sol_reserves,
            initial_virtual_token_reserves,
            total_supply: TOTAL_SUPPLY,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Buy tokens using SOL
    pub fn buy(
        ctx: Context<Buy>,
        sol_amount: u64,
        min_tokens_out: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.global_config;
        require!(!config.paused, PumpFunError::ProtocolPaused);
        require!(sol_amount >= MIN_TRADE_AMOUNT, PumpFunError::TradeTooSmall);

        let bonding_curve = &mut ctx.accounts.bonding_curve;
        require!(!bonding_curve.graduated, PumpFunError::AlreadyGraduated);
        require!(
            bonding_curve.real_token_reserves > 0,
            PumpFunError::NoLiquidity
        );

        // Calculate platform fee
        let platform_fee = sol_amount
            .checked_mul(config.platform_fee_bps as u64)
            .ok_or(PumpFunError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PumpFunError::MathOverflow)?;

        let sol_after_fee = sol_amount
            .checked_sub(platform_fee)
            .ok_or(PumpFunError::MathUnderflow)?;

        // Calculate tokens out
        let tokens_out = bonding_curve.calculate_tokens_out(sol_after_fee)?;
        require!(tokens_out > 0, PumpFunError::ZeroAmount);
        require!(
            tokens_out >= min_tokens_out,
            PumpFunError::SlippageExceeded
        );
        require!(
            tokens_out <= bonding_curve.real_token_reserves,
            PumpFunError::TradeExceedsReserves
        );

        // Transfer SOL from buyer to vault
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.sol_vault.to_account_info(),
                },
            ),
            sol_after_fee,
        )?;

        // Transfer platform fee
        if platform_fee > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.buyer.to_account_info(),
                        to: ctx.accounts.fee_recipient.to_account_info(),
                    },
                ),
                platform_fee,
            )?;
        }

        // Transfer tokens from vault to buyer
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            BONDING_CURVE_SEED,
            mint_key.as_ref(),
            &[bonding_curve.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bonding_curve_vault.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.bonding_curve.to_account_info(),
                },
                signer_seeds,
            ),
            tokens_out,
        )?;

        // Update bonding curve state
        bonding_curve.virtual_sol_reserves = bonding_curve
            .virtual_sol_reserves
            .checked_add(sol_after_fee)
            .ok_or(PumpFunError::MathOverflow)?;
        bonding_curve.virtual_token_reserves = bonding_curve
            .virtual_token_reserves
            .checked_sub(tokens_out)
            .ok_or(PumpFunError::MathUnderflow)?;
        bonding_curve.real_sol_reserves = bonding_curve
            .real_sol_reserves
            .checked_add(sol_after_fee)
            .ok_or(PumpFunError::MathOverflow)?;
        bonding_curve.real_token_reserves = bonding_curve
            .real_token_reserves
            .checked_sub(tokens_out)
            .ok_or(PumpFunError::MathUnderflow)?;
        bonding_curve.tokens_sold = bonding_curve
            .tokens_sold
            .checked_add(tokens_out)
            .ok_or(PumpFunError::MathOverflow)?;

        // Update global volume
        let config = &mut ctx.accounts.global_config;
        config.total_volume_sol = config
            .total_volume_sol
            .checked_add(sol_amount)
            .ok_or(PumpFunError::MathOverflow)?;

        let clock = Clock::get()?;
        let token_launch = &ctx.accounts.token_launch;

        // Emit trade event
        emit!(TradeEvent {
            mint: ctx.accounts.mint.key(),
            trader: ctx.accounts.buyer.key(),
            is_buy: true,
            sol_amount,
            token_amount: tokens_out,
            platform_fee,
            virtual_sol_reserves: bonding_curve.virtual_sol_reserves,
            virtual_token_reserves: bonding_curve.virtual_token_reserves,
            real_sol_reserves: bonding_curve.real_sol_reserves,
            real_token_reserves: bonding_curve.real_token_reserves,
            price: bonding_curve.get_current_price(),
            market_cap: bonding_curve.get_market_cap(token_launch.total_supply),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Sell tokens for SOL
    pub fn sell(
        ctx: Context<Sell>,
        token_amount: u64,
        min_sol_out: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.global_config;
        require!(!config.paused, PumpFunError::ProtocolPaused);
        require!(token_amount > 0, PumpFunError::ZeroAmount);

        let bonding_curve = &mut ctx.accounts.bonding_curve;
        require!(!bonding_curve.graduated, PumpFunError::AlreadyGraduated);
        require!(bonding_curve.real_sol_reserves > 0, PumpFunError::NoLiquidity);

        // Calculate SOL out
        let sol_out_before_fee = bonding_curve.calculate_sol_out(token_amount)?;
        require!(sol_out_before_fee > 0, PumpFunError::ZeroAmount);

        // Calculate platform fee
        let platform_fee = sol_out_before_fee
            .checked_mul(config.platform_fee_bps as u64)
            .ok_or(PumpFunError::MathOverflow)?
            .checked_div(10000)
            .ok_or(PumpFunError::MathOverflow)?;

        let sol_out = sol_out_before_fee
            .checked_sub(platform_fee)
            .ok_or(PumpFunError::MathUnderflow)?;

        require!(sol_out >= min_sol_out, PumpFunError::SlippageExceeded);
        require!(
            sol_out_before_fee <= bonding_curve.real_sol_reserves,
            PumpFunError::TradeExceedsReserves
        );

        // Transfer tokens from seller to vault (they will be available for future buyers)
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.seller_token_account.to_account_info(),
                    to: ctx.accounts.bonding_curve_vault.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            token_amount,
        )?;

        // Transfer SOL from vault to seller
        let mint_key = ctx.accounts.mint.key();
        let vault_seeds = &[
            VAULT_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.sol_vault],
        ];
        let vault_signer_seeds = &[&vault_seeds[..]];

        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? = ctx
            .accounts
            .sol_vault
            .lamports()
            .checked_sub(sol_out)
            .ok_or(PumpFunError::MathUnderflow)?;
        **ctx.accounts.seller.try_borrow_mut_lamports()? = ctx
            .accounts
            .seller
            .lamports()
            .checked_add(sol_out)
            .ok_or(PumpFunError::MathOverflow)?;

        // Transfer platform fee from vault
        if platform_fee > 0 {
            **ctx.accounts.sol_vault.try_borrow_mut_lamports()? = ctx
                .accounts
                .sol_vault
                .lamports()
                .checked_sub(platform_fee)
                .ok_or(PumpFunError::MathUnderflow)?;
            **ctx.accounts.fee_recipient.try_borrow_mut_lamports()? = ctx
                .accounts
                .fee_recipient
                .lamports()
                .checked_add(platform_fee)
                .ok_or(PumpFunError::MathOverflow)?;
        }

        // Update bonding curve state
        bonding_curve.virtual_sol_reserves = bonding_curve
            .virtual_sol_reserves
            .checked_sub(sol_out_before_fee)
            .ok_or(PumpFunError::MathUnderflow)?;
        bonding_curve.virtual_token_reserves = bonding_curve
            .virtual_token_reserves
            .checked_add(token_amount)
            .ok_or(PumpFunError::MathOverflow)?;
        bonding_curve.real_sol_reserves = bonding_curve
            .real_sol_reserves
            .checked_sub(sol_out_before_fee)
            .ok_or(PumpFunError::MathUnderflow)?;
        bonding_curve.real_token_reserves = bonding_curve
            .real_token_reserves
            .checked_add(token_amount)
            .ok_or(PumpFunError::MathOverflow)?;
        bonding_curve.tokens_sold = bonding_curve
            .tokens_sold
            .checked_sub(token_amount)
            .ok_or(PumpFunError::MathUnderflow)?;

        // Update global volume
        let config = &mut ctx.accounts.global_config;
        config.total_volume_sol = config
            .total_volume_sol
            .checked_add(sol_out_before_fee)
            .ok_or(PumpFunError::MathOverflow)?;

        let clock = Clock::get()?;
        let token_launch = &ctx.accounts.token_launch;

        // Emit trade event
        emit!(TradeEvent {
            mint: ctx.accounts.mint.key(),
            trader: ctx.accounts.seller.key(),
            is_buy: false,
            sol_amount: sol_out_before_fee,
            token_amount,
            platform_fee,
            virtual_sol_reserves: bonding_curve.virtual_sol_reserves,
            virtual_token_reserves: bonding_curve.virtual_token_reserves,
            real_sol_reserves: bonding_curve.real_sol_reserves,
            real_token_reserves: bonding_curve.real_token_reserves,
            price: bonding_curve.get_current_price(),
            market_cap: bonding_curve.get_market_cap(token_launch.total_supply),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Graduate token to Raydium AMM
    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        let config = &ctx.accounts.global_config;
        require!(!config.paused, PumpFunError::ProtocolPaused);

        let bonding_curve = &mut ctx.accounts.bonding_curve;
        require!(!bonding_curve.graduated, PumpFunError::AlreadyGraduated);

        // Check if graduation threshold is met
        require!(
            bonding_curve.real_sol_reserves >= GRADUATION_SOL_THRESHOLD,
            PumpFunError::NotReadyForGraduation
        );

        let clock = Clock::get()?;
        let token_launch = &ctx.accounts.token_launch;

        // Calculate liquidity amounts
        let total_sol = bonding_curve.real_sol_reserves;

        let liquidity_sol = total_sol
            .checked_mul(GRADUATION_LIQUIDITY_PERCENTAGE)
            .ok_or(PumpFunError::MathOverflow)?
            .checked_div(100)
            .ok_or(PumpFunError::MathOverflow)?;

        let creator_reward = total_sol
            .checked_mul(CREATOR_GRADUATION_REWARD_PERCENTAGE)
            .ok_or(PumpFunError::MathOverflow)?
            .checked_div(100)
            .ok_or(PumpFunError::MathOverflow)?;

        let platform_fee = total_sol
            .checked_mul(PLATFORM_GRADUATION_FEE_PERCENTAGE)
            .ok_or(PumpFunError::MathOverflow)?
            .checked_div(100)
            .ok_or(PumpFunError::MathOverflow)?;

        // Remaining tokens go to Raydium pool
        let liquidity_tokens = bonding_curve.real_token_reserves;

        // Transfer creator reward
        let mint_key = ctx.accounts.mint.key();

        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? = ctx
            .accounts
            .sol_vault
            .lamports()
            .checked_sub(creator_reward)
            .ok_or(PumpFunError::MathUnderflow)?;
        **ctx.accounts.creator.try_borrow_mut_lamports()? = ctx
            .accounts
            .creator
            .lamports()
            .checked_add(creator_reward)
            .ok_or(PumpFunError::MathOverflow)?;

        // Transfer platform fee
        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? = ctx
            .accounts
            .sol_vault
            .lamports()
            .checked_sub(platform_fee)
            .ok_or(PumpFunError::MathUnderflow)?;
        **ctx.accounts.fee_recipient.try_borrow_mut_lamports()? = ctx
            .accounts
            .fee_recipient
            .lamports()
            .checked_add(platform_fee)
            .ok_or(PumpFunError::MathOverflow)?;

        // NOTE: In a real implementation, you would:
        // 1. Create a Raydium AMM pool using their CPI
        // 2. Add liquidity_sol and liquidity_tokens as initial liquidity
        // 3. The raydium_pool account would be the actual pool address
        //
        // For this implementation, we'll transfer the liquidity to a holding account
        // that would later be used by an off-chain process to create the Raydium pool,
        // OR you can implement the full Raydium CPI integration.

        // Transfer remaining SOL (liquidity) to Raydium pool placeholder
        **ctx.accounts.sol_vault.try_borrow_mut_lamports()? = ctx
            .accounts
            .sol_vault
            .lamports()
            .checked_sub(liquidity_sol)
            .ok_or(PumpFunError::MathUnderflow)?;
        **ctx.accounts.raydium_pool.try_borrow_mut_lamports()? = ctx
            .accounts
            .raydium_pool
            .lamports()
            .checked_add(liquidity_sol)
            .ok_or(PumpFunError::MathOverflow)?;

        // Transfer tokens to Raydium pool token account
        let bc_seeds = &[
            BONDING_CURVE_SEED,
            mint_key.as_ref(),
            &[bonding_curve.bump],
        ];
        let bc_signer_seeds = &[&bc_seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bonding_curve_vault.to_account_info(),
                    to: ctx.accounts.raydium_pool_token_account.to_account_info(),
                    authority: ctx.accounts.bonding_curve.to_account_info(),
                },
                bc_signer_seeds,
            ),
            liquidity_tokens,
        )?;

        // Mark as graduated
        bonding_curve.graduated = true;
        bonding_curve.graduated_at = clock.unix_timestamp;
        bonding_curve.real_sol_reserves = 0;
        bonding_curve.real_token_reserves = 0;

        // Emit graduation event
        emit!(GraduationEvent {
            mint: ctx.accounts.mint.key(),
            creator: ctx.accounts.creator.key(),
            bonding_curve: bonding_curve.key(),
            final_market_cap: bonding_curve.get_market_cap(token_launch.total_supply),
            sol_liquidity: liquidity_sol,
            token_liquidity: liquidity_tokens,
            raydium_pool: ctx.accounts.raydium_pool.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update global configuration (admin only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_fee_recipient: Option<Pubkey>,
        new_platform_fee_bps: Option<u16>,
        paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.global_config;

        if let Some(fee_recipient) = new_fee_recipient {
            config.fee_recipient = fee_recipient;
        }

        if let Some(fee_bps) = new_platform_fee_bps {
            require!(
                fee_bps <= MAX_PLATFORM_FEE_BPS,
                PumpFunError::InvalidPlatformFee
            );
            config.platform_fee_bps = fee_bps;
        }

        if let Some(pause_state) = paused {
            config.paused = pause_state;
        }

        let clock = Clock::get()?;

        emit!(ConfigUpdatedEvent {
            authority: ctx.accounts.authority.key(),
            fee_recipient: config.fee_recipient,
            platform_fee_bps: config.platform_fee_bps,
            paused: config.paused,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalConfig::LEN,
        seeds = [GLOBAL_CONFIG_SEED],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Fee recipient can be any account
    pub fee_recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct CreateToken<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = creator,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA for mint authority
    #[account(
        seeds = [MINT_AUTHORITY_SEED, mint.key().as_ref()],
        bump
    )]
    pub mint_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = creator,
        space = BondingCurve::LEN,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        init,
        payer = creator,
        space = TokenLaunch::LEN,
        seeds = [TOKEN_LAUNCH_SEED, mint.key().as_ref()],
        bump
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// CHECK: Metadata account for token
    #[account(
        mut,
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub metadata: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        seeds = [TOKEN_LAUNCH_SEED, mint.key().as_ref()],
        bump = token_launch.bump
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, mint.key().as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Fee recipient from global config
    #[account(
        mut,
        constraint = fee_recipient.key() == global_config.fee_recipient @ PumpFunError::InvalidFeeRecipient
    )]
    pub fee_recipient: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        seeds = [TOKEN_LAUNCH_SEED, mint.key().as_ref()],
        bump = token_launch.bump
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, mint.key().as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller: Signer<'info>,

    /// CHECK: Fee recipient from global config
    #[account(
        mut,
        constraint = fee_recipient.key() == global_config.fee_recipient @ PumpFunError::InvalidFeeRecipient
    )]
    pub fee_recipient: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Graduate<'info> {
    #[account(
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [BONDING_CURVE_SEED, mint.key().as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.creator == creator.key() @ PumpFunError::InvalidAuthority
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        seeds = [TOKEN_LAUNCH_SEED, mint.key().as_ref()],
        bump = token_launch.bump
    )]
    pub token_launch: Account<'info, TokenLaunch>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub bonding_curve_vault: Account<'info, TokenAccount>,

    /// CHECK: SOL vault PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, mint.key().as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    /// CHECK: Creator of the token
    #[account(mut)]
    pub creator: AccountInfo<'info>,

    /// CHECK: Fee recipient from global config
    #[account(
        mut,
        constraint = fee_recipient.key() == global_config.fee_recipient @ PumpFunError::InvalidFeeRecipient
    )]
    pub fee_recipient: AccountInfo<'info>,

    /// CHECK: Raydium pool account (placeholder for actual Raydium integration)
    #[account(mut)]
    pub raydium_pool: AccountInfo<'info>,

    /// CHECK: Raydium pool token account
    #[account(mut)]
    pub raydium_pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_CONFIG_SEED],
        bump = global_config.bump,
        constraint = global_config.authority == authority.key() @ PumpFunError::InvalidAuthority
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
