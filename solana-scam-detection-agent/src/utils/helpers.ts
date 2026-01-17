import crypto from 'crypto';
import { AlertSeverity, ScamType } from '../types';

/**
 * Generate unique alert ID
 */
export function generateAlertId(): string {
  return `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async functions
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
 * Calculate confidence to severity mapping
 */
export function confidenceToSeverity(confidence: number): AlertSeverity {
  if (confidence >= 0.9) return 'CRITICAL';
  if (confidence >= 0.75) return 'DANGER';
  if (confidence >= 0.5) return 'WARNING';
  return 'INFO';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number | string): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

/**
 * Calculate days since timestamp
 */
export function daysSince(timestamp: number): number {
  const now = Date.now();
  const diffMs = now - timestamp * 1000;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Scam type to human readable
 */
export function scamTypeToReadable(scamType: ScamType | null): string {
  const mapping: Record<ScamType, string> = {
    RUG_PULL: 'Rug Pull',
    HONEYPOT: 'Honeypot',
    PUMP_AND_DUMP: 'Pump & Dump',
    FAKE_TOKEN: 'Fake/Clone Token',
    LIQUIDITY_DRAIN: 'Liquidity Drain',
    MINT_EXPLOIT: 'Mint Exploit',
    FREEZE_SCAM: 'Freeze Scam',
    UNKNOWN: 'Unknown Scam',
  };

  return scamType ? mapping[scamType] || 'Unknown' : 'N/A';
}

/**
 * Get emoji for severity
 */
export function severityEmoji(severity: AlertSeverity): string {
  const emojis: Record<AlertSeverity, string> = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    DANGER: '🚨',
    CRITICAL: '🔴',
  };
  return emojis[severity];
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Calculate Levenshtein distance for string similarity
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Check string similarity (0-1)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Known legitimate token symbols for fake detection
 */
export const KNOWN_TOKENS = [
  'SOL', 'USDC', 'USDT', 'BONK', 'JTO', 'JUP', 'PYTH', 'RAY', 'SRM',
  'ORCA', 'MNGO', 'STEP', 'COPE', 'FIDA', 'ATLAS', 'POLIS', 'GST',
  'GMT', 'DUST', 'SAMO', 'GRAPE', 'TULIP', 'PORT', 'SBR', 'SUNNY',
];

/**
 * Suspicious name patterns
 */
export const SUSPICIOUS_PATTERNS = [
  /elon/i, /musk/i, /doge/i, /shib/i, /moon/i, /safe/i,
  /100x/i, /1000x/i, /gem/i, /rocket/i, /lambo/i,
  /free\s*money/i, /airdrop/i, /giveaway/i,
];

/**
 * Check if name contains suspicious patterns
 */
export function hasSuspiciousPattern(name: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Check if token might be impersonating known token
 */
export function checkFakeToken(symbol: string, name: string): {
  isFake: boolean;
  impersonating: string | null;
  similarity: number;
} {
  for (const known of KNOWN_TOKENS) {
    const symbolSim = stringSimilarity(symbol, known);
    const nameSim = stringSimilarity(name, known);

    // High similarity but not exact match = potential fake
    if ((symbolSim > 0.7 && symbolSim < 1) || (nameSim > 0.7 && nameSim < 1)) {
      return {
        isFake: true,
        impersonating: known,
        similarity: Math.max(symbolSim, nameSim),
      };
    }
  }

  return { isFake: false, impersonating: null, similarity: 0 };
}
