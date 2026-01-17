const Redis = require('ioredis');
const tradeEvents = require('../events/tradeEvents');

/**
 * Price Service
 * Handles price tracking, calculations, and caching for tokens
 */
class PriceService {
  constructor() {
    this.redis = null;
    this.localCache = new Map();
    this.priceHistory = new Map();

    // Configuration
    this.config = {
      historyMaxLength: 1000, // Max price points per token
      historyTTLMs: 24 * 60 * 60 * 1000, // 24 hours
      cachePrefix: 'price:',
      cacheTTL: 300, // 5 minutes Redis TTL
      updateThrottleMs: 100, // Throttle updates
    };

    this.lastUpdateTimes = new Map();
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  initializeRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.redis.on('connect', () => {
          console.log('Price service connected to Redis');
        });
        this.redis.on('error', (err) => {
          console.error('Price service Redis error:', err.message);
        });
      } catch (error) {
        console.warn('Price service: Redis not available, using in-memory storage');
        this.redis = null;
      }
    } else {
      console.log('Price service: Using in-memory storage (no Redis URL)');
    }
  }

  /**
   * Update token price
   * @param {string} tokenMint - Token mint address
   * @param {number} price - New price in SOL
   * @param {object} [metadata] - Additional price metadata
   * @returns {object} Updated price data
   */
  async updatePrice(tokenMint, price, metadata = {}) {
    if (!tokenMint || typeof price !== 'number') {
      throw new Error('Token mint and price are required');
    }

    // Throttle updates
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(tokenMint) || 0;
    if (now - lastUpdate < this.config.updateThrottleMs) {
      return this.getPrice(tokenMint);
    }
    this.lastUpdateTimes.set(tokenMint, now);

    // Get previous price
    const previousData = await this.getPrice(tokenMint);
    const previousPrice = previousData?.price || price;

    // Calculate price change
    const priceChange = price - previousPrice;
    const priceChangePercent = previousPrice > 0
      ? ((price - previousPrice) / previousPrice) * 100
      : 0;

    // Build price data
    const priceData = {
      price,
      previousPrice,
      priceChange,
      priceChangePercent,
      priceUsd: metadata.priceUsd || null,
      timestamp: now,
      ...metadata,
    };

    // Store in cache
    await this.setCachePrice(tokenMint, priceData);

    // Add to price history
    await this.addPriceHistory(tokenMint, price, now);

    // Calculate 24h stats
    const stats24h = await this.calculate24hStats(tokenMint);
    priceData.high24h = stats24h.high;
    priceData.low24h = stats24h.low;
    priceData.change24h = stats24h.change;
    priceData.changePercent24h = stats24h.changePercent;

    // Emit price update event
    if (Math.abs(priceChangePercent) > 0.01) {
      tradeEvents.emitPriceUpdate(tokenMint, {
        ...priceData,
        direction: priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral',
      });
    }

    return priceData;
  }

  /**
   * Get current price for a token
   * @param {string} tokenMint - Token mint address
   * @returns {object|null} Price data
   */
  async getPrice(tokenMint) {
    if (!tokenMint) return null;

    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(`${this.config.cachePrefix}${tokenMint}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis get error:', error.message);
      }
    }

    // Fall back to local cache
    return this.localCache.get(tokenMint) || null;
  }

  /**
   * Get prices for multiple tokens
   * @param {string[]} tokenMints - Array of token mint addresses
   * @returns {Map} Map of token mint to price data
   */
  async getPrices(tokenMints) {
    const prices = new Map();

    if (this.redis && tokenMints.length > 0) {
      try {
        const keys = tokenMints.map((mint) => `${this.config.cachePrefix}${mint}`);
        const results = await this.redis.mget(...keys);

        results.forEach((result, index) => {
          if (result) {
            prices.set(tokenMints[index], JSON.parse(result));
          }
        });
      } catch (error) {
        console.error('Redis mget error:', error.message);
      }
    }

    // Fill in from local cache for any missing
    for (const mint of tokenMints) {
      if (!prices.has(mint)) {
        const localPrice = this.localCache.get(mint);
        if (localPrice) {
          prices.set(mint, localPrice);
        }
      }
    }

    return prices;
  }

  /**
   * Set price in cache
   * @param {string} tokenMint - Token mint address
   * @param {object} priceData - Price data
   */
  async setCachePrice(tokenMint, priceData) {
    // Always update local cache
    this.localCache.set(tokenMint, priceData);

    // Update Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(
          `${this.config.cachePrefix}${tokenMint}`,
          this.config.cacheTTL,
          JSON.stringify(priceData)
        );
      } catch (error) {
        console.error('Redis setex error:', error.message);
      }
    }
  }

  /**
   * Add price point to history
   * @param {string} tokenMint - Token mint address
   * @param {number} price - Price
   * @param {number} timestamp - Timestamp
   */
  async addPriceHistory(tokenMint, price, timestamp) {
    const historyKey = `history:${tokenMint}`;
    const dataPoint = { price, timestamp };

    // Redis storage
    if (this.redis) {
      try {
        await this.redis.lpush(historyKey, JSON.stringify(dataPoint));
        await this.redis.ltrim(historyKey, 0, this.config.historyMaxLength - 1);
        await this.redis.expire(historyKey, Math.floor(this.config.historyTTLMs / 1000));
      } catch (error) {
        console.error('Redis history error:', error.message);
      }
    }

    // Local storage
    if (!this.priceHistory.has(tokenMint)) {
      this.priceHistory.set(tokenMint, []);
    }

    const history = this.priceHistory.get(tokenMint);
    history.unshift(dataPoint);

    // Trim to max length
    if (history.length > this.config.historyMaxLength) {
      history.pop();
    }

    // Clean old entries
    const cutoff = Date.now() - this.config.historyTTLMs;
    const filtered = history.filter((point) => point.timestamp > cutoff);
    this.priceHistory.set(tokenMint, filtered);
  }

  /**
   * Get price history for charts
   * @param {string} tokenMint - Token mint address
   * @param {object} options - Options
   * @param {number} [options.limit] - Max number of points
   * @param {number} [options.interval] - Interval in ms for aggregation
   * @param {number} [options.since] - Get history since timestamp
   * @returns {Array} Price history points
   */
  async getPriceHistory(tokenMint, options = {}) {
    const { limit = 100, interval, since } = options;
    let history = [];

    // Try Redis first
    if (this.redis) {
      try {
        const historyKey = `history:${tokenMint}`;
        const raw = await this.redis.lrange(historyKey, 0, limit - 1);
        history = raw.map((item) => JSON.parse(item));
      } catch (error) {
        console.error('Redis history get error:', error.message);
      }
    }

    // Fall back to local
    if (history.length === 0) {
      history = this.priceHistory.get(tokenMint) || [];
    }

    // Filter by since
    if (since) {
      history = history.filter((point) => point.timestamp >= since);
    }

    // Limit
    history = history.slice(0, limit);

    // Aggregate by interval if specified
    if (interval && history.length > 0) {
      history = this.aggregateHistory(history, interval);
    }

    return history;
  }

  /**
   * Aggregate history by interval (for candlestick data)
   * @param {Array} history - Price history
   * @param {number} interval - Interval in ms
   * @returns {Array} Aggregated history
   */
  aggregateHistory(history, interval) {
    if (history.length === 0) return [];

    const buckets = new Map();

    for (const point of history) {
      const bucketKey = Math.floor(point.timestamp / interval) * interval;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          timestamp: bucketKey,
          open: point.price,
          high: point.price,
          low: point.price,
          close: point.price,
          count: 1,
        });
      } else {
        const bucket = buckets.get(bucketKey);
        bucket.high = Math.max(bucket.high, point.price);
        bucket.low = Math.min(bucket.low, point.price);
        bucket.close = point.price; // Last price becomes close
        bucket.count++;
      }
    }

    return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calculate 24h statistics
   * @param {string} tokenMint - Token mint address
   * @returns {object} 24h stats
   */
  async calculate24hStats(tokenMint) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const history = await this.getPriceHistory(tokenMint, { since, limit: 1000 });

    if (history.length === 0) {
      return { high: null, low: null, change: null, changePercent: null };
    }

    const prices = history.map((p) => p.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    const oldest = history[history.length - 1]?.price || prices[0];
    const newest = history[0]?.price || prices[prices.length - 1];

    const change = newest - oldest;
    const changePercent = oldest > 0 ? (change / oldest) * 100 : 0;

    return { high, low, change, changePercent };
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   * @param {string} tokenMint - Token mint address
   * @param {Array} trades - Recent trades with price and volume
   * @returns {number} VWAP
   */
  calculateVWAP(trades) {
    if (!trades || trades.length === 0) return 0;

    let totalValue = 0;
    let totalVolume = 0;

    for (const trade of trades) {
      const volume = trade.amountSol || 0;
      const price = trade.price || 0;
      totalValue += price * volume;
      totalVolume += volume;
    }

    return totalVolume > 0 ? totalValue / totalVolume : 0;
  }

  /**
   * Get price at specific timestamp (for historical lookups)
   * @param {string} tokenMint - Token mint address
   * @param {number} timestamp - Target timestamp
   * @returns {number|null} Price at timestamp
   */
  async getPriceAtTimestamp(tokenMint, timestamp) {
    const history = await this.getPriceHistory(tokenMint, { limit: 1000 });

    // Find closest price point
    let closest = null;
    let minDiff = Infinity;

    for (const point of history) {
      const diff = Math.abs(point.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest?.price || null;
  }

  /**
   * Calculate market cap
   * @param {number} price - Current price in SOL
   * @param {number} totalSupply - Total token supply
   * @param {number} [solPrice] - SOL price in USD
   * @returns {object} Market cap data
   */
  calculateMarketCap(price, totalSupply, solPrice = null) {
    const marketCapSol = price * totalSupply;
    const marketCapUsd = solPrice ? marketCapSol * solPrice : null;

    return {
      marketCapSol,
      marketCapUsd,
      price,
      totalSupply,
    };
  }

  /**
   * Clear price cache for a token
   * @param {string} tokenMint - Token mint address
   */
  async clearCache(tokenMint) {
    this.localCache.delete(tokenMint);
    this.priceHistory.delete(tokenMint);

    if (this.redis) {
      try {
        await this.redis.del(`${this.config.cachePrefix}${tokenMint}`);
        await this.redis.del(`history:${tokenMint}`);
      } catch (error) {
        console.error('Redis delete error:', error.message);
      }
    }
  }

  /**
   * Get service statistics
   * @returns {object} Service stats
   */
  getStats() {
    return {
      cachedPrices: this.localCache.size,
      trackedHistories: this.priceHistory.size,
      redisConnected: this.redis?.status === 'ready',
    };
  }

  /**
   * Cleanup and close connections
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      console.log('Price service Redis connection closed');
    }

    this.localCache.clear();
    this.priceHistory.clear();
    this.lastUpdateTimes.clear();
  }
}

// Export singleton instance
module.exports = new PriceService();
