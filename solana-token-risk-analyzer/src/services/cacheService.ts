import { TokenRiskScore, CachedAnalysis } from '../types';
import logger from '../utils/logger';

/**
 * In-memory cache service for risk analysis results
 * In production, this would use Redis
 */
export class CacheService {
  private cache: Map<string, CachedAnalysis>;
  private readonly defaultTTL: number; // milliseconds

  constructor(ttlSeconds: number = 300) {
    this.cache = new Map();
    this.defaultTTL = ttlSeconds * 1000;

    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached analysis if available and not expired
   */
  get(tokenAddress: string): TokenRiskScore | null {
    const cached = this.cache.get(tokenAddress);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(tokenAddress);
      return null;
    }

    logger.debug(`Cache hit for ${tokenAddress}`);
    return cached.data;
  }

  /**
   * Store analysis in cache
   */
  set(tokenAddress: string, data: TokenRiskScore, ttlSeconds?: number): void {
    const ttl = (ttlSeconds || this.defaultTTL / 1000) * 1000;
    const now = Date.now();

    this.cache.set(tokenAddress, {
      data,
      cachedAt: now,
      expiresAt: now + ttl,
    });

    logger.debug(`Cached analysis for ${tokenAddress}, expires in ${ttl / 1000}s`);
  }

  /**
   * Invalidate cache for a specific token
   */
  invalidate(tokenAddress: string): void {
    this.cache.delete(tokenAddress);
    logger.debug(`Invalidated cache for ${tokenAddress}`);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; oldestEntry: number | null } {
    let oldestEntry: number | null = null;

    for (const [, value] of this.cache) {
      if (oldestEntry === null || value.cachedAt < oldestEntry) {
        oldestEntry = value.cachedAt;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry,
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.cache) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: removed ${removed} expired entries`);
    }
  }
}

export default CacheService;
