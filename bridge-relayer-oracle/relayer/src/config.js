/**
 * @fileoverview Configuration module for the bridge relayer
 * Handles environment variables and chain configurations
 */

require('dotenv').config();

// Chain configurations
const CHAINS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETH_MAINNET_RPC || 'http://localhost:8545',
    bridgeAddress: process.env.ETH_MAINNET_BRIDGE || '',
    oracleAddress: process.env.ETH_MAINNET_ORACLE || '',
    confirmations: 12,
    blockTime: 12000, // 12 seconds
  },
  5: {
    name: 'Goerli',
    rpcUrl: process.env.GOERLI_RPC || 'http://localhost:8545',
    bridgeAddress: process.env.GOERLI_BRIDGE || '',
    oracleAddress: process.env.GOERLI_ORACLE || '',
    confirmations: 6,
    blockTime: 12000,
  },
  11155111: {
    name: 'Sepolia',
    rpcUrl: process.env.SEPOLIA_RPC || 'http://localhost:8545',
    bridgeAddress: process.env.SEPOLIA_BRIDGE || '',
    oracleAddress: process.env.SEPOLIA_ORACLE || '',
    confirmations: 6,
    blockTime: 12000,
  },
  31337: {
    name: 'Hardhat Local',
    rpcUrl: process.env.LOCAL_RPC || 'http://127.0.0.1:8545',
    bridgeAddress: process.env.LOCAL_BRIDGE || '',
    oracleAddress: process.env.LOCAL_ORACLE || '',
    confirmations: 1,
    blockTime: 1000,
  },
};

// Relayer configuration
const RELAYER_CONFIG = {
  // Private key for signing transactions
  privateKey: process.env.RELAYER_PRIVATE_KEY || '',

  // Gas settings
  maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000', // 100 gwei
  gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER || '1.1'),
  gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),

  // Retry settings
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '5000'), // 5 seconds

  // Batch settings
  batchSize: parseInt(process.env.BATCH_SIZE || '10'),
  batchInterval: parseInt(process.env.BATCH_INTERVAL || '60000'), // 1 minute

  // Health check
  healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '3000'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Event signatures
const EVENT_SIGNATURES = {
  MessageSent: 'MessageSent(bytes32,uint256,uint256,address,address,bytes,uint256,uint256)',
  StateRootFinalized: 'StateRootFinalized(uint256,uint256,bytes32)',
  ValidatorAdded: 'ValidatorAdded(address,uint256,bytes)',
};

// Contract ABIs (simplified for relayer use)
const ABIS = {
  MessageBridge: [
    'event MessageSent(bytes32 indexed messageHash, uint256 indexed nonce, uint256 indexed destChainId, address sender, address target, bytes data, uint256 gasLimit, uint256 fee)',
    'function executeMessage((uint256 nonce, uint256 sourceChainId, uint256 destChainId, address sender, address target, bytes data, uint256 gasLimit, uint256 timestamp) message, bytes32[] proof, uint256 blockNumber) external',
    'function executeMessageTrusted((uint256 nonce, uint256 sourceChainId, uint256 destChainId, address sender, address target, bytes data, uint256 gasLimit, uint256 timestamp) message) external',
    'function getMessageStatus(uint256 sourceChainId, uint256 nonce) view returns ((bool sent, bool executed, bool failed, uint256 executedAt, bytes32 resultHash))',
    'function outboundNonce() view returns (uint256)',
    'function inboundNonce() view returns (uint256)',
    'function hashMessage((uint256 nonce, uint256 sourceChainId, uint256 destChainId, address sender, address target, bytes data, uint256 gasLimit, uint256 timestamp) message) view returns (bytes32)',
  ],
  BridgeOracle: [
    'event StateRootFinalized(uint256 indexed chainId, uint256 blockNumber, bytes32 root)',
    'function proposeStateRoot(uint256 chainId, uint256 blockNumber, bytes32 root, bytes signature) external',
    'function signStateRoot(bytes32 updateId, bytes signature) external',
    'function verifyProof(uint256 chainId, uint256 blockNumber, bytes32[] proof, bytes32 leaf) view returns (bool)',
    'function latestFinalizedBlock(uint256 chainId) view returns (uint256)',
    'function latestStateRoot(uint256 chainId) view returns (bytes32)',
    'function getRequiredSignatures() view returns (uint256)',
  ],
  ValidatorRegistry: [
    'event ValidatorAdded(address indexed validator, uint256 stake, bytes publicKey)',
    'function isActiveValidator(address addr) view returns (bool)',
    'function getActiveValidators() view returns (address[])',
    'function recordActivity(address validatorAddr) external',
  ],
};

/**
 * Get chain configuration
 * @param {number} chainId - The chain ID
 * @returns {object} Chain configuration
 */
function getChainConfig(chainId) {
  const config = CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

/**
 * Get all supported chain IDs
 * @returns {number[]} Array of chain IDs
 */
function getSupportedChainIds() {
  return Object.keys(CHAINS).map(id => parseInt(id));
}

/**
 * Validate configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  const errors = [];

  if (!RELAYER_CONFIG.privateKey) {
    errors.push('RELAYER_PRIVATE_KEY is required');
  }

  // Check at least one chain has bridge address configured
  const configuredChains = Object.entries(CHAINS)
    .filter(([_, config]) => config.bridgeAddress)
    .map(([id, _]) => id);

  if (configuredChains.length === 0) {
    console.warn('Warning: No bridge addresses configured');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

module.exports = {
  CHAINS,
  RELAYER_CONFIG,
  EVENT_SIGNATURES,
  ABIS,
  getChainConfig,
  getSupportedChainIds,
  validateConfig,
};
