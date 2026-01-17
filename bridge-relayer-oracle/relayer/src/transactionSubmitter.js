/**
 * @fileoverview Transaction submitter module for the bridge relayer
 * Handles signing, submitting, and managing relay transactions
 */

const { ethers } = require('ethers');
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
 * Transaction status enum
 */
const TxStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  REPLACED: 'replaced',
};

/**
 * TransactionSubmitter class for managing relay transactions
 */
class TransactionSubmitter {
  /**
   * @param {number} chainId - Destination chain ID
   */
  constructor(chainId) {
    this.chainId = chainId;
    this.chainConfig = getChainConfig(chainId);
    this.provider = null;
    this.wallet = null;
    this.bridgeContract = null;
    this.pendingTxs = new Map();
    this.nonceManager = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the submitter
   */
  async initialize() {
    try {
      logger.info(`Initializing transaction submitter for chain ${this.chainId}`);

      // Create provider
      this.provider = new ethers.JsonRpcProvider(this.chainConfig.rpcUrl);

      // Create wallet
      if (!RELAYER_CONFIG.privateKey) {
        throw new Error('RELAYER_PRIVATE_KEY not configured');
      }
      this.wallet = new ethers.Wallet(RELAYER_CONFIG.privateKey, this.provider);

      // Initialize contracts
      if (this.chainConfig.bridgeAddress) {
        this.bridgeContract = new ethers.Contract(
          this.chainConfig.bridgeAddress,
          ABIS.MessageBridge,
          this.wallet
        );
      }

      // Initialize nonce manager
      this.nonceManager = new NonceManager(this.wallet);
      await this.nonceManager.sync();

      this.isInitialized = true;
      logger.info(`Transaction submitter initialized for chain ${this.chainId}`, {
        relayerAddress: this.wallet.address,
        bridgeAddress: this.chainConfig.bridgeAddress,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to initialize transaction submitter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit a message execution transaction
   * @param {object} message - The message to execute
   * @param {Array} proof - Merkle proof
   * @param {number} blockNumber - Block number where message is proven
   * @returns {object} Transaction result
   */
  async submitMessageExecution(message, proof, blockNumber) {
    if (!this.isInitialized) {
      throw new Error('Submitter not initialized');
    }

    const txId = this._generateTxId(message);
    logger.info(`Submitting message execution`, { txId, messageHash: message.messageHash });

    try {
      // Check if message already executed
      const status = await this.bridgeContract.getMessageStatus(
        message.sourceChainId,
        message.nonce
      );

      if (status.executed || status.failed) {
        logger.warn(`Message already processed`, { txId, executed: status.executed });
        return {
          txId,
          status: TxStatus.CONFIRMED,
          alreadyProcessed: true,
        };
      }

      // Prepare message tuple
      const messageTuple = [
        BigInt(message.nonce),
        BigInt(message.sourceChainId),
        BigInt(message.destChainId),
        message.sender,
        message.target,
        message.data,
        BigInt(message.gasLimit),
        BigInt(message.timestamp),
      ];

      // Get gas settings
      const gasSettings = await this._getGasSettings();

      // Get nonce
      const nonce = await this.nonceManager.getNextNonce();

      // Build transaction
      const tx = await this.bridgeContract.executeMessage.populateTransaction(
        messageTuple,
        proof,
        blockNumber
      );

      tx.nonce = nonce;
      tx.gasLimit = gasSettings.gasLimit;
      tx.maxFeePerGas = gasSettings.maxFeePerGas;
      tx.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;

      // Submit transaction
      const txResponse = await this.wallet.sendTransaction(tx);

      // Track pending transaction
      this.pendingTxs.set(txId, {
        txId,
        hash: txResponse.hash,
        nonce,
        status: TxStatus.SUBMITTED,
        submittedAt: Date.now(),
        message,
        retries: 0,
      });

      logger.info(`Transaction submitted`, { txId, hash: txResponse.hash, nonce });

      // Wait for confirmation
      const result = await this._waitForConfirmation(txId, txResponse);
      return result;
    } catch (error) {
      logger.error(`Failed to submit transaction`, { txId, error: error.message });

      // Handle specific errors
      if (error.message.includes('nonce')) {
        await this.nonceManager.sync();
      }

      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Submit a trusted message execution (no proof required)
   * @param {object} message - The message to execute
   * @returns {object} Transaction result
   */
  async submitTrustedMessageExecution(message) {
    if (!this.isInitialized) {
      throw new Error('Submitter not initialized');
    }

    const txId = this._generateTxId(message);
    logger.info(`Submitting trusted message execution`, { txId });

    try {
      // Check if message already executed
      const status = await this.bridgeContract.getMessageStatus(
        message.sourceChainId,
        message.nonce
      );

      if (status.executed || status.failed) {
        logger.warn(`Message already processed`, { txId });
        return {
          txId,
          status: TxStatus.CONFIRMED,
          alreadyProcessed: true,
        };
      }

      // Prepare message tuple
      const messageTuple = [
        BigInt(message.nonce),
        BigInt(message.sourceChainId),
        BigInt(message.destChainId),
        message.sender,
        message.target,
        message.data,
        BigInt(message.gasLimit),
        BigInt(message.timestamp),
      ];

      // Get gas settings
      const gasSettings = await this._getGasSettings();

      // Get nonce
      const nonce = await this.nonceManager.getNextNonce();

      // Build transaction
      const tx = await this.bridgeContract.executeMessageTrusted.populateTransaction(
        messageTuple
      );

      tx.nonce = nonce;
      tx.gasLimit = gasSettings.gasLimit;
      tx.maxFeePerGas = gasSettings.maxFeePerGas;
      tx.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;

      // Submit transaction
      const txResponse = await this.wallet.sendTransaction(tx);

      this.pendingTxs.set(txId, {
        txId,
        hash: txResponse.hash,
        nonce,
        status: TxStatus.SUBMITTED,
        submittedAt: Date.now(),
        message,
        retries: 0,
      });

      logger.info(`Trusted transaction submitted`, { txId, hash: txResponse.hash });

      const result = await this._waitForConfirmation(txId, txResponse);
      return result;
    } catch (error) {
      logger.error(`Failed to submit trusted transaction`, { txId, error: error.message });
      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Retry a failed transaction
   * @param {string} txId - Transaction ID to retry
   * @returns {object} Transaction result
   */
  async retryTransaction(txId) {
    const pendingTx = this.pendingTxs.get(txId);
    if (!pendingTx) {
      throw new Error(`Transaction ${txId} not found`);
    }

    if (pendingTx.retries >= RELAYER_CONFIG.maxRetries) {
      logger.error(`Max retries reached for transaction`, { txId });
      return {
        txId,
        status: TxStatus.FAILED,
        error: 'Max retries exceeded',
      };
    }

    pendingTx.retries++;
    logger.info(`Retrying transaction`, { txId, attempt: pendingTx.retries });

    // Wait before retry
    await this._delay(RELAYER_CONFIG.retryDelay * pendingTx.retries);

    // Increase gas for retry
    const gasSettings = await this._getGasSettings(1.2);
    const nonce = await this.nonceManager.getNextNonce();

    try {
      const messageTuple = [
        BigInt(pendingTx.message.nonce),
        BigInt(pendingTx.message.sourceChainId),
        BigInt(pendingTx.message.destChainId),
        pendingTx.message.sender,
        pendingTx.message.target,
        pendingTx.message.data,
        BigInt(pendingTx.message.gasLimit),
        BigInt(pendingTx.message.timestamp),
      ];

      const tx = await this.bridgeContract.executeMessageTrusted.populateTransaction(
        messageTuple
      );

      tx.nonce = nonce;
      tx.gasLimit = gasSettings.gasLimit;
      tx.maxFeePerGas = gasSettings.maxFeePerGas;
      tx.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;

      const txResponse = await this.wallet.sendTransaction(tx);

      pendingTx.hash = txResponse.hash;
      pendingTx.nonce = nonce;
      pendingTx.status = TxStatus.SUBMITTED;

      logger.info(`Retry transaction submitted`, { txId, hash: txResponse.hash });

      return await this._waitForConfirmation(txId, txResponse);
    } catch (error) {
      logger.error(`Retry failed`, { txId, error: error.message });
      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Speed up a pending transaction by replacing with higher gas
   * @param {string} txId - Transaction ID to speed up
   * @returns {object} Transaction result
   */
  async speedUpTransaction(txId) {
    const pendingTx = this.pendingTxs.get(txId);
    if (!pendingTx) {
      throw new Error(`Transaction ${txId} not found`);
    }

    if (pendingTx.status !== TxStatus.SUBMITTED) {
      throw new Error(`Transaction ${txId} is not pending`);
    }

    logger.info(`Speeding up transaction`, { txId, oldHash: pendingTx.hash });

    const gasSettings = await this._getGasSettings(1.5);

    try {
      const messageTuple = [
        BigInt(pendingTx.message.nonce),
        BigInt(pendingTx.message.sourceChainId),
        BigInt(pendingTx.message.destChainId),
        pendingTx.message.sender,
        pendingTx.message.target,
        pendingTx.message.data,
        BigInt(pendingTx.message.gasLimit),
        BigInt(pendingTx.message.timestamp),
      ];

      const tx = await this.bridgeContract.executeMessageTrusted.populateTransaction(
        messageTuple
      );

      // Use same nonce to replace
      tx.nonce = pendingTx.nonce;
      tx.gasLimit = gasSettings.gasLimit;
      tx.maxFeePerGas = gasSettings.maxFeePerGas;
      tx.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;

      const txResponse = await this.wallet.sendTransaction(tx);

      pendingTx.hash = txResponse.hash;
      pendingTx.status = TxStatus.REPLACED;

      logger.info(`Replacement transaction submitted`, { txId, newHash: txResponse.hash });

      return await this._waitForConfirmation(txId, txResponse);
    } catch (error) {
      logger.error(`Speed up failed`, { txId, error: error.message });
      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a pending transaction
   * @param {string} txId - Transaction ID to cancel
   * @returns {object} Result
   */
  async cancelTransaction(txId) {
    const pendingTx = this.pendingTxs.get(txId);
    if (!pendingTx) {
      throw new Error(`Transaction ${txId} not found`);
    }

    logger.info(`Cancelling transaction`, { txId });

    try {
      const gasSettings = await this._getGasSettings(1.5);

      // Send 0 ETH to self with same nonce
      const tx = {
        to: this.wallet.address,
        value: 0,
        nonce: pendingTx.nonce,
        gasLimit: 21000,
        maxFeePerGas: gasSettings.maxFeePerGas,
        maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
      };

      const txResponse = await this.wallet.sendTransaction(tx);
      await txResponse.wait();

      pendingTx.status = TxStatus.FAILED;
      pendingTx.error = 'Cancelled by user';

      logger.info(`Transaction cancelled`, { txId, cancelHash: txResponse.hash });

      return {
        txId,
        status: TxStatus.FAILED,
        cancelled: true,
        cancelHash: txResponse.hash,
      };
    } catch (error) {
      logger.error(`Cancel failed`, { txId, error: error.message });
      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Get pending transaction status
   * @param {string} txId - Transaction ID
   * @returns {object|null} Transaction info
   */
  getPendingTransaction(txId) {
    return this.pendingTxs.get(txId) || null;
  }

  /**
   * Get all pending transactions
   * @returns {Array} Array of pending transactions
   */
  getAllPendingTransactions() {
    return Array.from(this.pendingTxs.values())
      .filter(tx => tx.status === TxStatus.PENDING || tx.status === TxStatus.SUBMITTED);
  }

  /**
   * Get relayer wallet address
   * @returns {string} Wallet address
   */
  getRelayerAddress() {
    return this.wallet ? this.wallet.address : null;
  }

  /**
   * Get relayer balance
   * @returns {string} Balance in ETH
   */
  async getRelayerBalance() {
    if (!this.wallet) return '0';
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txId - Transaction ID
   * @param {object} txResponse - Transaction response
   * @returns {object} Result
   * @private
   */
  async _waitForConfirmation(txId, txResponse) {
    const pendingTx = this.pendingTxs.get(txId);

    try {
      const receipt = await txResponse.wait(this.chainConfig.confirmations);

      if (receipt.status === 1) {
        pendingTx.status = TxStatus.CONFIRMED;
        pendingTx.confirmedAt = Date.now();
        pendingTx.gasUsed = receipt.gasUsed.toString();
        pendingTx.blockNumber = receipt.blockNumber;

        logger.info(`Transaction confirmed`, {
          txId,
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        });

        return {
          txId,
          status: TxStatus.CONFIRMED,
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      } else {
        pendingTx.status = TxStatus.FAILED;
        pendingTx.error = 'Transaction reverted';

        logger.error(`Transaction reverted`, { txId, hash: receipt.hash });

        return {
          txId,
          status: TxStatus.FAILED,
          hash: receipt.hash,
          error: 'Transaction reverted',
        };
      }
    } catch (error) {
      pendingTx.status = TxStatus.FAILED;
      pendingTx.error = error.message;

      logger.error(`Transaction failed`, { txId, error: error.message });

      return {
        txId,
        status: TxStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Get gas settings with optional multiplier
   * @param {number} multiplier - Gas price multiplier
   * @returns {object} Gas settings
   * @private
   */
  async _getGasSettings(multiplier = 1) {
    const feeData = await this.provider.getFeeData();

    const baseMultiplier = RELAYER_CONFIG.gasPriceMultiplier * multiplier;

    let maxFeePerGas = feeData.maxFeePerGas
      ? BigInt(Math.floor(Number(feeData.maxFeePerGas) * baseMultiplier))
      : BigInt(RELAYER_CONFIG.maxGasPrice);

    let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      ? BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * baseMultiplier))
      : BigInt(Math.floor(Number(RELAYER_CONFIG.maxGasPrice) * 0.1));

    // Cap at max gas price
    const maxGasPrice = BigInt(RELAYER_CONFIG.maxGasPrice);
    if (maxFeePerGas > maxGasPrice) {
      maxFeePerGas = maxGasPrice;
    }

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: BigInt(RELAYER_CONFIG.gasLimit),
    };
  }

  /**
   * Generate transaction ID
   * @param {object} message - Message object
   * @returns {string} Transaction ID
   * @private
   */
  _generateTxId(message) {
    return `tx-${message.sourceChainId}-${message.nonce}-${Date.now()}`;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to wait
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * NonceManager for handling transaction nonces
 */
class NonceManager {
  constructor(wallet) {
    this.wallet = wallet;
    this.currentNonce = null;
    this.pendingNonces = new Set();
  }

  /**
   * Sync nonce with network
   */
  async sync() {
    this.currentNonce = await this.wallet.getNonce('pending');
    this.pendingNonces.clear();
    logger.debug(`Nonce synced: ${this.currentNonce}`);
  }

  /**
   * Get next available nonce
   * @returns {number} Next nonce
   */
  async getNextNonce() {
    if (this.currentNonce === null) {
      await this.sync();
    }

    const nonce = this.currentNonce;
    this.currentNonce++;
    this.pendingNonces.add(nonce);

    return nonce;
  }

  /**
   * Release a nonce (when tx fails before submission)
   * @param {number} nonce - Nonce to release
   */
  releaseNonce(nonce) {
    this.pendingNonces.delete(nonce);
  }

  /**
   * Confirm a nonce was used
   * @param {number} nonce - Nonce to confirm
   */
  confirmNonce(nonce) {
    this.pendingNonces.delete(nonce);
  }
}

module.exports = {
  TransactionSubmitter,
  NonceManager,
  TxStatus,
};
