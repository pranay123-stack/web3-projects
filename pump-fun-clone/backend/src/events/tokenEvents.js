const EventEmitter = require('events');
const socketService = require('../services/socketService');

/**
 * Token Events
 * Event emitters for token-related real-time updates
 */
class TokenEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.setupInternalListeners();
  }

  /**
   * Setup internal event listeners
   */
  setupInternalListeners() {
    // Listen to internal events and broadcast via socket
    this.on('newToken', (token) => {
      socketService.broadcastNewToken(token);
    });

    this.on('tokenUpdate', ({ tokenMint, data }) => {
      socketService.broadcastTokenUpdate(tokenMint, data);
    });

    this.on('graduation', ({ tokenMint, data }) => {
      socketService.broadcastGraduation(tokenMint, data);
    });
  }

  /**
   * Emit new token event
   * Call this when a new token is created
   * @param {object} token - Token data
   * @param {string} token.mint - Token mint address
   * @param {string} token.name - Token name
   * @param {string} token.symbol - Token symbol
   * @param {string} token.description - Token description
   * @param {string} token.imageUrl - Token image URL
   * @param {string} token.creator - Creator wallet address
   * @param {number} token.createdAt - Creation timestamp
   * @param {number} token.initialPrice - Initial price
   * @param {number} token.marketCap - Initial market cap
   */
  emitNewToken(token) {
    if (!token || !token.mint) {
      console.error('emitNewToken: Invalid token data');
      return;
    }

    const tokenData = {
      mint: token.mint,
      name: token.name || 'Unknown',
      symbol: token.symbol || 'UNK',
      description: token.description || '',
      imageUrl: token.imageUrl || null,
      creator: token.creator,
      createdAt: token.createdAt || Date.now(),
      initialPrice: token.initialPrice || 0,
      marketCap: token.marketCap || 0,
      bondingCurveProgress: token.bondingCurveProgress || 0,
      website: token.website || null,
      twitter: token.twitter || null,
      telegram: token.telegram || null,
    };

    console.log(`Emitting new token: ${tokenData.name} (${tokenData.symbol})`);
    this.emit('newToken', tokenData);

    return tokenData;
  }

  /**
   * Emit token update event
   * Call this when token data changes (price, market cap, etc.)
   * @param {string} tokenMint - Token mint address
   * @param {object} data - Update data
   * @param {number} [data.price] - Current price
   * @param {number} [data.marketCap] - Current market cap
   * @param {number} [data.volume24h] - 24h volume
   * @param {number} [data.priceChange24h] - 24h price change percentage
   * @param {number} [data.bondingCurveProgress] - Bonding curve progress (0-100)
   * @param {number} [data.holderCount] - Number of holders
   */
  emitTokenUpdate(tokenMint, data) {
    if (!tokenMint) {
      console.error('emitTokenUpdate: Token mint is required');
      return;
    }

    const updateData = {
      price: data.price,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
      priceChange24h: data.priceChange24h,
      bondingCurveProgress: data.bondingCurveProgress,
      holderCount: data.holderCount,
      lastTradeAt: data.lastTradeAt || Date.now(),
      ...data,
    };

    console.log(`Emitting token update for: ${tokenMint}`);
    this.emit('tokenUpdate', { tokenMint, data: updateData });

    return updateData;
  }

  /**
   * Emit graduation event
   * Call this when token completes bonding curve and graduates to DEX
   * @param {string} tokenMint - Token mint address
   * @param {object} [graduationData] - Graduation details
   * @param {string} [graduationData.dexPoolAddress] - DEX pool address
   * @param {number} [graduationData.finalBondingPrice] - Final price on bonding curve
   * @param {number} [graduationData.totalRaised] - Total SOL raised
   * @param {string} [graduationData.dexType] - DEX type (raydium, orca, etc.)
   */
  emitGraduation(tokenMint, graduationData = {}) {
    if (!tokenMint) {
      console.error('emitGraduation: Token mint is required');
      return;
    }

    const data = {
      graduatedAt: Date.now(),
      dexPoolAddress: graduationData.dexPoolAddress || null,
      finalBondingPrice: graduationData.finalBondingPrice || 0,
      totalRaised: graduationData.totalRaised || 0,
      dexType: graduationData.dexType || 'raydium',
      ...graduationData,
    };

    console.log(`Emitting graduation for token: ${tokenMint}`);
    this.emit('graduation', { tokenMint, data });

    return data;
  }

  /**
   * Emit token status change
   * @param {string} tokenMint - Token mint address
   * @param {string} status - New status (active, paused, graduated, etc.)
   * @param {string} [reason] - Reason for status change
   */
  emitStatusChange(tokenMint, status, reason = null) {
    if (!tokenMint || !status) {
      console.error('emitStatusChange: Token mint and status are required');
      return;
    }

    const data = {
      status,
      reason,
      changedAt: Date.now(),
    };

    console.log(`Emitting status change for token: ${tokenMint} -> ${status}`);
    this.emit('tokenUpdate', { tokenMint, data });

    return data;
  }

  /**
   * Emit token metadata update
   * @param {string} tokenMint - Token mint address
   * @param {object} metadata - Updated metadata
   */
  emitMetadataUpdate(tokenMint, metadata) {
    if (!tokenMint || !metadata) {
      console.error('emitMetadataUpdate: Token mint and metadata are required');
      return;
    }

    const data = {
      ...metadata,
      metadataUpdatedAt: Date.now(),
    };

    console.log(`Emitting metadata update for token: ${tokenMint}`);
    this.emit('tokenUpdate', { tokenMint, data });

    return data;
  }
}

// Export singleton instance
module.exports = new TokenEvents();
