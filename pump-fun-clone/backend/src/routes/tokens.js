const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Token = require('../models/Token');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const bondingCurve = require('../services/bondingCurve');
const solanaService = require('../services/solanaService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `token-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

/**
 * @route   POST /api/tokens
 * @desc    Create a new token
 * @access  Private
 */
router.post(
  '/',
  requireAuth,
  upload.single('image'),
  [
    body('mintAddress')
      .trim()
      .notEmpty()
      .withMessage('Mint address is required')
      .custom((value) => {
        if (!solanaService.isValidAddress(value)) {
          throw new Error('Invalid mint address');
        }
        return true;
      }),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Token name is required')
      .isLength({ max: 50 })
      .withMessage('Token name cannot exceed 50 characters'),
    body('symbol')
      .trim()
      .notEmpty()
      .withMessage('Token symbol is required')
      .isLength({ max: 10 })
      .withMessage('Token symbol cannot exceed 10 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('website').optional().trim().isURL().withMessage('Invalid website URL'),
    body('twitter').optional().trim(),
    body('telegram').optional().trim(),
    body('discord').optional().trim(),
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

      const { mintAddress, name, symbol, description, website, twitter, telegram, discord } = req.body;

      // Check if token already exists
      const existingToken = await Token.findByMintAddress(mintAddress);
      if (existingToken) {
        return res.status(400).json({
          success: false,
          error: 'Token with this mint address already exists',
        });
      }

      // Initialize bonding curve
      const bondingCurveData = bondingCurve.initializeBondingCurve();

      // Calculate initial price
      const initialPrice = bondingCurve.calculatePrice(bondingCurveData);

      // Create token
      const token = await Token.create({
        mintAddress,
        name,
        symbol: symbol.toUpperCase(),
        description: description || '',
        image: req.file ? `/uploads/${req.file.filename}` : null,
        creator: req.userId,
        creatorWallet: req.walletAddress,
        bondingCurve: bondingCurveData,
        price: initialPrice,
        totalSupply: bondingCurve.DEFAULT_TOTAL_SUPPLY,
        website,
        twitter,
        telegram,
        discord,
      });

      // Update user's tokens created count
      await req.user.incrementTokensCreated();

      // Populate creator info
      await token.populate('creator', 'walletAddress username avatar');

      res.status(201).json({
        success: true,
        data: {
          token,
        },
      });
    } catch (error) {
      console.error('Token creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create token',
      });
    }
  }
);

/**
 * @route   GET /api/tokens
 * @desc    Get all tokens with pagination and filters
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional().isIn(['new', 'trending', 'marketCap', 'volume']),
    query('search').optional().trim(),
  ],
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const skip = (page - 1) * limit;
      const sort = req.query.sort || 'new';
      const search = req.query.search;

      let tokens;
      let total;

      if (search) {
        tokens = await Token.search(search, limit);
        total = tokens.length;
      } else {
        switch (sort) {
          case 'trending':
            tokens = await Token.getTrendingTokens(limit, skip);
            break;
          case 'marketCap':
            tokens = await Token.getTopMarketCap(limit, skip);
            break;
          case 'volume':
            tokens = await Token.find({ isListed: true })
              .sort({ totalVolume: -1 })
              .skip(skip)
              .limit(limit)
              .populate('creator', 'walletAddress username avatar');
            break;
          case 'new':
          default:
            tokens = await Token.getNewTokens(limit, skip);
            break;
        }
        total = await Token.countDocuments({ isListed: true });
      }

      res.json({
        success: true,
        data: {
          tokens,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get tokens error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tokens',
      });
    }
  }
);

/**
 * @route   GET /api/tokens/trending
 * @desc    Get trending tokens
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tokens = await Token.getTrendingTokens(limit);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error('Get trending tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending tokens',
    });
  }
});

/**
 * @route   GET /api/tokens/new
 * @desc    Get newest tokens
 * @access  Public
 */
router.get('/new', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tokens = await Token.getNewTokens(limit);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error('Get new tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get new tokens',
    });
  }
});

/**
 * @route   GET /api/tokens/completed
 * @desc    Get tokens that completed their bonding curve
 * @access  Public
 */
router.get('/completed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tokens = await Token.getCompletedTokens(limit);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error('Get completed tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get completed tokens',
    });
  }
});

/**
 * @route   GET /api/tokens/:mintAddress
 * @desc    Get token by mint address
 * @access  Public
 */
