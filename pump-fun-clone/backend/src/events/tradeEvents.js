const EventEmitter = require('events');
const socketService = require('../services/socketService');

/**
 * Trade Events
 * Event emitters for trade-related real-time updates
 */
class TradeEvents extends EventEmitter {
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
    this.on('trade', (trade) => {
      socketService.broadcastTrade(trade.tokenMint, trade);
    });

    this.on('priceUpdate', ({ tokenMint, priceData }) => {
      socketService.broadcastPriceUpdate(tokenMint, priceData);
    });
  }

  /**
   * Emit trade event
   * Call this when a new trade is executed
   * @param {object} trade - Trade data
   * @param {string} trade.id - Trade ID
   * @param {string} trade.tokenMint - Token mint address
   * @param {string} trade.type - Trade type ('buy' or 'sell')
   * @param {string} trade.trader - Trader wallet address
   * @param {number} trade.amountSol - Amount in SOL
   * @param {number} trade.amountTokens - Amount of tokens
   * @param {number} trade.price - Price per token
   * @param {number} trade.timestamp - Trade timestamp
   * @param {string} [trade.signature] - Transaction signature
   */
  emitTrade(trade) {
    if (!trade || !trade.tokenMint || !trade.type) {
      console.error('emitTrade: Invalid trade data');
      return;
    }

    const tradeData = {
      id: trade.id || `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tokenMint: trade.tokenMint,
      type: trade.type.toLowerCase(),
      trader: trade.trader,
      traderShort: trade.trader ? `${trade.trader.slice(0, 4)}...${trade.trader.slice(-4)}` : null,
      amountSol: parseFloat(trade.amountSol) || 0,
      amountTokens: parseFloat(trade.amountTokens) || 0,
      price: parseFloat(trade.price) || 0,
      priceUsd: trade.priceUsd || null,
      timestamp: trade.timestamp || Date.now(),
      signature: trade.signature || null,
      slot: trade.slot || null,
      // Computed fields for UI
      isBuy: trade.type.toLowerCase() === 'buy',
      valueUsd: trade.valueUsd || null,
    };

    console.log(
      `Emitting trade: ${tradeData.type.toUpperCase()} ${tradeData.amountTokens} tokens for ${tradeData.amountSol} SOL`
    );
    this.emit('trade', tradeData);

    return tradeData;
  }

  /**
   * Emit price update event
   * Call this when token price changes
   * @param {string} tokenMint - Token mint address
   * @param {object} priceData - Price data
   * @param {number} priceData.price - Current price in SOL
   * @param {number} [priceData.priceUsd] - Current price in USD
   * @param {number} [priceData.change24h] - 24h change percentage
   * @param {number} [priceData.high24h] - 24h high price
   * @param {number} [priceData.low24h] - 24h low price
   * @param {number} [priceData.volume24h] - 24h volume
   * @param {number} [priceData.marketCap] - Market cap
   */
  emitPriceUpdate(tokenMint, priceData) {
    if (!tokenMint) {
      console.error('emitPriceUpdate: Token mint is required');
      return;
    }

    const data = {
      price: parseFloat(priceData.price) || 0,
      priceUsd: priceData.priceUsd || null,
      previousPrice: priceData.previousPrice || null,
      change24h: priceData.change24h || null,
      changePercent: priceData.changePercent || null,
      high24h: priceData.high24h || null,
      low24h: priceData.low24h || null,
      volume24h: priceData.volume24h || null,
      marketCap: priceData.marketCap || null,
      timestamp: Date.now(),
      // Direction for UI animations
      direction: priceData.previousPrice
        ? priceData.price > priceData.previousPrice
          ? 'up'
          : priceData.price < priceData.previousPrice
          ? 'down'
          : 'neutral'
        : 'neutral',
    };

    console.log(`Emitting price update for ${tokenMint}: ${data.price} SOL (${data.direction})`);
    this.emit('priceUpdate', { tokenMint, priceData: data });

    return data;
  }

  /**
   * Emit batch of trades (for historical/catch-up)
   * @param {string} tokenMint - Token mint address
   * @param {Array} trades - Array of trade objects
   */
  emitTradesBatch(tokenMint, trades) {
    if (!tokenMint || !Array.isArray(trades)) {
      console.error('emitTradesBatch: Invalid parameters');
      return;
    }

    const processedTrades = trades.map((trade) => ({
      ...trade,
      tokenMint,
      id: trade.id || `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isBuy: trade.type?.toLowerCase() === 'buy',
    }));

    console.log(`Emitting batch of ${processedTrades.length} trades for ${tokenMint}`);
    this.emit('tradesBatch', { tokenMint, trades: processedTrades });

    return processedTrades;
  }

  /**
   * Emit trade confirmed event (when transaction is finalized)
   * @param {string} tradeId - Trade ID
   * @param {string} signature - Transaction signature
   * @param {string} status - Confirmation status ('confirmed', 'finalized', 'failed')
   */
  emitTradeConfirmation(tradeId, signature, status) {
    if (!tradeId || !signature) {
      console.error('emitTradeConfirmation: Trade ID and signature are required');
      return;
    }

    const data = {
      tradeId,
      signature,
      status,
      confirmedAt: Date.now(),
    };

    console.log(`Emitting trade confirmation: ${tradeId} - ${status}`);
    this.emit('tradeConfirmation', data);

    return data;
  }

  /**
   * Emit large trade alert (whale activity)
   * @param {object} trade - Trade data
   * @param {number} threshold - SOL threshold that triggered the alert
   */
  emitWhaleTrade(trade, threshold) {
    if (!trade) {
      console.error('emitWhaleTrade: Trade data is required');
      return;
    }

    const alertData = {
      trade,
      threshold,
      isWhale: true,
      alertedAt: Date.now(),
    };

    console.log(
      `Whale trade alert: ${trade.type} ${trade.amountSol} SOL (threshold: ${threshold})`
    );
    this.emit('whaleTrade', alertData);

    return alertData;
  }

  /**
   * Emit liquidity event
   * @param {string} tokenMint - Token mint address
   * @param {string} type - Event type ('add', 'remove')
   * @param {number} amount - Amount of liquidity
   */
  emitLiquidityEvent(tokenMint, type, amount) {
    if (!tokenMint || !type) {
      console.error('emitLiquidityEvent: Token mint and type are required');
      return;
    }

    const data = {
      tokenMint,
      type,
      amount: parseFloat(amount) || 0,
      timestamp: Date.now(),
    };

    console.log(`Emitting liquidity event: ${type} ${amount} SOL for ${tokenMint}`);
    this.emit('liquidityEvent', data);

    return data;
  }
}

// Export singleton instance
module.exports = new TradeEvents();
