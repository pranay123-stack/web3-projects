const express = require('express');
const { body, validationResult } = require('express-validator');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { generateToken, requireAuth } = require('../middleware/auth');
const solanaService = require('../services/solanaService');

const router = express.Router();

/**
 * @route   POST /api/auth/nonce
 * @desc    Get a nonce for wallet signature verification
 * @access  Public
 */
router.post(
  '/nonce',
  [
    body('walletAddress')
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required')
      .custom((value) => {
        if (!solanaService.isValidAddress(value)) {
          throw new Error('Invalid Solana wallet address');
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { walletAddress } = req.body;

      // Generate a unique nonce
      const nonce = uuidv4();
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with Pump Fun Clone.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      // Find or create user
      let user = await User.findByWallet(walletAddress);

      if (!user) {
        user = await User.create({
          walletAddress,
          nonce,
        });
      } else {
        user.nonce = nonce;
        await user.save();
      }

      res.json({
        success: true,
        data: {
          message,
          nonce,
          timestamp,
        },
      });
    } catch (error) {
      console.error('Nonce generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authentication nonce',
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify wallet signature and return JWT
 * @access  Public
 */
router.post(
  '/verify',
  [
    body('walletAddress')
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required')
      .custom((value) => {
        if (!solanaService.isValidAddress(value)) {
          throw new Error('Invalid Solana wallet address');
        }
        return true;
      }),
    body('signature')
      .trim()
      .notEmpty()
      .withMessage('Signature is required'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { walletAddress, signature, message } = req.body;

      // Find user
      const user = await User.findByWallet(walletAddress);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found. Please request a nonce first.',
        });
      }

      // Verify the nonce is in the message
      if (!user.nonce || !message.includes(user.nonce)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired nonce',
        });
      }

      // Verify signature
      let isValid = false;
      try {
        const publicKey = bs58.decode(walletAddress);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);

        isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
      } catch (verifyError) {
        console.error('Signature verification error:', verifyError);
        return res.status(400).json({
          success: false,
          error: 'Invalid signature format',
        });
      }

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Signature verification failed',
        });
      }

      // Clear nonce after successful verification
      user.nonce = null;
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT
      const token = generateToken(user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            walletAddress: user.walletAddress,
            username: user.username,
            avatar: user.avatar,
            displayName: user.displayName,
            tokensCreated: user.tokensCreated,
            totalTrades: user.totalTrades,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-nonce')
      .populate({
        path: 'holdings.token',
        select: 'name symbol image mintAddress price',
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Generate new token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client-side token removal)
 * @access  Private
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, logout is handled client-side by removing the token

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Soft delete - just mark as banned with reason
    user.isBanned = true;
    user.banReason = 'Account deleted by user';
    await user.save();

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
});

module.exports = router;
