const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

/**
 * Required authentication middleware
 * Returns 401 if no valid token is provided
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is required',
      });
    }

    // Check for Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is not banned
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        reason: user.banReason,
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.walletAddress = user.walletAddress;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && !user.isBanned) {
        req.user = user;
        req.userId = user._id;
        req.walletAddress = user.walletAddress;
      }
    } catch {
      // Token invalid or expired, continue without user
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Admin authentication middleware
 * Requires admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    // First run the regular auth
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check for admin status
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    // Error already handled by requireAuth
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
};

/**
 * Rate limiting by wallet address
 */
const walletRateLimit = new Map();

const rateLimit = (maxRequests = 100, windowMs = 900000) => {
  return (req, res, next) => {
    const identifier = req.walletAddress || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit entry
    let entry = walletRateLimit.get(identifier);

    if (!entry) {
      entry = { requests: [], blocked: false };
      walletRateLimit.set(identifier, entry);
    }

    // Clean up old requests
    entry.requests = entry.requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (entry.requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.requests[0] + windowMs - now) / 1000),
      });
    }

    // Add current request
    entry.requests.push(now);

    next();
  };
};

/**
 * Verify ownership middleware
 * Ensures the authenticated user owns the resource
 */
const verifyOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);

      if (!ownerId) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      }

      if (ownerId.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to modify this resource',
        });
      }

      next();
    } catch (error) {
      console.error('Verify ownership error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify ownership',
      });
    }
  };
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      walletAddress: user.walletAddress,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Verify JWT token without middleware
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  rateLimit,
  verifyOwnership,
  generateToken,
  verifyToken,
};
