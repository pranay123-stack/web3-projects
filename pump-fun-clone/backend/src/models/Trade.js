const mongoose = require('mongoose');

/**
 * Trade Schema
 * Records all buy/sell transactions on the platform
 */
const tradeSchema = new mongoose.Schema(
  {
    // Token being traded
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
      index: true,
    },
    mintAddress: {
      type: String,
      required: true,
      index: true,
    },
    // User making the trade
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userWallet: {
      type: String,
      required: true,
      index: true,
    },
    // Trade details
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
      index: true,
    },
    // Token amount
    tokenAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // SOL amount
    solAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Price per token at time of trade
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Price in USD at time of trade (for historical tracking)
    priceUsd: {
      type: Number,
      default: null,
    },
    // Solana transaction signature
    txSignature: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Transaction slot
    slot: {
      type: Number,
      default: null,
    },
    // Platform fee collected
    platformFee: {
      type: Number,
      default: 0,
    },
    // Trade status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
      index: true,
    },
    // Bonding curve state after trade
    bondingCurveState: {
      virtualSolReserve: Number,
      virtualTokenReserve: Number,
      realSolReserve: Number,
      realTokenReserve: Number,
    },
    // Market cap at time of trade
    marketCapAtTrade: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
tradeSchema.index({ createdAt: -1 });
tradeSchema.index({ token: 1, createdAt: -1 });
tradeSchema.index({ user: 1, createdAt: -1 });
tradeSchema.index({ mintAddress: 1, createdAt: -1 });
tradeSchema.index({ type: 1, createdAt: -1 });

// Compound indexes
tradeSchema.index({ token: 1, type: 1, createdAt: -1 });
tradeSchema.index({ user: 1, token: 1, createdAt: -1 });

// Virtual for formatted timestamp
tradeSchema.virtual('formattedTime').get(function () {
  return this.createdAt.toISOString();
});

// Static methods
tradeSchema.statics.getRecentTrades = function (limit = 50) {
  return this.find({ status: 'confirmed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('token', 'name symbol image mintAddress')
    .populate('user', 'walletAddress username avatar');
};

tradeSchema.statics.getTradesByToken = function (tokenId, limit = 50, skip = 0) {
  return this.find({ token: tokenId, status: 'confirmed' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

tradeSchema.statics.getTradesByMintAddress = function (mintAddress, limit = 50, skip = 0) {
  return this.find({ mintAddress, status: 'confirmed' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

tradeSchema.statics.getTradesByUser = function (userId, limit = 50, skip = 0) {
  return this.find({ user: userId, status: 'confirmed' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('token', 'name symbol image mintAddress price');
};

tradeSchema.statics.getTradesByWallet = function (walletAddress, limit = 50, skip = 0) {
  return this.find({ userWallet: walletAddress, status: 'confirmed' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('token', 'name symbol image mintAddress price');
};

tradeSchema.statics.getTokenVolume = async function (tokenId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const result = await this.aggregate([
    {
      $match: {
        token: new mongoose.Types.ObjectId(tokenId),
        status: 'confirmed',
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: '$solAmount' },
        tradeCount: { $sum: 1 },
        buyVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'buy'] }, '$solAmount', 0],
          },
        },
        sellVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'sell'] }, '$solAmount', 0],
          },
        },
      },
    },
  ]);

  return result[0] || { totalVolume: 0, tradeCount: 0, buyVolume: 0, sellVolume: 0 };
};

tradeSchema.statics.getUserStats = async function (userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: 'confirmed',
      },
    },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        totalVolume: { $sum: '$solAmount' },
        totalBuys: {
          $sum: { $cond: [{ $eq: ['$type', 'buy'] }, 1, 0] },
        },
        totalSells: {
          $sum: { $cond: [{ $eq: ['$type', 'sell'] }, 1, 0] },
        },
        buyVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'buy'] }, '$solAmount', 0],
          },
        },
        sellVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'sell'] }, '$solAmount', 0],
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalTrades: 0,
      totalVolume: 0,
      totalBuys: 0,
      totalSells: 0,
      buyVolume: 0,
      sellVolume: 0,
    }
  );
};

tradeSchema.statics.getOHLCV = async function (tokenId, interval = '1h', limit = 100) {
  const intervalMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }[interval] || 60 * 60 * 1000;

  const result = await this.aggregate([
    {
      $match: {
        token: new mongoose.Types.ObjectId(tokenId),
        status: 'confirmed',
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: limit * 100, // Get more data for aggregation
    },
    {
      $group: {
        _id: {
          $subtract: [
            { $toLong: '$createdAt' },
            { $mod: [{ $toLong: '$createdAt' }, intervalMs] },
          ],
        },
        open: { $first: '$price' },
        high: { $max: '$price' },
        low: { $min: '$price' },
        close: { $last: '$price' },
        volume: { $sum: '$solAmount' },
        trades: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  return result.map((candle) => ({
    timestamp: candle._id,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    trades: candle.trades,
  }));
};

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;