router.get(
  '/:mintAddress',
  optionalAuth,
  [
    param('mintAddress')
      .trim()
      .custom((value) => {
        if (!solanaService.isValidAddress(value)) {
          throw new Error('Invalid mint address');
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

      const token = await Token.findByMintAddress(req.params.mintAddress).populate(
        'creator',
        'walletAddress username avatar tokensCreated'
      );

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found',
        });
      }

      // Add user's holding if authenticated
      let userHolding = null;
      if (req.user) {
        const holding = req.user.getHolding(token.mintAddress);
        if (holding) {
          userHolding = {
            amount: holding.amount,
            averageBuyPrice: holding.averageBuyPrice,
          };
        }
      }

      res.json({
        success: true,
        data: {
          token,
          userHolding,
          migrationProgress: token.migrationProgress,
        },
      });
    } catch (error) {
      console.error('Get token error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get token',
      });
    }
  }
);

/**
 * @route   GET /api/tokens/:mintAddress/price
 * @desc    Get token price and bonding curve info
 * @access  Public
 */
router.get('/:mintAddress/price', async (req, res) => {
  try {
    const token = await Token.findByMintAddress(req.params.mintAddress);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    const price = bondingCurve.calculatePrice(token.bondingCurve);
    const marketCap = bondingCurve.calculateMarketCap(token.bondingCurve, token.circulatingSupply);
    const fdv = bondingCurve.calculateFDV(token.bondingCurve, token.totalSupply);
    const migrationProgress = bondingCurve.calculateMigrationProgress(token.bondingCurve);

    res.json({
      success: true,
      data: {
        price,
        marketCap,
        fdv,
        circulatingSupply: token.circulatingSupply,
        totalSupply: token.totalSupply,
        bondingCurve: {
          virtualSolReserve: token.bondingCurve.virtualSolReserve,
          virtualTokenReserve: token.bondingCurve.virtualTokenReserve,
          realSolReserve: token.bondingCurve.realSolReserve,
          realTokenReserve: token.bondingCurve.realTokenReserve,
          isComplete: token.bondingCurve.isComplete,
          migrationThreshold: token.bondingCurve.migrationThreshold,
        },
        migrationProgress,
      },
    });
  } catch (error) {
    console.error('Get token price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token price',
    });
  }
});

/**
 * @route   POST /api/tokens/:mintAddress/quote/buy
 * @desc    Get quote for buying tokens
 * @access  Public
 */
router.post(
  '/:mintAddress/quote/buy',
  [body('solAmount').isFloat({ min: 0.0001 }).withMessage('SOL amount must be positive')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const token = await Token.findByMintAddress(req.params.mintAddress);

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found',
        });
      }

      const { solAmount } = req.body;

      try {
        const quote = bondingCurve.calculateBuy(token.bondingCurve, solAmount);

        res.json({
          success: true,
          data: {
            tokensOut: quote.tokensOut,
            solSpent: quote.solSpent,
            fee: quote.fee,
            averagePrice: quote.averagePrice,
            priceImpact: quote.priceImpact,
            newPrice: quote.newPrice,
          },
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    } catch (error) {
      console.error('Get buy quote error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quote',
      });
    }
  }
);

/**
 * @route   POST /api/tokens/:mintAddress/quote/sell
 * @desc    Get quote for selling tokens
 * @access  Public
 */
router.post(
  '/:mintAddress/quote/sell',
  [body('tokenAmount').isFloat({ min: 1 }).withMessage('Token amount must be positive')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const token = await Token.findByMintAddress(req.params.mintAddress);

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found',
        });
      }

      const { tokenAmount } = req.body;

      try {
        const quote = bondingCurve.calculateSell(token.bondingCurve, tokenAmount);

        res.json({
          success: true,
          data: {
            solOut: quote.solOut,
            tokensSold: quote.tokensSold,
            fee: quote.fee,
            averagePrice: quote.averagePrice,
            priceImpact: quote.priceImpact,
            newPrice: quote.newPrice,
          },
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    } catch (error) {
      console.error('Get sell quote error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get quote',
      });
    }
  }
);

/**
 * @route   GET /api/tokens/:mintAddress/holders
 * @desc    Get token holders
 * @access  Public
 */
