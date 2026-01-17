const {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const solanaConfig = require('../config/solana');

/**
 * Solana Service
 * Handles all Solana blockchain interactions
 */
class SolanaService {
  constructor() {
    this.connection = null;
  }

  /**
   * Initialize connection
   */
  initialize() {
    if (!this.connection) {
      this.connection = solanaConfig.initialize();
    }
    return this.connection;
  }

  /**
   * Get connection
   * @returns {Connection}
   */
  getConnection() {
    return this.initialize();
  }

  /**
   * Validate Solana address
   * @param {string} address - Address to validate
   * @returns {boolean}
   */
  isValidAddress(address) {
    return solanaConfig.isValidPublicKey(address);
  }

  /**
   * Get PublicKey from string
   * @param {string} address
   * @returns {PublicKey}
   */
  getPublicKey(address) {
    return new PublicKey(address);
  }

  /**
   * Get SOL balance for an address
   * @param {string} address - Wallet address
   * @returns {Promise<number>} Balance in SOL
   */
  async getBalance(address) {
    try {
      const connection = this.getConnection();
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Get token balance for an address
   * @param {string} walletAddress - Wallet address
   * @param {string} mintAddress - Token mint address
   * @returns {Promise<number>} Token balance
   */
  async getTokenBalance(walletAddress, mintAddress) {
    try {
      const connection = this.getConnection();
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(mintAddress);

      const ata = await getAssociatedTokenAddress(mint, wallet);

      try {
        const account = await getAccount(connection, ata);
        return Number(account.amount);
      } catch {
        // Account doesn't exist
        return 0;
      }
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw new Error('Failed to get token balance');
    }
  }

  /**
   * Get all token accounts for a wallet
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Array>} Array of token accounts
   */
  async getTokenAccounts(walletAddress) {
    try {
      const connection = this.getConnection();
      const wallet = new PublicKey(walletAddress);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
      });

      return tokenAccounts.value.map((account) => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
        address: account.pubkey.toString(),
      }));
    } catch (error) {
      console.error('Error getting token accounts:', error);
      throw new Error('Failed to get token accounts');
    }
  }

  /**
   * Get transaction details
   * @param {string} signature - Transaction signature
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(signature) {
    try {
      const connection = this.getConnection();
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      return tx;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw new Error('Failed to get transaction');
    }
  }

  /**
   * Verify transaction exists and is confirmed
   * @param {string} signature - Transaction signature
   * @returns {Promise<boolean>}
   */
  async verifyTransaction(signature) {
    try {
      const connection = this.getConnection();
      const status = await connection.getSignatureStatus(signature);

      if (!status || !status.value) {
        return false;
      }

      return (
        status.value.confirmationStatus === 'confirmed' ||
        status.value.confirmationStatus === 'finalized'
      );
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Get recent blockhash
   * @returns {Promise<{blockhash: string, lastValidBlockHeight: number}>}
   */
  async getRecentBlockhash() {
    const connection = this.getConnection();
    return await connection.getLatestBlockhash();
  }

  /**
   * Get current slot
   * @returns {Promise<number>}
   */
  async getCurrentSlot() {
    const connection = this.getConnection();
    return await connection.getSlot();
  }

  /**
   * Get associated token address
   * @param {string} mintAddress - Token mint address
   * @param {string} ownerAddress - Owner wallet address
   * @returns {Promise<string>} ATA address
   */
  async getAssociatedTokenAddress(mintAddress, ownerAddress) {
    const mint = new PublicKey(mintAddress);
    const owner = new PublicKey(ownerAddress);
    const ata = await getAssociatedTokenAddress(mint, owner);
    return ata.toString();
  }

  /**
   * Check if associated token account exists
   * @param {string} mintAddress - Token mint address
   * @param {string} ownerAddress - Owner wallet address
   * @returns {Promise<boolean>}
   */
  async tokenAccountExists(mintAddress, ownerAddress) {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);
      const owner = new PublicKey(ownerAddress);
      const ata = await getAssociatedTokenAddress(mint, owner);

      const account = await connection.getAccountInfo(ata);
      return account !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get token supply info
   * @param {string} mintAddress - Token mint address
   * @returns {Promise<Object>} Supply info
   */
  async getTokenSupply(mintAddress) {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);
      const supply = await connection.getTokenSupply(mint);

      return {
        amount: supply.value.amount,
        decimals: supply.value.decimals,
        uiAmount: supply.value.uiAmount,
      };
    } catch (error) {
      console.error('Error getting token supply:', error);
      throw new Error('Failed to get token supply');
    }
  }

  /**
   * Get largest token accounts (top holders)
   * @param {string} mintAddress - Token mint address
   * @param {number} limit - Number of accounts to return
   * @returns {Promise<Array>} Top holders
   */
  async getTopHolders(mintAddress, limit = 10) {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);

      const accounts = await connection.getTokenLargestAccounts(mint);

      return accounts.value.slice(0, limit).map((account) => ({
        address: account.address.toString(),
        amount: account.uiAmount,
      }));
    } catch (error) {
      console.error('Error getting top holders:', error);
      throw new Error('Failed to get top holders');
    }
  }

  /**
   * Get token holder count
   * @param {string} mintAddress - Token mint address
   * @returns {Promise<number>} Number of holders
   */
  async getHolderCount(mintAddress) {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);

      const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mint.toBase58() } },
        ],
      });

      // Filter accounts with non-zero balance
      return accounts.length;
    } catch (error) {
      console.error('Error getting holder count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to account changes
   * @param {string} address - Account address to subscribe to
   * @param {function} callback - Callback function
   * @returns {number} Subscription ID
   */
  subscribeToAccount(address, callback) {
    const connection = this.getConnection();
    const publicKey = new PublicKey(address);

    return connection.onAccountChange(publicKey, (accountInfo) => {
      callback(accountInfo);
    });
  }

  /**
   * Unsubscribe from account changes
   * @param {number} subscriptionId - Subscription ID
   */
  async unsubscribeFromAccount(subscriptionId) {
    const connection = this.getConnection();
    await connection.removeAccountChangeListener(subscriptionId);
  }

  /**
   * Subscribe to logs
   * @param {string} address - Address to filter logs
   * @param {function} callback - Callback function
   * @returns {number} Subscription ID
   */
  subscribeToLogs(address, callback) {
    const connection = this.getConnection();
    const publicKey = new PublicKey(address);

    return connection.onLogs(publicKey, (logs) => {
      callback(logs);
    });
  }

  /**
   * Get recent transactions for an address
   * @param {string} address - Address to get transactions for
   * @param {number} limit - Number of transactions
   * @returns {Promise<Array>}
   */
  async getRecentTransactions(address, limit = 10) {
    try {
      const connection = this.getConnection();
      const publicKey = new PublicKey(address);

      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit,
      });

      return signatures.map((sig) => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        err: sig.err,
      }));
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw new Error('Failed to get recent transactions');
    }
  }

  /**
   * Health check for Solana connection
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      const connection = this.getConnection();
      const slot = await connection.getSlot();
      const blockHeight = await connection.getBlockHeight();

      return {
        healthy: true,
        slot,
        blockHeight,
        network: solanaConfig.getNetwork(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        network: solanaConfig.getNetwork(),
      };
    }
  }

  /**
   * Convert lamports to SOL
   * @param {number} lamports
   * @returns {number}
   */
  lamportsToSol(lamports) {
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Convert SOL to lamports
   * @param {number} sol
   * @returns {number}
   */
  solToLamports(sol) {
    return sol * LAMPORTS_PER_SOL;
  }
}

// Export singleton instance
module.exports = new SolanaService();
