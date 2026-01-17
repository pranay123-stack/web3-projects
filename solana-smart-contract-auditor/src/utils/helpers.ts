import crypto from 'crypto';
import { RiskLevel, VulnerabilitySeverity, AuditSummary } from '../types';

/**
 * Generate unique audit ID
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Calculate risk level from score
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 90) return 'SAFE';
  if (score >= 70) return 'LOW';
  if (score >= 50) return 'MEDIUM';
  if (score >= 30) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calculate overall score from vulnerabilities
 */
export function calculateOverallScore(
  summary: AuditSummary,
  weights: { critical: number; high: number; medium: number; low: number } = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  }
): number {
  const deductions =
    summary.criticalIssues * weights.critical +
    summary.highIssues * weights.high +
    summary.mediumIssues * weights.medium +
    summary.lowIssues * weights.low;

  return Math.max(0, 100 - deductions);
}

/**
 * Severity to numeric value for sorting
 */
export function severityToNumber(severity: VulnerabilitySeverity): number {
  const mapping: Record<VulnerabilitySeverity, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFORMATIONAL: 1,
  };
  return mapping[severity];
}

/**
 * Sort vulnerabilities by severity
 */
export function sortBySeverity<T extends { severity: VulnerabilitySeverity }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => severityToNumber(b.severity) - severityToNumber(a.severity)
  );
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate SHA256 hash
 */
export function calculateHash(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper
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
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Get severity color for CLI
 */
export function getSeverityColor(severity: VulnerabilitySeverity): string {
  const colors: Record<VulnerabilitySeverity, string> = {
    CRITICAL: '\x1b[31m', // Red
    HIGH: '\x1b[33m',     // Yellow
    MEDIUM: '\x1b[35m',   // Magenta
    LOW: '\x1b[36m',      // Cyan
    INFORMATIONAL: '\x1b[37m', // White
  };
  return colors[severity];
}

/**
 * Reset color for CLI
 */
export const RESET_COLOR = '\x1b[0m';

/**
 * Format duration in human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Generate CWE URL
 */
export function getCweUrl(cweId: string): string {
  const id = cweId.replace('CWE-', '');
  return `https://cwe.mitre.org/data/definitions/${id}.html`;
}

/**
 * Known program IDs
 */
export const KNOWN_PROGRAMS: Record<string, string> = {
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Upgradeable Loader',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter Aggregator',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool',
};

/**
 * Get program name from address
 */
export function getProgramName(address: string): string {
  return KNOWN_PROGRAMS[address] || 'Unknown Program';
}
