/**
 * @fileoverview Event listener module for the bridge relayer
 * Connects to RPC endpoints and listens for bridge events
 */

const { ethers } = require('ethers');
const { EventEmitter } = require('events');
const winston = require('winston');
const { ABIS, getChainConfig, RELAYER_CONFIG } = require('./config');

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
 * EventListener class for monitoring bridge events
 */
class EventListener extends EventEmitter {
  /**
   * @param {number} chainId - Chain ID to listen on
   */
  constructor(chainId) {
    super();
    this.chainId = chainId;
    this.chainConfig = getChainConfig(chainId);
    this.provider = null;
    this.bridgeContract = null;
    this.oracleContract = null;
    this.isRunning = false;
    this.eventQueue = [];
    this.lastProcessedBlock = 0;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Initialize the event listener
   */
  async initialize() {
    try {
      logger.info(`Initializing event listener for chain ${this.chainId} (${this.chainConfig.name})`);

      // Create provider
      this.provider = new ethers.JsonRpcProvider(this.chainConfig.rpcUrl);

      // Verify connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize contracts if addresses are configured
      if (this.chainConfig.bridgeAddress) {
        this.bridgeContract = new ethers.Contract(
          this.chainConfig.bridgeAddress,
          ABIS.MessageBridge,
          this.provider
        );
        logger.info(`Bridge contract initialized at ${this.chainConfig.bridgeAddress}`);
      }

      if (this.chainConfig.oracleAddress) {
        this.oracleContract = new ethers.Contract(
          this.chainConfig.oracleAddress,
          ABIS.BridgeOracle,
          this.provider
        );
        logger.info(`Oracle contract initialized at ${this.chainConfig.oracleAddress}`);
      }

      // Get current block number
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      logger.info(`Starting from block ${this.lastProcessedBlock}`);

      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      logger.error(`Failed to initialize event listener: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start listening for events
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Event listener is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting event listener for chain ${this.chainId}`);

    // Set up event listeners
    this._setupEventListeners();

    // Start block polling as backup
    this._startBlockPolling();
  }

  /**
   * Stop the event listener
   */
  async stop() {
    logger.info(`Stopping event listener for chain ${this.chainId}`);
    this.isRunning = false;

    if (this.bridgeContract) {
      this.bridgeContract.removeAllListeners();
    }
    if (this.oracleContract) {
      this.oracleContract.removeAllListeners();
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  /**
   * Set up contract event listeners
   * @private
   */
  _setupEventListeners() {
    if (this.bridgeContract) {
      // Listen for MessageSent events
      this.bridgeContract.on('MessageSent', (
        messageHash,
        nonce,
        destChainId,
        sender,
        target,
        data,
        gasLimit,
        fee,
        event
      ) => {
        const parsedEvent = {
          type: 'MessageSent',
          chainId: this.chainId,
          messageHash,
          nonce: nonce.toString(),
          destChainId: destChainId.toString(),
          sender,
          target,
          data,
          gasLimit: gasLimit.toString(),
          fee: fee.toString(),
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash,
          timestamp: Date.now(),
        };

        logger.info(`MessageSent event detected`, { messageHash, nonce: nonce.toString() });
        this._queueEvent(parsedEvent);
      });

      logger.info('Set up MessageSent event listener');
    }

    if (this.oracleContract) {
      // Listen for StateRootFinalized events
      this.oracleContract.on('StateRootFinalized', (
        chainId,
        blockNumber,
        root,
        event
      ) => {
        const parsedEvent = {
          type: 'StateRootFinalized',
          chainId: chainId.toString(),
          blockNumber: blockNumber.toString(),
          root,
          eventBlockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash,
          timestamp: Date.now(),
        };

        logger.info(`StateRootFinalized event detected`, { chainId: chainId.toString(), blockNumber: blockNumber.toString() });
        this._queueEvent(parsedEvent);
      });

      logger.info('Set up StateRootFinalized event listener');
    }
  }

  /**
   * Start block polling as a backup mechanism
   * @private
   */
  _startBlockPolling() {
    const pollInterval = this.chainConfig.blockTime || 12000;

    this.pollingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const currentBlock = await this.provider.getBlockNumber();

        if (currentBlock > this.lastProcessedBlock) {
          logger.debug(`New blocks detected: ${this.lastProcessedBlock + 1} to ${currentBlock}`);

          // Query for missed events
          await this._queryHistoricalEvents(
            this.lastProcessedBlock + 1,
            currentBlock
          );

          this.lastProcessedBlock = currentBlock;
        }
      } catch (error) {
        logger.error(`Block polling error: ${error.message}`);
        await this._handleConnectionError(error);
      }
    }, pollInterval);

    logger.info(`Started block polling with interval ${pollInterval}ms`);
  }

  /**
   * Query for historical events
   * @param {number} fromBlock - Start block
   * @param {number} toBlock - End block
   * @private
   */
  async _queryHistoricalEvents(fromBlock, toBlock) {
    try {
      if (this.bridgeContract) {
        const filter = this.bridgeContract.filters.MessageSent();
        const events = await this.bridgeContract.queryFilter(filter, fromBlock, toBlock);

        for (const event of events) {
          const parsedEvent = {
            type: 'MessageSent',
            chainId: this.chainId,
            messageHash: event.args[0],
            nonce: event.args[1].toString(),
            destChainId: event.args[2].toString(),
            sender: event.args[3],
            target: event.args[4],
            data: event.args[5],
            gasLimit: event.args[6].toString(),
            fee: event.args[7].toString(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now(),
          };

          // Check if event already queued
          if (!this.eventQueue.find(e => e.messageHash === parsedEvent.messageHash)) {
            this._queueEvent(parsedEvent);
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to query historical events: ${error.message}`);
    }
  }

  /**
   * Queue an event for processing
   * @param {object} event - The parsed event
   * @private
   */
  _queueEvent(event) {
    this.eventQueue.push(event);
    this.emit('newEvent', event);
    logger.debug(`Event queued`, { type: event.type, queue_length: this.eventQueue.length });
  }

  /**
   * Get pending events from the queue
   * @param {number} count - Maximum number of events to retrieve
   * @returns {Array} Array of events
   */
  getQueuedEvents(count = 10) {
    return this.eventQueue.splice(0, count);
  }

  /**
   * Get all queued events without removing them
   * @returns {Array} Array of events
   */
  peekQueuedEvents() {
    return [...this.eventQueue];
  }

  /**
   * Get queue length
   * @returns {number} Number of events in queue
   */
  getQueueLength() {
    return this.eventQueue.length;
  }

  /**
   * Handle connection errors with reconnection logic
   * @param {Error} error - The connection error
   * @private
   */
  async _handleConnectionError(error) {
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts reached for chain ${this.chainId}`);
      this.emit('connectionFailed', { chainId: this.chainId, error });
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 60000);
    logger.warn(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.initialize();
      logger.info(`Reconnected to chain ${this.chainId}`);
      this._setupEventListeners();
    } catch (reconnectError) {
      logger.error(`Reconnection failed: ${reconnectError.message}`);
      await this._handleConnectionError(reconnectError);
    }
  }

  /**
   * Check if the listener is healthy
   * @returns {object} Health status
   */
  async getHealth() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return {
        healthy: true,
        chainId: this.chainId,
        chainName: this.chainConfig.name,
        currentBlock: blockNumber,
        lastProcessedBlock: this.lastProcessedBlock,
        queueLength: this.eventQueue.length,
        isRunning: this.isRunning,
      };
    } catch (error) {
      return {
        healthy: false,
        chainId: this.chainId,
        chainName: this.chainConfig.name,
        error: error.message,
        isRunning: this.isRunning,
      };
    }
  }
}

/**
 * MultiChainEventListener manages listeners for multiple chains
 */
class MultiChainEventListener extends EventEmitter {
  constructor(chainIds) {
    super();
    this.chainIds = chainIds;
    this.listeners = new Map();
  }

  /**
   * Initialize all listeners
   */
  async initialize() {
    for (const chainId of this.chainIds) {
      const listener = new EventListener(chainId);

      // Forward events
      listener.on('newEvent', (event) => {
        this.emit('newEvent', event);
      });

      listener.on('connectionFailed', (data) => {
        this.emit('connectionFailed', data);
      });

      try {
        await listener.initialize();
        this.listeners.set(chainId, listener);
        logger.info(`Initialized listener for chain ${chainId}`);
      } catch (error) {
        logger.error(`Failed to initialize listener for chain ${chainId}: ${error.message}`);
      }
    }
  }

  /**
   * Start all listeners
   */
  async startAll() {
    for (const [chainId, listener] of this.listeners) {
      await listener.start();
    }
  }

  /**
   * Stop all listeners
   */
  async stopAll() {
    for (const [chainId, listener] of this.listeners) {
      await listener.stop();
    }
  }

  /**
   * Get listener for a specific chain
   */
  getListener(chainId) {
    return this.listeners.get(chainId);
  }

  /**
   * Get health status for all chains
   */
  async getAllHealth() {
    const healthStatus = {};
    for (const [chainId, listener] of this.listeners) {
      healthStatus[chainId] = await listener.getHealth();
    }
    return healthStatus;
  }
}

module.exports = {
  EventListener,
  MultiChainEventListener,
};
