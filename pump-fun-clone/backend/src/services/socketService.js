const { Server } = require('socket.io');

// Redis is optional - only load if available
let Redis = null;
try {
  Redis = require('ioredis');
} catch (e) {
  console.log('ioredis not installed - running without Redis (OK for development)');
}

/**
 * Socket.IO Service
 * Handles real-time WebSocket connections for the pump.fun clone
 * Features: Connection management, room management, broadcasts, rate limiting
 */
class SocketService {
  constructor() {
    this.io = null;
    this.redis = null;
    this.rateLimitStore = new Map();
    this.connectedClients = new Map();

    // Rate limiting configuration
    this.rateLimitConfig = {
      windowMs: 1000, // 1 second window
      maxRequests: 20, // Max 20 requests per second per client
      blockDurationMs: 5000, // Block for 5 seconds if exceeded
    };
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} httpServer - HTTP server instance
   * @param {object} options - Socket.IO options
   * @returns {Server}
   */
  initialize(httpServer, options = {}) {
    const defaultOptions = {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    };

    this.io = new Server(httpServer, { ...defaultOptions, ...options });

    // Initialize Redis for pub/sub (optional, for scaling)
    this.initializeRedis();

    // Setup middleware
    this.setupMiddleware();

    // Setup connection handlers
    this.setupConnectionHandlers();

    console.log('Socket.IO server initialized');

    return this.io;
  }

