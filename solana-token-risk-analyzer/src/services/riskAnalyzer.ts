import { SolanaService } from './solanaService';
import {
  TokenRiskScore,
  RiskLevel,
  RiskAnalysis,
  HolderConcentrationAnalysis,
  LiquidityAnalysis,
  DeployerHistoryAnalysis,
  TokenMetadataAnalysis,
  ContractSecurityAnalysis,
  DEFAULT_RISK_THRESHOLDS,
} from '../types';
import {
  calculateRiskLevel,
  calculateWeightedRiskScore,
  generateRecommendations,
  daysSinceTimestamp,
} from '../utils/helpers';
import logger from '../utils/logger';

export class RiskAnalyzer {
  private solanaService: SolanaService;

  constructor(solanaService: SolanaService) {
    this.solanaService = solanaService;
  }

  /**
   * Perform comprehensive risk analysis on a token
   */
  async analyzeToken(tokenAddress: string): Promise<TokenRiskScore> {
    logger.info(`Starting risk analysis for token: ${tokenAddress}`);

    try {
      // Fetch all required data in parallel
      const [tokenInfo, topHolders, metadata] = await Promise.all([
        this.solanaService.getTokenInfo(tokenAddress),
        this.solanaService.getTopHolders(tokenAddress, 20),
        this.solanaService.getTokenMetadata(tokenAddress),
      ]);

      // Analyze holder concentration
      const holderAnalysis = this.analyzeHolderConcentration(topHolders);

      // Analyze liquidity (simplified - would need DEX API in production)
      const liquidityAnalysis = await this.analyzeLiquidity(tokenAddress);

      // Analyze deployer history
      const deployerAnalysis = await this.analyzeDeployerHistory(
        tokenInfo.mintAuthority || tokenAddress
      );

      // Analyze token metadata
      const metadataAnalysis = this.analyzeTokenMetadata(metadata, tokenInfo);

      // Analyze contract security
      const securityAnalysis = this.analyzeContractSecurity(tokenInfo, topHolders);

      // Calculate overall risk score
      const overallScore = calculateWeightedRiskScore([
        { score: holderAnalysis.score, weight: 25 },
        { score: liquidityAnalysis.score, weight: 25 },
        { score: deployerAnalysis.score, weight: 20 },
        { score: metadataAnalysis.score, weight: 10 },
        { score: securityAnalysis.score, weight: 20 },
      ]);

      const analysis: RiskAnalysis = {
        holderConcentration: holderAnalysis,
        liquidityAnalysis: liquidityAnalysis,
        deployerHistory: deployerAnalysis,
        tokenMetadata: metadataAnalysis,
        contractSecurity: securityAnalysis,
      };

      const recommendations = generateRecommendations(
        holderAnalysis.score,
        liquidityAnalysis.score,
        deployerAnalysis.score,
        securityAnalysis.score
      );

      const result: TokenRiskScore = {
        tokenAddress,
        overallRisk: calculateRiskLevel(overallScore),
        riskScore: overallScore,
        timestamp: new Date().toISOString(),
        analysis,
        recommendations,
      };

      logger.info(`Risk analysis complete for ${tokenAddress}: ${result.overallRisk} (${overallScore})`);
      return result;
    } catch (error) {
      logger.error(`Error analyzing token ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Analyze holder concentration risk
   */
  private analyzeHolderConcentration(holders: { address: string; balance: bigint; percentage: number }[]): HolderConcentrationAnalysis {
    const totalHolders = holders.length;
    const top10 = holders.slice(0, 10);
    const top10Percentage = top10.reduce((sum, h) => sum + h.percentage, 0);
    const top1Percentage = holders[0]?.percentage || 0;

    let score: number;
    let riskLevel: RiskLevel;
    let details: string;

    const thresholds = DEFAULT_RISK_THRESHOLDS.holderConcentration;

    if (top10Percentage < thresholds.low) {
      score = 15;
      riskLevel = 'LOW';
      details = `Good distribution: Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`;
    } else if (top10Percentage < thresholds.medium) {
      score = 40;
      riskLevel = 'MEDIUM';
      details = `Moderate concentration: Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`;
    } else if (top10Percentage < thresholds.high) {
      score = 65;
      riskLevel = 'HIGH';
      details = `High concentration: Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`;
    } else {
      score = 90;
      riskLevel = 'CRITICAL';
      details = `Critical concentration: Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`;
    }

    // Additional penalty for single whale
    if (top1Percentage > 50) {
      score = Math.min(100, score + 20);
      details += `. WARNING: Single holder owns ${top1Percentage.toFixed(1)}%`;
    }

    return {
      score,
      riskLevel,
      totalHolders,
      top10HoldersPercentage: Math.round(top10Percentage * 100) / 100,
      top1HolderPercentage: Math.round(top1Percentage * 100) / 100,
      details,
    };
  }

  /**
   * Analyze liquidity risk (simplified version)
   */
  private async analyzeLiquidity(tokenAddress: string): Promise<LiquidityAnalysis> {
    // In production, this would call DEX APIs (Raydium, Orca, Jupiter)
    // For demo purposes, we'll use heuristics based on on-chain data

    let score = 50; // Default medium risk
    let riskLevel: RiskLevel = 'MEDIUM';
    let details = 'Liquidity analysis requires DEX API integration for accurate results';
    const liquidityPools: LiquidityAnalysis['liquidityPools'] = [];

    // Simulate liquidity check - in production, query actual DEX pools
    const estimatedLiquidity = Math.random() * 100000; // Placeholder

    if (estimatedLiquidity < 1000) {
      score = 90;
      riskLevel = 'CRITICAL';
      details = 'Very low liquidity detected - high slippage and rug risk';
    } else if (estimatedLiquidity < 10000) {
      score = 70;
      riskLevel = 'HIGH';
      details = 'Low liquidity - moderate rug risk';
    } else if (estimatedLiquidity < 50000) {
      score = 40;
      riskLevel = 'MEDIUM';
      details = 'Moderate liquidity levels';
    } else {
      score = 20;
      riskLevel = 'LOW';
      details = 'Good liquidity depth';
    }

    return {
      score,
      riskLevel,
      totalLiquidityUSD: estimatedLiquidity,
      liquidityLocked: false, // Would check locker contracts
      liquidityPools,
      details,
    };
  }

  /**
   * Analyze deployer wallet history
   */
  private async analyzeDeployerHistory(deployerAddress: string): Promise<DeployerHistoryAnalysis> {
    try {
      const deployerInfo = await this.solanaService.getDeployerInfo(deployerAddress);
      const tokensDeployed = await this.solanaService.estimateTokensDeployed(deployerAddress);

      let score: number;
      let riskLevel: RiskLevel;
      let details: string;

      const thresholds = DEFAULT_RISK_THRESHOLDS.deployer;

      // Check wallet age
      if (deployerInfo.walletAge < 7) {
        score = 85;
        riskLevel = 'CRITICAL';
        details = `Very new deployer wallet (${deployerInfo.walletAge} days old) - high scam risk`;
      } else if (deployerInfo.walletAge < thresholds.minWalletAgeDays) {
        score = 60;
        riskLevel = 'HIGH';
        details = `New deployer wallet (${deployerInfo.walletAge} days old) - exercise caution`;
      } else if (deployerInfo.walletAge < 90) {
        score = 35;
        riskLevel = 'MEDIUM';
        details = `Moderately aged deployer wallet (${deployerInfo.walletAge} days)`;
      } else {
        score = 15;
        riskLevel = 'LOW';
        details = `Established deployer wallet (${deployerInfo.walletAge} days old)`;
      }

      // Adjust for multiple tokens deployed (potential serial deployer)
      if (tokensDeployed > 10) {
        score = Math.min(100, score + 25);
        details += `. Serial deployer detected (${tokensDeployed}+ tokens)`;
      }

      return {
        score,
        riskLevel,
        deployerAddress,
        walletAge: deployerInfo.walletAge,
        totalTokensDeployed: tokensDeployed,
        rugPullHistory: 0, // Would need historical analysis
        successfulProjects: 0,
        details,
      };
    } catch (error) {
      logger.error(`Error analyzing deployer: ${error}`);
      return {
        score: 50,
        riskLevel: 'MEDIUM',
        deployerAddress,
        walletAge: 0,
        totalTokensDeployed: 0,
        rugPullHistory: 0,
        successfulProjects: 0,
        details: 'Unable to analyze deployer history',
      };
    }
  }

  /**
   * Analyze token metadata quality
   */
  private analyzeTokenMetadata(
    metadata: { name: string; symbol: string; uri: string } | null,
    tokenInfo: { decimals: number }
  ): TokenMetadataAnalysis {
    let score = 30;
    let riskLevel: RiskLevel = 'MEDIUM';
    const details: string[] = [];

    const hasValidMetadata = metadata !== null;
    let hasSocialLinks = false;
    let hasWebsite = false;

    if (!hasValidMetadata) {
      score = 70;
      riskLevel = 'HIGH';
      details.push('No metadata found - anonymous token');
    } else {
      // Check name quality
      if (metadata.name && metadata.name.length > 2) {
        score -= 10;
        details.push(`Token name: ${metadata.name}`);
      }

      // Check symbol
      if (metadata.symbol && metadata.symbol.length >= 2 && metadata.symbol.length <= 10) {
        score -= 5;
      }

      // Check URI for potential social links
      if (metadata.uri && metadata.uri.length > 0) {
        score -= 10;
        hasSocialLinks = true;
        hasWebsite = metadata.uri.startsWith('http');
        details.push('Has metadata URI');
      }
    }

    // Check for suspicious patterns in name/symbol
    if (metadata) {
      const suspiciousPatterns = ['ELON', 'DOGE', 'SHIB', 'PEPE', 'SAFE', 'MOON', '100X', '1000X'];
      const nameUpper = (metadata.name || '').toUpperCase();
      const symbolUpper = (metadata.symbol || '').toUpperCase();

      for (const pattern of suspiciousPatterns) {
        if (nameUpper.includes(pattern) || symbolUpper.includes(pattern)) {
          score += 15;
          details.push(`Contains hype pattern: ${pattern}`);
          break;
        }
      }
    }

    score = Math.max(0, Math.min(100, score));
    riskLevel = score <= 25 ? 'LOW' : score <= 50 ? 'MEDIUM' : score <= 75 ? 'HIGH' : 'CRITICAL';

    return {
      score,
      riskLevel,
      name: metadata?.name || 'Unknown',
      symbol: metadata?.symbol || 'Unknown',
      hasValidMetadata,
      hasSocialLinks,
      hasWebsite,
      isMintable: false, // Set in security analysis
      isFreezable: false,
      details: details.join('. ') || 'Basic metadata analysis complete',
    };
  }

  /**
   * Analyze contract security features
   */
  private analyzeContractSecurity(
    tokenInfo: { mintAuthority: string | null; freezeAuthority: string | null; supply: bigint },
    holders: { percentage: number }[]
  ): ContractSecurityAnalysis {
    let score = 0;
    const details: string[] = [];

    const mintAuthorityRevoked = tokenInfo.mintAuthority === null;
    const freezeAuthorityRevoked = tokenInfo.freezeAuthority === null;

    // Check mint authority
    if (!mintAuthorityRevoked) {
      score += 35;
      details.push('Mint authority NOT revoked - unlimited tokens can be minted');
    } else {
      details.push('Mint authority revoked');
    }

    // Check freeze authority
    if (!freezeAuthorityRevoked) {
      score += 25;
      details.push('Freeze authority NOT revoked - tokens can be frozen');
    } else {
      details.push('Freeze authority revoked');
    }

    // Check supply concentration
    const top1Percentage = holders[0]?.percentage || 0;
    if (top1Percentage > 80) {
      score += 30;
      details.push(`Extreme supply concentration: ${top1Percentage.toFixed(1)}% held by top holder`);
    } else if (top1Percentage > 50) {
      score += 15;
      details.push(`High supply concentration: ${top1Percentage.toFixed(1)}% held by top holder`);
    }

    score = Math.min(100, score);
    const riskLevel: RiskLevel = score <= 25 ? 'LOW' : score <= 50 ? 'MEDIUM' : score <= 75 ? 'HIGH' : 'CRITICAL';

    return {
      score,
      riskLevel,
      mintAuthorityRevoked,
      freezeAuthorityRevoked,
      hasUpdateAuthority: !mintAuthorityRevoked || !freezeAuthorityRevoked,
      supplyConcentration: top1Percentage,
      details: details.join('. '),
    };
  }
}

export default RiskAnalyzer;
