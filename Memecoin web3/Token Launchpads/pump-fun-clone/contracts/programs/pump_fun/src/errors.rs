use anchor_lang::prelude::*;

#[error_code]
pub enum PumpFunError {
    #[msg("Math operation overflow")]
    MathOverflow,

    #[msg("Math operation underflow")]
    MathUnderflow,

    #[msg("Invalid token name length (1-32 characters)")]
    InvalidNameLength,

    #[msg("Invalid token symbol length (1-10 characters)")]
    InvalidSymbolLength,

    #[msg("Invalid URI length (max 200 characters)")]
    InvalidUriLength,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Insufficient SOL for purchase")]
    InsufficientSol,

    #[msg("Insufficient tokens for sale")]
    InsufficientTokens,

    #[msg("Token has already graduated")]
    AlreadyGraduated,

    #[msg("Token has not yet reached graduation threshold")]
    NotReadyForGraduation,

    #[msg("Protocol is currently paused")]
    ProtocolPaused,

    #[msg("Invalid fee recipient")]
    InvalidFeeRecipient,

    #[msg("Invalid authority")]
    InvalidAuthority,

    #[msg("Invalid initial reserves")]
    InvalidInitialReserves,

    #[msg("Zero amount not allowed")]
    ZeroAmount,

    #[msg("Bonding curve has no liquidity")]
    NoLiquidity,

    #[msg("Invalid bonding curve state")]
    InvalidBondingCurveState,

    #[msg("Token mint mismatch")]
    MintMismatch,

    #[msg("Invalid platform fee (max 1000 bps = 10%)")]
    InvalidPlatformFee,

    #[msg("Trade amount too small")]
    TradeTooSmall,

    #[msg("Trade amount exceeds available reserves")]
    TradeExceedsReserves,

    #[msg("Invalid virtual reserves ratio")]
    InvalidVirtualReserves,

    #[msg("Graduation liquidity insufficient")]
    InsufficientGraduationLiquidity,

    #[msg("Invalid Raydium pool configuration")]
    InvalidRaydiumConfig,

    #[msg("Creator fee transfer failed")]
    CreatorFeeTransferFailed,

    #[msg("Platform fee transfer failed")]
    PlatformFeeTransferFailed,
}
