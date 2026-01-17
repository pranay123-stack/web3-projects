import { SolanaMonitor } from '../services/solanaMonitor';
import {
  ScamDetectionResult,
  ScamIndicator,
  ScamType,
  TokenMetadata,
  FeatureVector,
} from '../types';
import logger from '../utils/logger';
import {
  hasSuspiciousPattern,
  checkFakeToken,
  daysSince,
} from '../utils/helpers';

export class ScamDetector {
  private solanaMonitor: SolanaMonitor;

  // Indicator weights
  private readonly WEIGHTS = {
    MINT_AUTHORITY: 0.20,
    FREEZE_AUTHORITY: 0.15,
    HOLDER_CONCENTRATION: 0.20,
    DEPLOYER_AGE: 0.15,
    SUSPICIOUS_NAME: 0.10,
    FAKE_TOKEN: 0.15,
    NO_METADATA: 0.05,
  };

  constructor(solanaMonitor: SolanaMonitor) {
    this.solanaMonitor = solanaMonitor;
  }

  /**
   * Perform comprehensive scam detection on a token
   */
  async detectScam(tokenAddress: string): Promise<ScamDetectionResult> {
    logger.info(`Analyzing token for scams: ${tokenAddress}`);

    try {
      // Fetch token info
      const metadata = await this.solanaMonitor.getTokenInfo(tokenAddress);
      const topHolders = await this.solanaMonitor.getTopHolders(tokenAddress, 10);
      const deployerAge = await this.solanaMonitor.getWalletAge(metadata.deployer);

      // Run all detection checks
      const indicators: ScamIndicator[] = [];

      // 1. Mint Authority Check
      indicators.push(this.checkMintAuthority(metadata));

      // 2. Freeze Authority Check
      indicators.push(this.checkFreezeAuthority(metadata));

      // 3. Holder Concentration Check
      indicators.push(this.checkHolderConcentration(topHolders));

      // 4. Deployer Age Check
      indicators.push(this.checkDeployerAge(deployerAge));

      // 5. Suspicious Name Pattern Check
      indicators.push(this.checkSuspiciousName(metadata.name, metadata.symbol));

      // 6. Fake Token Check
      indicators.push(this.checkForFakeToken(metadata.name, metadata.symbol));

      // 7. Metadata Quality Check
      indicators.push(this.checkMetadataQuality(metadata));

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(indicators);
      const confidence = this.calculateConfidence(indicators);

      // Determine if it's a scam and what type
      const { isScam, scamType } = this.classifyToken(indicators, riskScore);

      // Generate recommendation
      const recommendation = this.generateRecommendation(isScam, riskScore, indicators);

      const result: ScamDetectionResult = {
        tokenAddress,
        timestamp: new Date().toISOString(),
        isScam,
        confidence,
        scamType,
        indicators,
        riskScore,
        recommendation,
        metadata,
      };

      logger.info(
        `Scam detection complete for ${tokenAddress}: isScam=${isScam}, confidence=${confidence.toFixed(2)}, riskScore=${riskScore}`
      );

      return result;
    } catch (error) {
      logger.error(`Error detecting scam for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Check if mint authority is still active
   */
  private checkMintAuthority(metadata: TokenMetadata): ScamIndicator {
    const detected = metadata.mintAuthority !== null;

    return {
      name: 'MINT_AUTHORITY_ACTIVE',
      detected,
      severity: detected ? 'HIGH' : 'LOW',
      description: detected
        ? 'Mint authority is NOT revoked - token supply can be increased'
        : 'Mint authority is revoked',
      weight: this.WEIGHTS.MINT_AUTHORITY,
    };
  }

  /**
   * Check if freeze authority is still active
   */
  private checkFreezeAuthority(metadata: TokenMetadata): ScamIndicator {
    const detected = metadata.freezeAuthority !== null;

    return {
      name: 'FREEZE_AUTHORITY_ACTIVE',
      detected,
      severity: detected ? 'HIGH' : 'LOW',
      description: detected
        ? 'Freeze authority is NOT revoked - tokens can be frozen'
        : 'Freeze authority is revoked',
      weight: this.WEIGHTS.FREEZE_AUTHORITY,
    };
  }

  /**
   * Check holder concentration
   */
  private checkHolderConcentration(
    holders: { address: string; percentage: number }[]
  ): ScamIndicator {
    const top10Percentage = holders.reduce((sum, h) => sum + h.percentage, 0);
    const top1Percentage = holders[0]?.percentage || 0;

    // Critical if top holder has >50% or top 10 have >80%
    const isCritical = top1Percentage > 50 || top10Percentage > 80;
    const isHigh = top1Percentage > 30 || top10Percentage > 60;
    const detected = isHigh;

    return {
      name: 'HIGH_HOLDER_CONCENTRATION',
      detected,
      severity: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW',
      description: detected
        ? `High concentration: Top holder ${top1Percentage.toFixed(1)}%, Top 10 ${top10Percentage.toFixed(1)}%`
        : `Normal distribution: Top 10 hold ${top10Percentage.toFixed(1)}%`,
      weight: this.WEIGHTS.HOLDER_CONCENTRATION,
    };
  }

  /**
   * Check deployer wallet age
   */
  private checkDeployerAge(ageInDays: number): ScamIndicator {
    const detected = ageInDays < 7;
    const isNew = ageInDays < 30;

    return {
      name: 'NEW_DEPLOYER_WALLET',
      detected,
      severity: detected ? 'HIGH' : isNew ? 'MEDIUM' : 'LOW',
      description: detected
        ? `Very new deployer wallet (${ageInDays} days old)`
        : `Deployer wallet age: ${ageInDays} days`,
      weight: this.WEIGHTS.DEPLOYER_AGE,
    };
  }

  /**
   * Check for suspicious name patterns
   */
  private checkSuspiciousName(name: string, symbol: string): ScamIndicator {
    const nameIsSuspicious = hasSuspiciousPattern(name);
    const symbolIsSuspicious = hasSuspiciousPattern(symbol);
    const detected = nameIsSuspicious || symbolIsSuspicious;

    return {
      name: 'SUSPICIOUS_NAME_PATTERN',
      detected,
      severity: detected ? 'MEDIUM' : 'LOW',
      description: detected
        ? `Suspicious pattern detected in ${nameIsSuspicious ? 'name' : 'symbol'}`
        : 'No suspicious patterns in name/symbol',
      weight: this.WEIGHTS.SUSPICIOUS_NAME,
    };
  }

  /**
   * Check if token is impersonating a known token
   */
  private checkForFakeToken(name: string, symbol: string): ScamIndicator {
    const result = checkFakeToken(symbol, name);

    return {
      name: 'FAKE_TOKEN_IMPERSONATION',
      detected: result.isFake,
      severity: result.isFake ? 'CRITICAL' : 'LOW',
      description: result.isFake
        ? `Potentially impersonating ${result.impersonating} (${(result.similarity * 100).toFixed(0)}% similar)`
        : 'Not impersonating known tokens',
      weight: this.WEIGHTS.FAKE_TOKEN,
    };
  }

  /**
   * Check metadata quality
   */
  private checkMetadataQuality(metadata: TokenMetadata): ScamIndicator {
    const detected = !metadata.hasMetadata;

    return {
      name: 'NO_METADATA',
      detected,
      severity: detected ? 'MEDIUM' : 'LOW',
      description: detected
        ? 'Token has no on-chain metadata'
        : 'Token has valid metadata',
      weight: this.WEIGHTS.NO_METADATA,
    };
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateRiskScore(indicators: ScamIndicator[]): number {
    let score = 0;
    let totalWeight = 0;

    for (const indicator of indicators) {
      totalWeight += indicator.weight;
      if (indicator.detected) {
        const severityMultiplier =
          indicator.severity === 'CRITICAL' ? 1.0
          : indicator.severity === 'HIGH' ? 0.8
          : indicator.severity === 'MEDIUM' ? 0.5
          : 0.2;

        score += indicator.weight * severityMultiplier * 100;
      }
    }

    return Math.round(score / totalWeight);
  }

  /**
   * Calculate detection confidence (0-1)
   */
  private calculateConfidence(indicators: ScamIndicator[]): number {
    const detectedCount = indicators.filter((i) => i.detected).length;
    const criticalCount = indicators.filter(
      (i) => i.detected && i.severity === 'CRITICAL'
    ).length;
    const highCount = indicators.filter(
      (i) => i.detected && i.severity === 'HIGH'
    ).length;

    // Base confidence on number and severity of detected indicators
    let confidence = detectedCount / indicators.length;

    // Boost for critical/high severity
    confidence += criticalCount * 0.15;
    confidence += highCount * 0.08;

    return Math.min(1, confidence);
  }

  /**
   * Classify token and determine scam type
   */
  private classifyToken(
    indicators: ScamIndicator[],
    riskScore: number
  ): { isScam: boolean; scamType: ScamType | null } {
    // Check for specific scam patterns
    const isFake = indicators.find((i) => i.name === 'FAKE_TOKEN_IMPERSONATION')?.detected;
    const hasMintAuth = indicators.find((i) => i.name === 'MINT_AUTHORITY_ACTIVE')?.detected;
    const hasFreezeAuth = indicators.find((i) => i.name === 'FREEZE_AUTHORITY_ACTIVE')?.detected;
    const highConcentration = indicators.find((i) => i.name === 'HIGH_HOLDER_CONCENTRATION')?.detected;

    // Determine if it's a scam based on risk score threshold
    const isScam = riskScore >= 60;

    if (!isScam) {
      return { isScam: false, scamType: null };
    }

    // Classify scam type
    let scamType: ScamType = 'UNKNOWN';

    if (isFake) {
      scamType = 'FAKE_TOKEN';
    } else if (hasMintAuth && highConcentration) {
      scamType = 'MINT_EXPLOIT';
    } else if (hasFreezeAuth) {
      scamType = 'HONEYPOT';
    } else if (highConcentration) {
      scamType = 'RUG_PULL';
    }

    return { isScam, scamType };
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(
    isScam: boolean,
    riskScore: number,
    indicators: ScamIndicator[]
  ): string {
    if (!isScam && riskScore < 30) {
      return 'Token appears relatively safe based on on-chain metrics. Always DYOR.';
    }

    if (!isScam && riskScore < 60) {
      return 'Token has some risk indicators. Exercise caution and verify project legitimacy.';
    }

    const criticalIndicators = indicators.filter(
      (i) => i.detected && (i.severity === 'CRITICAL' || i.severity === 'HIGH')
    );

    const warnings = criticalIndicators
      .map((i) => i.description)
      .slice(0, 3)
      .join('; ');

    return `HIGH RISK - Likely scam. Issues: ${warnings}. Do NOT interact with this token.`;
  }

  /**
   * Extract features for ML model
   */
  extractFeatures(
    metadata: TokenMetadata,
    holders: { percentage: number }[],
    deployerAge: number
  ): FeatureVector {
    const top10Percentage = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);

    return {
      holderConcentration: top10Percentage / 100,
      deployerAge: Math.min(deployerAge / 365, 1), // Normalize to 1 year
      liquidityRatio: 0.5, // Placeholder - would need DEX data
      mintAuthorityActive: metadata.mintAuthority ? 1 : 0,
      freezeAuthorityActive: metadata.freezeAuthority ? 1 : 0,
      transferCount: 0, // Placeholder
      uniqueHolders: holders.length / 1000, // Normalize
      namePatternScore: hasSuspiciousPattern(metadata.name) ? 1 : 0,
      symbolPatternScore: hasSuspiciousPattern(metadata.symbol) ? 1 : 0,
      metadataQuality: metadata.hasMetadata ? 1 : 0,
    };
  }
}

export default ScamDetector;
