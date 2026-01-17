/**
 * @fileoverview Main entry point for the bridge relayer service
 * Orchestrates event listening, proof generation, and transaction submission
 */

const http = require('http');
const winston = require('winston');
const { EventListener, MultiChainEventListener } = require('./eventListener');
const { ProofGenerator, createMessageFromEvent } = require('./proofGenerator');
const { TransactionSubmitter, TxStatus } = require('./transactionSubmitter');
const { RELAYER_CONFIG, getSupportedChainIds, validateConfig, CHAINS } = require('./config');

// Configure logger
const logger = winston.createLogger({
  level: RELAYER_CONFIG.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * BridgeRelayer main class
 * Coordinates all relayer components
 */
class BridgeRelayer {
  constructor() {
    this.isRunning = false;
    this.eventListeners = new Map();
    this.transactionSubmitters = new Map();
    this.proofGenerator = new ProofGenerator();
    this.messageQueue = [];
    this.processedMessages = new Set();
    this.healthServer = null;
    this.processingInterval = null;
    this.statsInterval = null;
    this.stats = {
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      txSubmitted: 0,
      txConfirmed: 0,
      txFailed: 0,
      startTime: null,
    };
  }

  /**
   * Initialize the relayer
   */
  async initialize() {
    logger.info('Initializing Bridge Relayer...');

    try {
      // Validate configuration
      try {
        validateConfig();
      } catch (configError) {
        logger.warn(`Configuration warning: ${configError.message}`);
      }

      // Get configured chains
      const chainIds = this._getConfiguredChainIds();

      if (chainIds.length === 0) {
        logger.warn('No chains configured with bridge addresses. Running in demo mode.');
        chainIds.push(31337); // Default to local hardhat network
      }

      logger.info(`Initializing for chains: ${chainIds.join(', ')}`);

      // Initialize event listeners
      for (const chainId of chainIds) {
        try {
          const listener = new EventListener(chainId);
          await listener.initialize();

          // Set up event handlers
          listener.on('newEvent', (event) => this._handleNewEvent(event));
          listener.on('connectionFailed', (data) => this._handleConnectionFailed(data));

          this.eventListeners.set(chainId, listener);
          logger.info(`Event listener initialized for chain ${chainId}`);
        } catch (error) {
          logger.error(`Failed to initialize listener for chain ${chainId}: ${error.message}`);
        }
      }

      // Initialize transaction submitters for destination chains
      for (const chainId of chainIds) {
        try {
          const submitter = new TransactionSubmitter(chainId);
          await submitter.initialize();
          this.transactionSubmitters.set(chainId, submitter);
          logger.info(`Transaction submitter initialized for chain ${chainId}`);
        } catch (error) {
          logger.error(`Failed to initialize submitter for chain ${chainId}: ${error.message}`);
        }
      }

      // Start health check server
      this._startHealthServer();

      logger.info('Bridge Relayer initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize relayer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start the relayer
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Relayer is already running');
      return;
    }

    logger.info('Starting Bridge Relayer...');
    this.isRunning = true;
    this.stats.startTime = Date.now();

    // Start all event listeners
    for (const [chainId, listener] of this.eventListeners) {
      await listener.start();
    }

    // Start message processing loop
    this._startProcessingLoop();

    // Start stats reporting
    this._startStatsReporting();

    logger.info('Bridge Relayer started successfully');
  }

  /**
   * Stop the relayer gracefully
   */
  async stop() {
    logger.info('Stopping Bridge Relayer...');
    this.isRunning = false;

    // Stop processing loops
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Stop all event listeners
    for (const [chainId, listener] of this.eventListeners) {
      await listener.stop();
    }

    // Stop health server
    if (this.healthServer) {
      this.healthServer.close();
    }

    // Wait for pending transactions
    await this._waitForPendingTransactions();

    logger.info('Bridge Relayer stopped');
    this._logFinalStats();
  }

  /**
   * Handle new events from listeners
   * @param {object} event - The event data
   * @private
   */
  _handleNewEvent(event) {
    logger.info(`New event received`, { type: event.type, chainId: event.chainId });
    this.stats.messagesReceived++;

    if (event.type === 'MessageSent') {
      // Check if already processed
      const msgKey = `${event.chainId}-${event.nonce}`;
      if (this.processedMessages.has(msgKey)) {
        logger.debug(`Message already processed`, { msgKey });
        return;
      }

      // Add to processing queue
      this.messageQueue.push(event);

      // Add to proof generator
      const message = createMessageFromEvent(event);
      this.proofGenerator.addMessage(
        event.chainId,
        event.blockNumber,
        message
      );
    }
  }

  /**
   * Handle connection failures
   * @param {object} data - Connection failure data
   * @private
   */
  _handleConnectionFailed(data) {
    logger.error(`Connection failed for chain ${data.chainId}`, { error: data.error.message });
  }

  /**
   * Start the message processing loop
   * @private
   */
  _startProcessingLoop() {
    const batchInterval = RELAYER_CONFIG.batchInterval;

    this.processingInterval = setInterval(async () => {
      if (!this.isRunning || this.messageQueue.length === 0) {
        return;
      }

      await this._processBatch();
    }, batchInterval);

    logger.info(`Message processing loop started (interval: ${batchInterval}ms)`);
  }

  /**
   * Process a batch of messages
   * @private
   */
  async _processBatch() {
    const batchSize = Math.min(RELAYER_CONFIG.batchSize, this.messageQueue.length);
    const batch = this.messageQueue.splice(0, batchSize);

    logger.info(`Processing batch of ${batch.length} messages`);

    for (const event of batch) {
      await this._processMessage(event);
    }
  }

  /**
   * Process a single message
   * @param {object} event - The message event
   * @private
   */
  async _processMessage(event) {
    const msgKey = `${event.chainId}-${event.nonce}`;

    try {
      logger.info(`Processing message`, { msgKey, destChainId: event.destChainId });

      // Get submitter for destination chain
      const destChainId = parseInt(event.destChainId);
      const submitter = this.transactionSubmitters.get(destChainId);

      if (!submitter) {
        logger.warn(`No submitter for destination chain ${destChainId}`);
        this.stats.messagesFailed++;
        return;
      }

      // Create message object
      const message = {
        nonce: event.nonce,
        sourceChainId: event.chainId,
        destChainId: event.destChainId,
        sender: event.sender,
        target: event.target,
        data: event.data,
        gasLimit: event.gasLimit,
        timestamp: Math.floor(event.timestamp / 1000),
        messageHash: event.messageHash,
      };

      // Generate proof
      const proofObject = this.proofGenerator.generateProofForMessage(
        event.chainId,
        event.blockNumber,
        createMessageFromEvent(event)
      );

      let result;

      if (proofObject) {
        // Submit with proof
        result = await submitter.submitMessageExecution(
          message,
          proofObject.proof,
          event.blockNumber
        );
      } else {
        // Submit as trusted (no proof available)
        logger.warn(`No proof available, attempting trusted execution`, { msgKey });
        result = await submitter.submitTrustedMessageExecution(message);
      }

      this.stats.txSubmitted++;

      if (result.status === TxStatus.CONFIRMED) {
        this.processedMessages.add(msgKey);
        this.stats.messagesProcessed++;
        this.stats.txConfirmed++;
        logger.info(`Message processed successfully`, { msgKey, txHash: result.hash });
      } else if (result.status === TxStatus.FAILED && !result.alreadyProcessed) {
        this.stats.messagesFailed++;
        this.stats.txFailed++;
        logger.error(`Message processing failed`, { msgKey, error: result.error });

        // Add back to queue for retry
        if (event.retries === undefined) event.retries = 0;
        if (event.retries < RELAYER_CONFIG.maxRetries) {
          event.retries++;
          this.messageQueue.push(event);
        }
      } else if (result.alreadyProcessed) {
        this.processedMessages.add(msgKey);
        this.stats.messagesProcessed++;
        logger.info(`Message already processed on chain`, { msgKey });
      }
    } catch (error) {
      logger.error(`Error processing message`, { msgKey, error: error.message });
      this.stats.messagesFailed++;
    }
  }

  /**
   * Start health check HTTP server
   * @private
   */
  _startHealthServer() {
    const port = RELAYER_CONFIG.healthCheckPort;

    this.healthServer = http.createServer(async (req, res) => {
      if (req.url === '/health' || req.url === '/') {
        const health = await this._getHealth();
        res.writeHead(health.healthy ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
      } else if (req.url === '/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this._getStats(), null, 2));
      } else if (req.url === '/queue') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          queueLength: this.messageQueue.length,
          messages: this.messageQueue.slice(0, 10),
        }, null, 2));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.healthServer.listen(port, () => {
      logger.info(`Health check server running on port ${port}`);
    });
  }

  /**
   * Get health status
   * @returns {object} Health status
   * @private
   */
  async _getHealth() {
    const listenerHealth = {};
    for (const [chainId, listener] of this.eventListeners) {
      listenerHealth[chainId] = await listener.getHealth();
    }

    const submitterHealth = {};
    for (const [chainId, submitter] of this.transactionSubmitters) {
      try {
        const balance = await submitter.getRelayerBalance();
        submitterHealth[chainId] = {
          healthy: parseFloat(balance) > 0.01,
          address: submitter.getRelayerAddress(),
          balance,
        };
      } catch (error) {
        submitterHealth[chainId] = {
          healthy: false,
          error: error.message,
        };
      }
    }

    const allListenersHealthy = Object.values(listenerHealth).every(h => h.healthy);
    const allSubmittersHealthy = Object.values(submitterHealth).every(h => h.healthy);

    return {
      healthy: this.isRunning && allListenersHealthy && allSubmittersHealthy,
      isRunning: this.isRunning,
      uptime: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
      listeners: listenerHealth,
      submitters: submitterHealth,
      queueLength: this.messageQueue.length,
    };
  }

  /**
   * Get current stats
   * @returns {object} Stats
   * @private
   */
  _getStats() {
    const uptime = this.stats.startTime ? Date.now() - this.stats.startTime : 0;
    const uptimeSeconds = uptime / 1000;

    return {
      ...this.stats,
      uptime,
      uptimeFormatted: this._formatUptime(uptime),
      messagesPerSecond: uptimeSeconds > 0 ? (this.stats.messagesProcessed / uptimeSeconds).toFixed(4) : 0,
      successRate: this.stats.messagesReceived > 0
        ? ((this.stats.messagesProcessed / this.stats.messagesReceived) * 100).toFixed(2) + '%'
        : '0%',
      queueLength: this.messageQueue.length,
      proofStats: this.proofGenerator.getStats(),
    };
  }

  /**
   * Start stats reporting
   * @private
   */
  _startStatsReporting() {
    this.statsInterval = setInterval(() => {
      const stats = this._getStats();
      logger.info('Relayer Stats', {
        messagesReceived: stats.messagesReceived,
        messagesProcessed: stats.messagesProcessed,
        messagesFailed: stats.messagesFailed,
        queueLength: stats.queueLength,
        successRate: stats.successRate,
      });
    }, 60000); // Every minute
  }

  /**
   * Wait for pending transactions to complete
   * @private
   */
  async _waitForPendingTransactions() {
    for (const [chainId, submitter] of this.transactionSubmitters) {
      const pending = submitter.getAllPendingTransactions();
      if (pending.length > 0) {
        logger.info(`Waiting for ${pending.length} pending transactions on chain ${chainId}`);
        // In production, implement proper waiting logic
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Log final statistics
   * @private
   */
  _logFinalStats() {
    const stats = this._getStats();
    logger.info('Final Relayer Statistics', stats);
  }

  /**
   * Format uptime for display
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted uptime
   * @private
   */
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get configured chain IDs
   * @returns {number[]} Array of chain IDs
   * @private
   */
  _getConfiguredChainIds() {
    const chainIds = [];
    for (const [id, config] of Object.entries(CHAINS)) {
      if (config.bridgeAddress) {
        chainIds.push(parseInt(id));
      }
    }
    return chainIds;
  }
}

// Handle graceful shutdown
let relayer = null;

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (relayer) {
    await relayer.stop();
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Main entry point
async function main() {
  logger.info('========================================');
  logger.info('       Bridge Relayer Service          ');
  logger.info('========================================');

  relayer = new BridgeRelayer();

  try {
    await relayer.initialize();
    await relayer.start();

    logger.info('Relayer is now running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error(`Failed to start relayer: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing and programmatic use
module.exports = {
  BridgeRelayer,
  main,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}
