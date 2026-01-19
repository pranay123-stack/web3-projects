const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user identified by their Solana wallet address
 */
const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      index: true,
      validate: {
        validator: function (v) {
          // Basic Solana address validation (base58, 32-44 chars)
          return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
        },
        message: 'Invalid Solana wallet address',
      },
    },
    username: {
      type: String,
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    // Statistics
    tokensCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
      min: 0,
    },
    // User's token holdings
    holdings: [
      {
        token: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Token',
        },
        mintAddress: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        averageBuyPrice: {
          type: Number,
          default: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Social features
    followers: {
      type: Number,
      default: 0,
      min: 0,
    },
    following: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Verification and status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
    // Authentication
    nonce: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.nonce;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ tokensCreated: -1 });
userSchema.index({ totalVolume: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'holdings.mintAddress': 1 });

// Virtual for display name
userSchema.virtual('displayName').get(function () {
  if (this.username) {
    return this.username;
  }
  // Return shortened wallet address
  return `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`;
});

// Methods
userSchema.methods.incrementTokensCreated = async function () {
  this.tokensCreated += 1;
  return this.save();
};

userSchema.methods.incrementTrades = async function (volume = 0) {
  this.totalTrades += 1;
  this.totalVolume += volume;
  return this.save();
};

userSchema.methods.updateHolding = async function (mintAddress, tokenId, amount, price) {
  const existingHolding = this.holdings.find(
    (h) => h.mintAddress === mintAddress
  );

  if (existingHolding) {
    if (amount > 0) {
      // Buying - update average price
      const totalCost =
        existingHolding.amount * existingHolding.averageBuyPrice + amount * price;
      existingHolding.amount += amount;
      existingHolding.averageBuyPrice = totalCost / existingHolding.amount;
    } else {
      // Selling
      existingHolding.amount += amount; // amount is negative for sells
    }
    existingHolding.lastUpdated = new Date();

    // Remove holding if amount is 0 or negative
    if (existingHolding.amount <= 0) {
      this.holdings = this.holdings.filter(
        (h) => h.mintAddress !== mintAddress
      );
    }
  } else if (amount > 0) {
    // New holding
    this.holdings.push({
      token: tokenId,
      mintAddress,
      amount,
      averageBuyPrice: price,
      lastUpdated: new Date(),
    });
  }

  return this.save();
};

userSchema.methods.getHolding = function (mintAddress) {
  return this.holdings.find((h) => h.mintAddress === mintAddress);
};

// Static methods
userSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({ walletAddress });
};

userSchema.statics.findOrCreate = async function (walletAddress) {
  let user = await this.findOne({ walletAddress });
  if (!user) {
    user = await this.create({ walletAddress });
  }
  return user;
};

userSchema.statics.getTopCreators = function (limit = 10) {
  return this.find({ tokensCreated: { $gt: 0 } })
    .sort({ tokensCreated: -1 })
    .limit(limit)
    .select('walletAddress username avatar tokensCreated totalVolume');
};

userSchema.statics.getTopTraders = function (limit = 10) {
  return this.find({ totalVolume: { $gt: 0 } })
    .sort({ totalVolume: -1 })
    .limit(limit)
    .select('walletAddress username avatar totalTrades totalVolume');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