  /**
   * Initialize Redis connection for scaling and caching
   */
  initializeRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl && Redis) {
      try {
        this.redis = new Redis(redisUrl);
        this.redis.on('connect', () => {
          console.log('Socket service connected to Redis');
        });
        this.redis.on('error', (err) => {
          console.error('Redis connection error:', err.message);
          this.redis = null;
        });
      } catch (error) {
        console.warn('Redis not available, using in-memory storage');
        this.redis = null;
      }
    } else {
      console.log('Running without Redis - using in-memory storage');
    }
  }

  /**
   * Setup Socket.IO middleware for authentication and rate limiting
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      const walletAddress = socket.handshake.auth?.walletAddress;

      // Store client info
      socket.walletAddress = walletAddress || null;
      socket.isAuthenticated = !!walletAddress;

      next();
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const clientId = socket.id;
      const now = Date.now();

      // Check if client is blocked
      const blockInfo = this.rateLimitStore.get(`block:${clientId}`);
      if (blockInfo && blockInfo > now) {
        return next(new Error('Rate limit exceeded. Please wait.'));
      }

      // Track requests
      const requestKey = `requests:${clientId}`;
      const requests = this.rateLimitStore.get(requestKey) || [];

      // Clean old requests
      const validRequests = requests.filter(
        (timestamp) => now - timestamp < this.rateLimitConfig.windowMs
      );

      if (validRequests.length >= this.rateLimitConfig.maxRequests) {
        // Block the client
        this.rateLimitStore.set(
          `block:${clientId}`,
          now + this.rateLimitConfig.blockDurationMs
        );
        return next(new Error('Rate limit exceeded. Please wait.'));
      }

      validRequests.push(now);
      this.rateLimitStore.set(requestKey, validRequests);

      next();
    });
  }

  /**
   * Setup connection handlers
   */
  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Track connected client
      this.connectedClients.set(socket.id, {
        walletAddress: socket.walletAddress,
        isAuthenticated: socket.isAuthenticated,
        connectedAt: Date.now(),
        rooms: new Set(),
      });

      // Handle joining token room
      socket.on('join:token', (tokenMint) => {
        if (!this.validateTokenMint(tokenMint)) {
          socket.emit('error', { message: 'Invalid token mint address' });
          return;
        }

        const roomName = `token:${tokenMint}`;
        socket.join(roomName);

        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
          clientInfo.rooms.add(roomName);
        }

        console.log(`Client ${socket.id} joined room: ${roomName}`);
        socket.emit('joined:token', { tokenMint, room: roomName });
      });

      // Handle leaving token room
      socket.on('leave:token', (tokenMint) => {
        const roomName = `token:${tokenMint}`;
        socket.leave(roomName);

        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
          clientInfo.rooms.delete(roomName);
        }

        console.log(`Client ${socket.id} left room: ${roomName}`);
        socket.emit('left:token', { tokenMint, room: roomName });
      });

      // Handle subscribing to global feed
      socket.on('subscribe:global', () => {
        socket.join('global:feed');
        console.log(`Client ${socket.id} subscribed to global feed`);
        socket.emit('subscribed:global');
      });

      // Handle unsubscribing from global feed
      socket.on('unsubscribe:global', () => {
        socket.leave('global:feed');
        console.log(`Client ${socket.id} unsubscribed from global feed`);
        socket.emit('unsubscribed:global');
      });

      // Handle ping for connection health
      socket.on('ping', (callback) => {
        if (typeof callback === 'function') {
          callback({ timestamp: Date.now() });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
        this.rateLimitStore.delete(`requests:${socket.id}`);
        this.rateLimitStore.delete(`block:${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Validate token mint address (Solana base58)
   * @param {string} mint - Token mint address
   * @returns {boolean}
   */
  validateTokenMint(mint) {
    if (!mint || typeof mint !== 'string') return false;
    // Solana addresses are 32-44 characters base58
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint);
  }

  /**
   * Broadcast new token to all clients in global feed
   * @param {object} token - Token data
   */
  broadcastNewToken(token) {
    if (!this.io) return;

    const eventData = {
      type: 'new_token',
      data: token,
      timestamp: Date.now(),
    };

    this.io.to('global:feed').emit('token:new', eventData);
    console.log(`Broadcasted new token: ${token.mint || token.name}`);
  }

  /**
   * Broadcast trade to specific token room
   * @param {string} tokenMint - Token mint address
   * @param {object} trade - Trade data
   */
  broadcastTrade(tokenMint, trade) {
    if (!this.io) return;

    const roomName = `token:${tokenMint}`;
    const eventData = {
      type: 'trade',
      tokenMint,
      data: trade,
      timestamp: Date.now(),
    };

    this.io.to(roomName).emit('trade:new', eventData);

    // Also emit to global feed for live activity
    this.io.to('global:feed').emit('trade:global', eventData);
  }

  /**
   * Broadcast price update to specific token room
   * @param {string} tokenMint - Token mint address
   * @param {object} priceData - Price data
   */
  broadcastPriceUpdate(tokenMint, priceData) {
    if (!this.io) return;

    const roomName = `token:${tokenMint}`;
    const eventData = {
      type: 'price_update',
      tokenMint,
      data: priceData,
      timestamp: Date.now(),
    };

    this.io.to(roomName).emit('price:update', eventData);
  }

  /**
   * Broadcast token update (metadata, status changes)
   * @param {string} tokenMint - Token mint address
   * @param {object} updateData - Update data
   */
  broadcastTokenUpdate(tokenMint, updateData) {
    if (!this.io) return;

    const roomName = `token:${tokenMint}`;
    const eventData = {
      type: 'token_update',
      tokenMint,
      data: updateData,
      timestamp: Date.now(),
    };

    this.io.to(roomName).emit('token:update', eventData);
    this.io.to('global:feed').emit('token:update', eventData);
  }

  /**
   * Broadcast graduation event (token reached bonding curve completion)
   * @param {string} tokenMint - Token mint address
   * @param {object} graduationData - Graduation details
   */
  broadcastGraduation(tokenMint, graduationData) {
    if (!this.io) return;

    const roomName = `token:${tokenMint}`;
    const eventData = {
      type: 'graduation',
      tokenMint,
      data: graduationData,
      timestamp: Date.now(),
    };

    // Emit to token room
    this.io.to(roomName).emit('token:graduated', eventData);

    // Emit to global feed (big event!)
    this.io.to('global:feed').emit('token:graduated', eventData);

    console.log(`Token graduated: ${tokenMint}`);
  }

  /**
   * Send notification to specific user
   * @param {string} walletAddress - User's wallet address
   * @param {object} notification - Notification data
   */
  sendUserNotification(walletAddress, notification) {
    if (!this.io) return;

    // Find all sockets for this wallet
    for (const [socketId, clientInfo] of this.connectedClients) {
      if (clientInfo.walletAddress === walletAddress) {
        this.io.to(socketId).emit('notification', {
          type: 'user_notification',
          data: notification,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Get room statistics
   * @param {string} roomName - Room name
   * @returns {object} Room stats
   */
  async getRoomStats(roomName) {
    if (!this.io) return { count: 0 };

    const sockets = await this.io.in(roomName).fetchSockets();
    return {
      count: sockets.length,
      room: roomName,
    };
  }

  /**
   * Get server statistics
   * @returns {object} Server stats
   */
  getServerStats() {
    return {
      connectedClients: this.connectedClients.size,
      authenticatedClients: Array.from(this.connectedClients.values()).filter(
        (c) => c.isAuthenticated
      ).length,
      uptime: process.uptime(),
    };
  }

  /**
   * Get Socket.IO instance
   * @returns {Server}
   */
  getIO() {
    return this.io;
  }

  /**
   * Cleanup and close connections
   */
  async close() {
    if (this.io) {
      await this.io.close();
      console.log('Socket.IO server closed');
    }

    if (this.redis) {
      await this.redis.quit();
      console.log('Redis connection closed');
    }

    this.connectedClients.clear();
    this.rateLimitStore.clear();
  }
}

// Export singleton instance
module.exports = new SocketService();
