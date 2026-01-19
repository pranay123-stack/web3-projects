const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Token = require('../models/Token');
const Trade = require('../models/Trade');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Get user profile by address
router.get('/:address', optionalAuth, async (req, res) => {
  try {
    const { address } = req.params;

    let user = await User.findOne({ address });

    if (!user) {
      // Return basic info for addresses that haven't signed up
      return res.json({
        success: true,
        data: {
          address,
          username: null,
          avatar: null,
          bio: null,
          stats: {
            tokensCreated: 0,
            totalTrades: 0,
            totalVolume: 0,
          },
        },
      });
    }

    // Calculate stats
    const tokensCreated = await Token.countDocuments({ creator: address });
    const trades = await Trade.find({ userAddress: address });
    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, t) => sum + t.solAmount, 0);

    res.json({
      success: true,
      data: {
        address: user.address,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        stats: {
          tokensCreated,
          totalTrades,
          totalVolume,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;

    // Validate username
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-20 characters',
        });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username can only contain letters, numbers, and underscores',
        });
      }

      // Check if username is taken
      const existing = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken',
        });
      }
    }

    // Validate bio
    if (bio && bio.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Bio must be 200 characters or less',
      });
    }

    const updates = {};
    if (username) updates.username = username.toLowerCase();
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        address: user.address,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tokens created by user
router.get('/:address/tokens', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const tokens = await Token.find({ creator: address })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Token.countDocuments({ creator: address });

    res.json({
      success: true,
      data: {
        tokens,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's holdings (placeholder - would need on-chain data)
router.get('/:address/holdings', async (req, res) => {
  try {
    const { address } = req.params;

    // In production, this would query on-chain token accounts
    // For now, calculate from trade history
    const trades = await Trade.find({ userAddress: address })
      .populate('token', 'name symbol image mint price');

    // Aggregate holdings by token
    const holdingsMap = {};

    for (const trade of trades) {
      if (!trade.token) continue;

      const mint = trade.tokenMint;
      if (!holdingsMap[mint]) {
        holdingsMap[mint] = {
          token: trade.token,
          amount: 0,
          totalBought: 0,
          totalSold: 0,
          avgBuyPrice: 0,
          buyCount: 0,
        };
      }

      if (trade.type === 'buy') {
        holdingsMap[mint].amount += trade.tokenAmount;
        holdingsMap[mint].totalBought += trade.tokenAmount;
        holdingsMap[mint].avgBuyPrice += trade.price;
        holdingsMap[mint].buyCount += 1;
      } else {
        holdingsMap[mint].amount -= trade.tokenAmount;
        holdingsMap[mint].totalSold += trade.tokenAmount;
      }
    }

    // Calculate averages and filter positive holdings
    const holdings = Object.values(holdingsMap)
      .filter(h => h.amount > 0)
      .map(h => ({
        token: h.token,
        amount: h.amount,
        avgBuyPrice: h.buyCount > 0 ? h.avgBuyPrice / h.buyCount : 0,
        currentPrice: h.token.price || 0,
        value: h.amount * (h.token.price || 0),
        pnl: h.amount * ((h.token.price || 0) - (h.avgBuyPrice / h.buyCount || 0)),
      }));

    res.json({ success: true, data: holdings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's trade history
router.get('/:address/trades', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const trades = await Trade.find({ userAddress: address })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('token', 'name symbol image mint');

    const total = await Trade.countDocuments({ userAddress: address });

    res.json({
      success: true,
      data: {
        trades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search users by username
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
    })
      .select('address username avatar')
      .limit(parseInt(limit));

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
