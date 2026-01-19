const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Token = require('../models/Token');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const bondingCurve = require('../services/bondingCurve');
const { emitTrade, emitPriceUpdate } = require('../events/tradeEvents');

// Get trades for a token
router.get('/token/:mint', optionalAuth, async (req, res) => {
  try {
    const { mint } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const trades = await Trade.find({ tokenMint: mint })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'address username avatar');

    const total = await Trade.countDocuments({ tokenMint: mint });

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

// Get user's trade history
router.get('/user/:address', optionalAuth, async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const trades = await Trade.find({ userAddress: address })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('token', 'name symbol image');

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

// Get trade quote (buy)
router.post('/quote/buy', async (req, res) => {
  try {
    const { tokenMint, solAmount } = req.body;

    if (!tokenMint || !solAmount || solAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token mint or SOL amount',
      });
    }

    const token = await Token.findOne({ mint: tokenMint });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    const quote = bondingCurve.calculateBuy(token.bondingCurve, solAmount);

    res.json({
      success: true,
      data: {
        tokensOut: quote.tokensOut,
        solSpent: quote.solSpent,
        fee: quote.fee,
        priceImpact: quote.priceImpact,
        averagePrice: quote.averagePrice,
        newPrice: quote.newPrice,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get trade quote (sell)
router.post('/quote/sell', async (req, res) => {
  try {
    const { tokenMint, tokenAmount } = req.body;

    if (!tokenMint || !tokenAmount || tokenAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token mint or token amount',
      });
    }

    const token = await Token.findOne({ mint: tokenMint });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    const quote = bondingCurve.calculateSell(token.bondingCurve, tokenAmount);

    res.json({
      success: true,
      data: {
        solOut: quote.solOut,
        tokensSold: quote.tokensSold,
        fee: quote.fee,
        priceImpact: quote.priceImpact,
        averagePrice: quote.averagePrice,
        newPrice: quote.newPrice,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Execute buy (record trade after on-chain confirmation)
router.post('/buy', requireAuth, async (req, res) => {
  try {
    const { tokenMint, solAmount, tokensReceived, txHash } = req.body;

    if (!tokenMint || !solAmount || !tokensReceived || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const token = await Token.findOne({ mint: tokenMint });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    // Calculate new bonding curve state
    const tradeResult = bondingCurve.calculateBuy(token.bondingCurve, solAmount);

    // Create trade record
    const trade = new Trade({
      token: token._id,
      tokenMint,
      user: req.user._id,
      userAddress: req.user.address,
      type: 'buy',
      solAmount,
      tokenAmount: tokensReceived,
      price: tradeResult.averagePrice,
      fee: tradeResult.fee,
      txHash,
    });

    await trade.save();

    // Update token bonding curve
    token.bondingCurve = tradeResult.newBondingCurve;
    token.price = tradeResult.newPrice;
    token.volume24h += solAmount;
    token.tradeCount += 1;

    // Check if should migrate to Raydium
    if (bondingCurve.shouldMigrate(token.bondingCurve)) {
      token.bondingCurve.isComplete = true;
      token.bondingCurve.completedAt = new Date();
      token.isGraduated = true;
    }

    await token.save();

    // Emit real-time events
    emitTrade(trade);
    emitPriceUpdate(tokenMint, tradeResult.newPrice);

    res.json({
      success: true,
      data: { trade, newPrice: tradeResult.newPrice },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute sell (record trade after on-chain confirmation)
router.post('/sell', requireAuth, async (req, res) => {
  try {
    const { tokenMint, tokenAmount, solReceived, txHash } = req.body;

    if (!tokenMint || !tokenAmount || !solReceived || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const token = await Token.findOne({ mint: tokenMint });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    // Calculate new bonding curve state
    const tradeResult = bondingCurve.calculateSell(token.bondingCurve, tokenAmount);

    // Create trade record
    const trade = new Trade({
      token: token._id,
      tokenMint,
      user: req.user._id,
      userAddress: req.user.address,
      type: 'sell',
      solAmount: solReceived,
      tokenAmount,
      price: tradeResult.averagePrice,
      fee: tradeResult.fee,
      txHash,
    });

    await trade.save();

    // Update token bonding curve
    token.bondingCurve = tradeResult.newBondingCurve;
    token.price = tradeResult.newPrice;
    token.volume24h += solReceived;
    token.tradeCount += 1;
    await token.save();

    // Emit real-time events
    emitTrade(trade);
    emitPriceUpdate(tokenMint, tradeResult.newPrice);

    res.json({
      success: true,
      data: { trade, newPrice: tradeResult.newPrice },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent trades (global feed)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const trades = await Trade.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user', 'address username avatar')
      .populate('token', 'name symbol image mint');

    res.json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
