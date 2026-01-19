const mongoose = require('mongoose');

/**
 * Token Schema
 * Represents a token launched on the platform with bonding curve mechanics
 */
const tokenSchema = new mongoose.Schema(
  {
    // On-chain data
    mintAddress: {
      type: String,
      required: [true, 'Mint address is required'],
      unique: true,
      index: true,
    },
    // Token metadata
    name: {
      type: String,
      required: [true, 'Token name is required'],
      trim: true,
      maxlength: [50, 'Token name cannot exceed 50 characters'],
    },
    symbol: {
      type: String,
      required: [true, 'Token symbol is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Token symbol cannot exceed 10 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    image: {
      type: String,
      default: null,
    },
    // Creator info
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creatorWallet: {
      type: String,
      required: true,
      index: true,
    },
    // Bonding curve data
    bondingCurve: {
      // Virtual SOL reserve
      virtualSolReserve: {
        type: Number,
        required: true,
        default: 30, // 30 SOL virtual reserve (like pump.fun)
      },
      // Virtual token reserve
      virtualTokenReserve: {
        type: Number,
        required: true,
        default: 1073000000, // ~1.073B tokens virtual reserve
      },
      // Real SOL collected
      realSolReserve: {
        type: Number,
        default: 0,
      },
      // Real tokens in circulation
      realTokenReserve: {
        type: Number,
        default: 0,
      },
      // Constant product (k = x * y)
      constantProduct: {
        type: Number,
        required: true,
      },
      // Migration threshold in SOL
      migrationThreshold: {
        type: Number,
        default: 85, // 85 SOL threshold for Raydium migration
      },
      // Whether bonding curve is complete
      isComplete: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    // Market data
    marketCap: {
      type: Number,
      default: 0,
      index: true,
    },
    price: {
      type: Number,
      default: 0,
      index: true,
    },
    priceChange24h: {
      type: Number,
      default: 0,
    },
    // Supply info
    totalSupply: {
      type: Number,
      required: true,
      default: 1000000000, // 1 billion total supply
    },
    circulatingSupply: {
      type: Number,
      default: 0,
    },
    // Trading stats
    volume24h: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    tradeCount: {
      type: Number,
      default: 0,
    },
    // Holder info
    holderCount: {
      type: Number,
      default: 0,
    },
    topHolders: [
      {
        wallet: String,
        amount: Number,
        percentage: Number,
      },
    ],
    // Social links
    website: {
      type: String,
      default: null,
    },
    twitter: {
      type: String,
      default: null,
    },
    telegram: {
      type: String,
      default: null,
    },
    discord: {
      type: String,
      default: null,
    },
    // Status
    isListed: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNsfw: {
      type: Boolean,
      default: false,
    },
    // Raydium migration
    raydiumPoolAddress: {
      type: String,
      default: null,
    },
    migratedAt: {
      type: Date,
      default: null,
    },
    // Engagement
    commentCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
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
tokenSchema.index({ createdAt: -1 });
tokenSchema.index({ marketCap: -1 });
tokenSchema.index({ volume24h: -1 });
tokenSchema.index({ tradeCount: -1 });
tokenSchema.index({ 'bondingCurve.isComplete': 1 });
tokenSchema.index({ name: 'text', symbol: 'text', description: 'text' });

// Compound indexes
tokenSchema.index({ isListed: 1, marketCap: -1 });
tokenSchema.index({ isListed: 1, createdAt: -1 });
tokenSchema.index({ isListed: 1, volume24h: -1 });

// Virtual for progress to migration
tokenSchema.virtual('migrationProgress').get(function () {
  if (this.bondingCurve.isComplete) {
    return 100;
  }
  return Math.min(
    100,
    (this.bondingCurve.realSolReserve / this.bondingCurve.migrationThreshold) * 100
  );
});

// Methods
tokenSchema.methods.calculatePrice = function () {
  const { virtualSolReserve, virtualTokenReserve, realSolReserve, realTokenReserve } = this.bondingCurve;
  const effectiveSolReserve = virtualSolReserve + realSolReserve;
  const effectiveTokenReserve = virtualTokenReserve - realTokenReserve;

  if (effectiveTokenReserve <= 0) {
    return 0;
  }

  return effectiveSolReserve / effectiveTokenReserve;
};

tokenSchema.methods.updatePrice = async function () {
  this.price = this.calculatePrice();
  this.marketCap = this.price * this.circulatingSupply;
  return this.save();
};

tokenSchema.methods.recordTrade = async function (solAmount, tokenAmount, isBuy) {
  this.tradeCount += 1;
  this.totalVolume += Math.abs(solAmount);
  this.volume24h += Math.abs(solAmount);

  if (isBuy) {
    this.bondingCurve.realSolReserve += solAmount;
    this.bondingCurve.realTokenReserve += tokenAmount;
    this.circulatingSupply += tokenAmount;
  } else {
    this.bondingCurve.realSolReserve -= solAmount;
    this.bondingCurve.realTokenReserve -= tokenAmount;
    this.circulatingSupply -= tokenAmount;
  }

  // Check for migration threshold
  if (
    !this.bondingCurve.isComplete &&
    this.bondingCurve.realSolReserve >= this.bondingCurve.migrationThreshold
  ) {
    this.bondingCurve.isComplete = true;
    this.bondingCurve.completedAt = new Date();
  }

  await this.updatePrice();
  return this;
};

tokenSchema.methods.incrementCommentCount = async function () {
  this.commentCount += 1;
  return this.save();
};

tokenSchema.methods.updateHolderCount = async function (count) {
  this.holderCount = count;
  return this.save();
};

// Static methods
tokenSchema.statics.findByMintAddress = function (mintAddress) {
  return this.findOne({ mintAddress });
};

tokenSchema.statics.getNewTokens = function (limit = 20, skip = 0) {
  return this.find({ isListed: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'walletAddress username avatar');
};

tokenSchema.statics.getTrendingTokens = function (limit = 20, skip = 0) {
  return this.find({ isListed: true })
    .sort({ volume24h: -1, tradeCount: -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'walletAddress username avatar');
};

tokenSchema.statics.getTopMarketCap = function (limit = 20, skip = 0) {
  return this.find({ isListed: true })
    .sort({ marketCap: -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'walletAddress username avatar');
};

tokenSchema.statics.getByCreator = function (creatorId, limit = 20, skip = 0) {
  return this.find({ creator: creatorId, isListed: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

tokenSchema.statics.getCompletedTokens = function (limit = 20, skip = 0) {
  return this.find({ 'bondingCurve.isComplete': true, isListed: true })
    .sort({ 'bondingCurve.completedAt': -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'walletAddress username avatar');
};

tokenSchema.statics.search = function (query, limit = 20) {
  return this.find({
    $text: { $search: query },
    isListed: true,
  })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('creator', 'walletAddress username avatar');
};

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
