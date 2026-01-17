const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

/**
 * Solana connection configuration
 * Handles RPC connection and network settings
 */
class SolanaConfig {
  constructor() {
    this.connection = null;
    this.network = null;
  }

  /**
   * Initialize Solana connection
   * @returns {Connection}
   */
  initialize() {
    if (this.connection) {
      return this.connection;
    }

    const rpcUrl = process.env.SOLANA_RPC_URL;
    this.network = process.env.SOLANA_NETWORK || 'devnet';

    // Use provided RPC URL or fallback to cluster API
    const endpoint = rpcUrl || clusterApiUrl(this.network);

    const connectionConfig = {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: this.getWebSocketEndpoint(endpoint),
    };

    this.connection = new Connection(endpoint, connectionConfig);

    console.log(`Solana connected to: ${this.network} (${endpoint})`);

    return this.connection;
  }

  /**
   * Get WebSocket endpoint from HTTP endpoint
   * @param {string} httpEndpoint
   * @returns {string}
   */
  getWebSocketEndpoint(httpEndpoint) {
    return httpEndpoint
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
  }

  /**
   * Get Solana connection
   * @returns {Connection}
   */
  getConnection() {
    if (!this.connection) {
      return this.initialize();
    }
    return this.connection;
  }

  /**
   * Get current network
   * @returns {string}
   */
  getNetwork() {
    return this.network;
  }

  /**
   * Validate a Solana public key
   * @param {string} address
   * @returns {boolean}
   */
  isValidPublicKey(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
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
   * Get Token Program ID
   * @returns {PublicKey}
   */
  getTokenProgramId() {
    const tokenProgramId = process.env.TOKEN_PROGRAM_ID || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    return new PublicKey(tokenProgramId);
  }

  /**
   * Get platform wallet address
   * @returns {PublicKey|null}
   */
  getPlatformWallet() {
    const walletAddress = process.env.PLATFORM_WALLET_ADDRESS;
    if (!walletAddress) {
      return null;
    }
    return new PublicKey(walletAddress);
  }

  /**
   * Get platform fee percentage
   * @returns {number}
   */
  getPlatformFeePercentage() {
    return parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 1;
  }

  /**
   * Check connection health
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch (error) {
      console.error('Solana connection health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get current slot
   * @returns {Promise<number>}
   */
  async getCurrentSlot() {
    return await this.connection.getSlot();
  }

  /**
   * Get recent blockhash
   * @returns {Promise<{blockhash: string, lastValidBlockHeight: number}>}
   */
  async getRecentBlockhash() {
    return await this.connection.getLatestBlockhash();
  }
}

// Export singleton instance
module.exports = new SolanaConfig();