router.get('/:mintAddress/holders', async (req, res) => {
  try {
    const token = await Token.findByMintAddress(req.params.mintAddress);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    // Get top holders from Solana
    const holders = await solanaService.getTopHolders(token.mintAddress, 20);

    res.json({
      success: true,
      data: {
        holders,
        holderCount: token.holderCount,
      },
    });
  } catch (error) {
    console.error('Get token holders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get holders',
    });
  }
});

/**
 * @route   GET /api/tokens/:mintAddress/comments
 * @desc    Get comments for a token
 * @access  Public
 */
router.get('/:mintAddress/comments', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const comments = await Comment.getByMintAddress(req.params.mintAddress, limit, skip);

    // Add liked status if user is authenticated
    const commentsWithLiked = comments.map((comment) => {
      const commentObj = comment.toObject();
      commentObj.isLiked = req.user ? comment.isLikedBy(req.userId) : false;
      return commentObj;
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithLiked,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments',
    });
  }
});

/**
 * @route   POST /api/tokens/:mintAddress/comments
 * @desc    Add a comment to a token
 * @access  Private
 */
router.post(
  '/:mintAddress/comments',
  requireAuth,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
    body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID'),
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

      const token = await Token.findByMintAddress(req.params.mintAddress);

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found',
        });
      }

      const { content, parentCommentId } = req.body;

      // If replying, check parent comment exists
      let parentComment = null;
      if (parentCommentId) {
        parentComment = await Comment.findById(parentCommentId);
        if (!parentComment || parentComment.mintAddress !== token.mintAddress) {
          return res.status(400).json({
            success: false,
            error: 'Parent comment not found',
          });
        }
      }

      const comment = await Comment.create({
        token: token._id,
        mintAddress: token.mintAddress,
        user: req.userId,
        userWallet: req.walletAddress,
        content,
        parentComment: parentCommentId || null,
      });

      // Update parent comment reply count
      if (parentComment) {
        await parentComment.incrementReplyCount();
      }

      // Update token comment count
      await token.incrementCommentCount();

      // Populate user info
      await comment.populate('user', 'walletAddress username avatar');

      res.status(201).json({
        success: true,
        data: {
          comment,
        },
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add comment',
      });
    }
  }
);

/**
 * @route   POST /api/tokens/:mintAddress/comments/:commentId/like
 * @desc    Like or unlike a comment
 * @access  Private
 */
router.post('/:mintAddress/comments/:commentId/like', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.mintAddress !== req.params.mintAddress) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    await comment.like(req.userId);

    res.json({
      success: true,
      data: {
        likes: comment.likes,
        isLiked: comment.isLikedBy(req.userId),
      },
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like comment',
    });
  }
});

/**
 * @route   DELETE /api/tokens/:mintAddress/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private
 */
router.delete('/:mintAddress/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.mintAddress !== req.params.mintAddress) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Check ownership
    if (comment.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own comments',
      });
    }

    await comment.softDelete();

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

/**
 * @route   PUT /api/tokens/:mintAddress
 * @desc    Update token metadata (creator only)
 * @access  Private
 */
router.put(
  '/:mintAddress',
  requireAuth,
  upload.single('image'),
  [
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('website').optional().trim(),
    body('twitter').optional().trim(),
    body('telegram').optional().trim(),
    body('discord').optional().trim(),
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

      const token = await Token.findByMintAddress(req.params.mintAddress);

      if (!token) {
        return res.status(404).json({
          success: false,
          error: 'Token not found',
        });
      }

      // Check if user is the creator
      if (token.creator.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Only the creator can update token metadata',
        });
      }

      // Update allowed fields
      const { description, website, twitter, telegram, discord } = req.body;

      if (description !== undefined) token.description = description;
      if (website !== undefined) token.website = website;
      if (twitter !== undefined) token.twitter = twitter;
      if (telegram !== undefined) token.telegram = telegram;
      if (discord !== undefined) token.discord = discord;
      if (req.file) token.image = `/uploads/${req.file.filename}`;

      await token.save();

      res.json({
        success: true,
        data: {
          token,
        },
      });
    } catch (error) {
      console.error('Update token error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update token',
      });
    }
  }
);

/**
 * @route   GET /api/tokens/creator/:walletAddress
 * @desc    Get tokens created by a specific wallet
 * @access  Public
 */
router.get('/creator/:walletAddress', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const user = await User.findByWallet(req.params.walletAddress);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const tokens = await Token.getByCreator(user._id, limit, skip);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error('Get creator tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tokens',
    });
  }
});

module.exports = router;
