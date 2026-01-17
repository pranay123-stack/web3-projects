import { z } from 'zod';

// Token Risk Analysis Types
export interface TokenRiskScore {
  tokenAddress: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100, higher = riskier
  timestamp: string;
  analysis: RiskAnalysis;
  recommendations: string[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAnalysis {
  holderConcentration: HolderConcentrationAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  deployerHistory: DeployerHistoryAnalysis;
  tokenMetadata: TokenMetadataAnalysis;
  contractSecurity: ContractSecurityAnalysis;
}

export interface HolderConcentrationAnalysis {
  score: number;
  riskLevel: RiskLevel;
  totalHolders: number;
  top10HoldersPercentage: number;
  top1HolderPercentage: number;
  details: string;
}

export interface LiquidityAnalysis {
  score: number;
  riskLevel: RiskLevel;
  totalLiquidityUSD: number;
  liquidityLocked: boolean;
  lockDuration?: number; // days
  liquidityPools: LiquidityPool[];
  details: string;
}

export interface LiquidityPool {
  dex: string;
  poolAddress: string;
  liquidityUSD: number;
  volume24h: number;
}

export interface DeployerHistoryAnalysis {
  score: number;
  riskLevel: RiskLevel;
  deployerAddress: string;
  walletAge: number; // days
  totalTokensDeployed: number;
  rugPullHistory: number;
  successfulProjects: number;
  details: string;
}

export interface TokenMetadataAnalysis {
  score: number;
  riskLevel: RiskLevel;
  name: string;
  symbol: string;
  hasValidMetadata: boolean;
  hasSocialLinks: boolean;
  hasWebsite: boolean;
  isMintable: boolean;
  isFreezable: boolean;
  details: string;
}

export interface ContractSecurityAnalysis {
  score: number;
  riskLevel: RiskLevel;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  hasUpdateAuthority: boolean;
  supplyConcentration: number;
  details: string;
}

// Token Info from Solana
export interface TokenInfo {
  address: string;
  decimals: number;
  supply: bigint;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}

// Holder Distribution
export interface HolderInfo {
  address: string;
  balance: bigint;
  percentage: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Request Validation Schemas
export const TokenAddressSchema = z.string().regex(
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  'Invalid Solana token address'
);

export const AnalyzeRequestSchema = z.object({
  tokenAddress: TokenAddressSchema,
  includeHistory: z.boolean().optional().default(false),
});

export const BatchAnalyzeRequestSchema = z.object({
  tokenAddresses: z.array(TokenAddressSchema).max(10),
});

// Cache Types
export interface CachedAnalysis {
  data: TokenRiskScore;
  cachedAt: number;
  expiresAt: number;
}

// Risk Thresholds Configuration
export interface RiskThresholds {
  holderConcentration: {
    low: number;
    medium: number;
    high: number;
  };
  liquidity: {
    minSafeUSD: number;
    minLockedDays: number;
  };
  deployer: {
    minWalletAgeDays: number;
    maxRugPullCount: number;
  };
}

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  holderConcentration: {
    low: 30,    // Top 10 holders < 30%
    medium: 50, // Top 10 holders < 50%
    high: 70,   // Top 10 holders < 70%
  },
  liquidity: {
    minSafeUSD: 10000,
    minLockedDays: 30,
  },
  deployer: {
    minWalletAgeDays: 30,
    maxRugPullCount: 0,
  },
};
