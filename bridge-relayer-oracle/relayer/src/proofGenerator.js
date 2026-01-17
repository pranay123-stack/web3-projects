/**
 * @fileoverview Proof generator module for the bridge relayer
 * Builds merkle trees and generates inclusion proofs for cross-chain messages
 */

const { ethers } = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const winston = require('winston');
const { RELAYER_CONFIG } = require('./config');

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
 * ProofGenerator class for creating and managing merkle proofs
 */
class ProofGenerator {
  constructor() {
    // Store merkle trees by chain and block
    this.trees = new Map();
    // Store messages for proof generation
    this.messages = new Map();
    // Cache for generated proofs
    this.proofCache = new Map();
  }

  /**
   * Hash a message for inclusion in the merkle tree
   * @param {object} message - The message object
   * @returns {Buffer} Hashed message
   */
  hashMessage(message) {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'uint256', 'address', 'address', 'bytes32', 'uint256', 'uint256'],
      [
        message.nonce,
        message.sourceChainId,
        message.destChainId,
        message.sender,
        message.target,
        ethers.keccak256(message.data),
        message.gasLimit,
        message.timestamp,
      ]
    );
    return Buffer.from(ethers.keccak256(encoded).slice(2), 'hex');
  }

  /**
   * Hash a leaf for merkle tree
   * @param {string|Buffer} data - The data to hash
   * @returns {Buffer} Hashed leaf
   */
  hashLeaf(data) {
    if (typeof data === 'string') {
      return Buffer.from(ethers.keccak256(data).slice(2), 'hex');
    }
    return keccak256(data);
  }

  /**
   * Add a message to the pending messages for a block
   * @param {number} chainId - Source chain ID
   * @param {number} blockNumber - Block number
   * @param {object} message - The message object
   */
  addMessage(chainId, blockNumber, message) {
    const key = `${chainId}-${blockNumber}`;

    if (!this.messages.has(key)) {
      this.messages.set(key, []);
    }

    const hashedMessage = this.hashMessage(message);
    this.messages.get(key).push({
      message,
      hash: hashedMessage,
      index: this.messages.get(key).length,
    });

    logger.debug(`Added message to tree`, {
      chainId,
      blockNumber,
      messageHash: hashedMessage.toString('hex'),
    });

    // Invalidate cached tree
    this.trees.delete(key);
  }

  /**
   * Build merkle tree for a specific chain and block
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   * @returns {MerkleTree|null} The merkle tree or null if no messages
   */
  buildTree(chainId, blockNumber) {
    const key = `${chainId}-${blockNumber}`;

    // Return cached tree if available
    if (this.trees.has(key)) {
      return this.trees.get(key);
    }

    const messages = this.messages.get(key);
    if (!messages || messages.length === 0) {
      logger.warn(`No messages found for chain ${chainId} block ${blockNumber}`);
      return null;
    }

    // Get leaves (hashed messages)
    const leaves = messages.map(m => m.hash);

    // Pad to power of 2 for balanced tree
    const paddedLeaves = this._padToPowerOfTwo(leaves);

    // Build the tree
    const tree = new MerkleTree(paddedLeaves, keccak256, {
      sortPairs: true,
      hashLeaves: false, // Already hashed
    });

    this.trees.set(key, tree);

    logger.info(`Built merkle tree`, {
      chainId,
      blockNumber,
      leaves: leaves.length,
      root: tree.getHexRoot(),
    });

    return tree;
  }

  /**
   * Generate merkle proof for a specific message
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   * @param {string} messageHash - The message hash to prove
   * @returns {object|null} Proof object or null if not found
   */
  generateProof(chainId, blockNumber, messageHash) {
    const cacheKey = `${chainId}-${blockNumber}-${messageHash}`;

    // Check cache
    if (this.proofCache.has(cacheKey)) {
      return this.proofCache.get(cacheKey);
    }

    const tree = this.buildTree(chainId, blockNumber);
    if (!tree) {
      return null;
    }

    const key = `${chainId}-${blockNumber}`;
    const messages = this.messages.get(key);

    // Find the message
    const messageEntry = messages.find(
      m => m.hash.toString('hex') === messageHash.replace('0x', '')
    );

    if (!messageEntry) {
      logger.warn(`Message not found in tree`, { chainId, blockNumber, messageHash });
      return null;
    }

    // Generate proof
    const proof = tree.getHexProof(messageEntry.hash);

    const proofObject = {
      root: tree.getHexRoot(),
      proof: proof,
      leaf: '0x' + messageEntry.hash.toString('hex'),
      index: messageEntry.index,
    };

    // Cache the proof
    this.proofCache.set(cacheKey, proofObject);

    logger.debug(`Generated proof`, {
      chainId,
      blockNumber,
      messageHash,
      proofLength: proof.length,
    });

    return proofObject;
  }

  /**
   * Generate proof for a message object
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   * @param {object} message - The message object
   * @returns {object|null} Proof object or null if not found
   */
  generateProofForMessage(chainId, blockNumber, message) {
    const hashedMessage = this.hashMessage(message);
    return this.generateProof(chainId, blockNumber, '0x' + hashedMessage.toString('hex'));
  }

  /**
   * Verify a proof locally
   * @param {object} proofObject - The proof object from generateProof
   * @returns {boolean} True if proof is valid
   */
  verifyProof(proofObject) {
    if (!proofObject || !proofObject.proof || !proofObject.root || !proofObject.leaf) {
      return false;
    }

    const tree = new MerkleTree([], keccak256, { sortPairs: true });
    const leaf = Buffer.from(proofObject.leaf.slice(2), 'hex');
    const proof = proofObject.proof.map(p => Buffer.from(p.slice(2), 'hex'));
    const root = Buffer.from(proofObject.root.slice(2), 'hex');

    return tree.verify(proof, leaf, root);
  }

  /**
   * Get the merkle root for a chain and block
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   * @returns {string|null} The merkle root in hex or null
   */
  getRoot(chainId, blockNumber) {
    const tree = this.buildTree(chainId, blockNumber);
    return tree ? tree.getHexRoot() : null;
  }

  /**
   * Get all messages for a chain and block
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   * @returns {Array} Array of message entries
   */
  getMessages(chainId, blockNumber) {
    const key = `${chainId}-${blockNumber}`;
    return this.messages.get(key) || [];
  }

  /**
   * Clear messages and trees for a specific chain and block
   * @param {number} chainId - Chain ID
   * @param {number} blockNumber - Block number
   */
  clearBlock(chainId, blockNumber) {
    const key = `${chainId}-${blockNumber}`;
    this.messages.delete(key);
    this.trees.delete(key);

    // Clear related proof cache entries
    for (const cacheKey of this.proofCache.keys()) {
      if (cacheKey.startsWith(`${chainId}-${blockNumber}-`)) {
        this.proofCache.delete(cacheKey);
      }
    }

    logger.debug(`Cleared data for chain ${chainId} block ${blockNumber}`);
  }

  /**
   * Clear old blocks from memory
   * @param {number} chainId - Chain ID
   * @param {number} keepFromBlock - Keep blocks from this number onwards
   */
  pruneOldBlocks(chainId, keepFromBlock) {
    let pruned = 0;

    for (const key of this.messages.keys()) {
      const [keyChainId, blockNumber] = key.split('-').map(Number);
      if (keyChainId === chainId && blockNumber < keepFromBlock) {
        this.clearBlock(chainId, blockNumber);
        pruned++;
      }
    }

    logger.info(`Pruned ${pruned} old blocks for chain ${chainId}`);
    return pruned;
  }

  /**
   * Pad leaves array to power of 2
   * @param {Array} leaves - Array of leaves
   * @returns {Array} Padded array
   * @private
   */
  _padToPowerOfTwo(leaves) {
    if (leaves.length === 0) return leaves;

    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(leaves.length)));

    if (leaves.length === nextPowerOf2) return leaves;

    // Pad with zero hashes
    const zeroHash = Buffer.alloc(32, 0);
    const padded = [...leaves];
    while (padded.length < nextPowerOf2) {
      padded.push(zeroHash);
    }

    return padded;
  }

  /**
   * Create a sparse merkle tree proof
   * For use with sparse merkle tree verification on-chain
   * @param {number} key - The key/index in the tree
   * @param {Buffer} value - The value at the key
   * @param {number} depth - Tree depth
   * @param {Map} tree - The sparse tree data
   * @returns {object} Sparse proof object
   */
  generateSparseProof(key, value, depth, tree) {
    const proof = [];
    let currentKey = key;

    for (let i = 0; i < depth; i++) {
      const siblingKey = currentKey ^ 1;
      const sibling = tree.get(siblingKey) || Buffer.alloc(32, 0);
      proof.push('0x' + sibling.toString('hex'));
      currentKey = Math.floor(currentKey / 2);
    }

    return {
      key,
      value: '0x' + value.toString('hex'),
      proof,
      depth,
    };
  }

  /**
   * Get statistics about stored data
   * @returns {object} Statistics
   */
  getStats() {
    let totalMessages = 0;
    let totalTrees = 0;
    let totalCachedProofs = this.proofCache.size;

    for (const messages of this.messages.values()) {
      totalMessages += messages.length;
    }

    totalTrees = this.trees.size;

    return {
      totalMessages,
      totalTrees,
      totalCachedProofs,
      messageKeys: Array.from(this.messages.keys()),
    };
  }
}

/**
 * Create message object from event data
 * @param {object} event - Event data from listener
 * @returns {object} Message object
 */
function createMessageFromEvent(event) {
  return {
    nonce: BigInt(event.nonce),
    sourceChainId: BigInt(event.chainId),
    destChainId: BigInt(event.destChainId),
    sender: event.sender,
    target: event.target,
    data: event.data,
    gasLimit: BigInt(event.gasLimit),
    timestamp: BigInt(Math.floor(event.timestamp / 1000)),
  };
}

module.exports = {
  ProofGenerator,
  createMessageFromEvent,
};
