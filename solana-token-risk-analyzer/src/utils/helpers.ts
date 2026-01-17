import { RiskLevel } from '../types';

/**
 * Calculate risk level based on score
 */
export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calculate weighted average of risk scores
 */
export function calculateWeightedRiskScore(
  scores: { score: number; weight: number }[]
): number {
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = scores.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  );
  return Math.round(weightedSum / totalWeight);
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if address is valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Calculate days from timestamp
 */
export function daysSinceTimestamp(timestamp: number): number {
  const now = Date.now();
  const diffMs = now - timestamp * 1000;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate risk recommendations based on analysis
 */
export function generateRecommendations(
  holderScore: number,
  liquidityScore: number,
  deployerScore: number,
  securityScore: number
): string[] {
  const recommendations: string[] = [];

  if (holderScore > 50) {
    recommendations.push(
      'High holder concentration detected - consider waiting for better distribution'
    );
  }

  if (liquidityScore > 50) {
    recommendations.push(
      'Low or unlocked liquidity - high risk of liquidity pull'
    );
  }

  if (deployerScore > 50) {
    recommendations.push(
      'Deployer wallet has suspicious history - proceed with extreme caution'
    );
  }

  if (securityScore > 50) {
    recommendations.push(
      'Token authorities not revoked - deployer can mint or freeze tokens'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Token appears relatively safe based on on-chain metrics');
    recommendations.push('Always DYOR and never invest more than you can afford to lose');
  }

  return recommendations;
}
