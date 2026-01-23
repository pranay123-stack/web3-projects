import { TransactionResponse, Interface } from 'ethers';
import { BaseAgent } from './BaseAgent';
import { ProviderManager, getProviderManager } from '../core/provider';
import { config, mempoolConfig } from '../config';
import {
  AgentType,
  AgentMessage,
  MessageType,
  PendingTransaction,
  DecodedTransaction
} from '../types';
import {
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V4_POOL_MANAGER_ABI,
  FUNCTION_SELECTORS
} from '../contracts/abis';
import { shortenTxHash } from '../utils/helpers';

export class MempoolAgent extends BaseAgent {
  private provider: ProviderManager;
  private pendingTxs: Map<string, PendingTransaction> = new Map();
  private v3RouterInterface: Interface;
  private v4PoolManagerInterface: Interface;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private processedTxHashes: Set<string> = new Set();
  private maxProcessedHashes: number = 10000;

  constructor() {
    super(AgentType.MEMPOOL_MONITOR, 'MempoolMonitor');
    this.provider = getProviderManager();
    this.v3RouterInterface = new Interface(UNISWAP_V3_ROUTER_ABI);
    this.v4PoolManagerInterface = new Interface(UNISWAP_V4_POOL_MANAGER_ABI);
  }

  protected async onStart(): Promise<void> {
    this.logger.info('Starting mempool monitoring');

    // Subscribe to pending transactions
    await this.provider.subscribeToPendingTransactions(this.handlePendingTx.bind(this));

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTransactions();
    }, 10000);

    this.logger.info('Mempool agent started');
  }

  protected async onStop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.pendingTxs.clear();
    this.processedTxHashes.clear();
    this.logger.info('Mempool agent stopped');
  }

  protected onMessage(message: AgentMessage): void {
    switch (message.type) {
      case MessageType.COMMAND:
        this.handleCommand(message.payload);
        break;
    }
  }

  /**
   * Handle incoming pending transaction
   */
  private async handlePendingTx(tx: TransactionResponse): Promise<void> {
    if (!tx || !tx.hash) return;

    // Skip if already processed
    if (this.processedTxHashes.has(tx.hash)) return;

    // Add to processed set
    this.processedTxHashes.add(tx.hash);
    if (this.processedTxHashes.size > this.maxProcessedHashes) {
      // Clear oldest entries
      const entries = Array.from(this.processedTxHashes);
      entries.slice(0, 1000).forEach(h => this.processedTxHashes.delete(h));
    }

    // Check if transaction is relevant (going to Uniswap contracts)
    if (!this.isRelevantTransaction(tx)) return;

    const pendingTx = this.createPendingTransaction(tx);
    if (!pendingTx) return;

    // Decode transaction data
    pendingTx.decoded = this.decodeTransactionData(tx.to || '', tx.data);

    // Store pending transaction
    this.pendingTxs.set(tx.hash, pendingTx);

    // Check limits
    if (this.pendingTxs.size > mempoolConfig.maxPendingTxs) {
      this.removeOldestTransaction();
    }

    // Broadcast to other agents
    this.broadcast(MessageType.PENDING_TX_DETECTED, pendingTx);

    this.logger.debug(`Pending tx detected: ${shortenTxHash(tx.hash)}`, {
      method: pendingTx.decoded?.method,
      to: tx.to
    });
  }

  /**
   * Check if transaction is relevant for sniping
   */
  private isRelevantTransaction(tx: TransactionResponse): boolean {
    const to = tx.to?.toLowerCase();
    if (!to) return false;

    // Check if it's going to Uniswap contracts
    const relevantAddresses = [
      config.uniswapV3.router.toLowerCase(),
      config.uniswapV3.factory.toLowerCase(),
      config.uniswapV3.positionManager.toLowerCase(),
      config.uniswapV4.poolManager.toLowerCase(),
      config.uniswapV4.positionManager.toLowerCase()
    ];

    return relevantAddresses.includes(to);
  }

  /**
   * Create pending transaction object
   */
  private createPendingTransaction(tx: TransactionResponse): PendingTransaction {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: tx.value,
      gasPrice: tx.gasPrice || BigInt(0),
      maxFeePerGas: tx.maxFeePerGas || undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || undefined,
      gasLimit: tx.gasLimit,
      nonce: tx.nonce,
      data: tx.data,
      timestamp: Date.now()
    };
  }

  /**
   * Decode transaction data
   */
  private decodeTransactionData(to: string, data: string): DecodedTransaction | undefined {
    const selector = data.slice(0, 10).toLowerCase();

    try {
      // V3 Router methods
      if (to.toLowerCase() === config.uniswapV3.router.toLowerCase()) {
        return this.decodeV3RouterTx(selector, data);
      }

      // V4 Pool Manager methods
      if (to.toLowerCase() === config.uniswapV4.poolManager.toLowerCase()) {
        return this.decodeV4PoolManagerTx(selector, data);
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Decode V3 Router transaction
   */
  private decodeV3RouterTx(selector: string, data: string): DecodedTransaction | undefined {
    try {
      switch (selector) {
        case FUNCTION_SELECTORS.exactInputSingle: {
          const decoded = this.v3RouterInterface.decodeFunctionData('exactInputSingle', data);
          const params = decoded[0];
          return {
            method: 'exactInputSingle',
            params: {
              tokenIn: params.tokenIn,
              tokenOut: params.tokenOut,
              fee: Number(params.fee),
              recipient: params.recipient,
              deadline: Number(params.deadline),
              amountIn: BigInt(params.amountIn),
              amountOutMinimum: BigInt(params.amountOutMinimum),
              sqrtPriceLimitX96: BigInt(params.sqrtPriceLimitX96)
            },
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: BigInt(params.amountIn)
          };
        }

        case FUNCTION_SELECTORS.exactInput: {
          const decoded = this.v3RouterInterface.decodeFunctionData('exactInput', data);
          const params = decoded[0];
          return {
            method: 'exactInput',
            params: {
              path: params.path,
              recipient: params.recipient,
              deadline: Number(params.deadline),
              amountIn: BigInt(params.amountIn),
              amountOutMinimum: BigInt(params.amountOutMinimum)
            },
            amountIn: BigInt(params.amountIn)
          };
        }

        case FUNCTION_SELECTORS.multicall:
        case FUNCTION_SELECTORS.multicallWithDeadline: {
          return {
            method: 'multicall',
            params: {}
          };
        }

        default:
          return undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Decode V4 Pool Manager transaction
   */
  private decodeV4PoolManagerTx(selector: string, data: string): DecodedTransaction | undefined {
    try {
      switch (selector) {
        case FUNCTION_SELECTORS.swap: {
          const decoded = this.v4PoolManagerInterface.decodeFunctionData('swap', data);
          const poolKey = decoded[0];
          const params = decoded[1];
          return {
            method: 'swap',
            params: {
              poolKey: {
                currency0: poolKey.currency0,
                currency1: poolKey.currency1,
                fee: Number(poolKey.fee),
                tickSpacing: Number(poolKey.tickSpacing),
                hooks: poolKey.hooks
              },
              zeroForOne: params.zeroForOne,
              amountSpecified: BigInt(params.amountSpecified),
              sqrtPriceLimitX96: BigInt(params.sqrtPriceLimitX96)
            }
          };
        }

        case FUNCTION_SELECTORS.initialize: {
          const decoded = this.v4PoolManagerInterface.decodeFunctionData('initialize', data);
          const poolKey = decoded[0];
          return {
            method: 'initialize',
            params: {
              poolKey: {
                currency0: poolKey.currency0,
                currency1: poolKey.currency1,
                fee: Number(poolKey.fee),
                tickSpacing: Number(poolKey.tickSpacing),
                hooks: poolKey.hooks
              },
              sqrtPriceX96: BigInt(decoded[1])
            }
          };
        }

        case FUNCTION_SELECTORS.modifyLiquidity: {
          return {
            method: 'modifyLiquidity',
            params: {}
          };
        }

        default:
          return undefined;
      }
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Clean up old pending transactions
   */
  private cleanupOldTransactions(): void {
    const now = Date.now();
    const timeout = mempoolConfig.pendingTxTimeoutMs;

    for (const [hash, tx] of this.pendingTxs) {
      if (now - tx.timestamp > timeout) {
        this.pendingTxs.delete(hash);
      }
    }
  }

  /**
   * Remove oldest transaction when limit is exceeded
   */
  private removeOldestTransaction(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [hash, tx] of this.pendingTxs) {
      if (tx.timestamp < oldestTime) {
        oldestTime = tx.timestamp;
        oldest = hash;
      }
    }

    if (oldest) {
      this.pendingTxs.delete(oldest);
    }
  }

  /**
   * Handle commands
   */
  private handleCommand(command: any): void {
    switch (command.action) {
      case 'clear':
        this.pendingTxs.clear();
        this.logger.info('Pending transactions cleared');
        break;

      case 'stats':
        this.broadcast(MessageType.STATUS_UPDATE, {
          pendingCount: this.pendingTxs.size,
          processedCount: this.processedTxHashes.size
        });
        break;
    }
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): PendingTransaction[] {
    return Array.from(this.pendingTxs.values());
  }

  /**
   * Get pending transaction by hash
   */
  getPendingTransaction(hash: string): PendingTransaction | undefined {
    return this.pendingTxs.get(hash);
  }
}

export default MempoolAgent;
