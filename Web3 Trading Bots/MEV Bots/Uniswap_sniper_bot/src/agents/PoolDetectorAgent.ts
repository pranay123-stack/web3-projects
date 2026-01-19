import { Contract, Log, Interface } from 'ethers';
import { BaseAgent } from './BaseAgent';
import { ProviderManager, getProviderManager } from '../core/provider';
import { getUniswapV3Service } from '../services/uniswapV3';
import { getUniswapV4Service } from '../services/uniswapV4';
import { config } from '../config';
import {
  AgentType,
  AgentMessage,
  MessageType,
  PoolInfo,
  V4PoolInfo,
  PoolCreatedEvent,
  V4PoolKey
} from '../types';
import {
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V4_POOL_MANAGER_ABI,
  EVENT_TOPICS
} from '../contracts/abis';
import { shortenAddress, isWETH } from '../utils/helpers';
import NodeCache from 'node-cache';

export class PoolDetectorAgent extends BaseAgent {
  private provider: ProviderManager;
  private v3Factory: Contract;
  private v4PoolManager: Contract;
  private v3FactoryInterface: Interface;
  private v4PoolManagerInterface: Interface;
  private poolCache: NodeCache;
  private blockListener: ((blockNumber: number) => void) | null = null;
  private isProcessingBlock: boolean = false;
  private lastProcessedBlock: number = 0;

  constructor() {
    super(AgentType.POOL_DETECTOR, 'PoolDetector');
    this.provider = getProviderManager();

    this.v3Factory = this.provider.getReadOnlyContract(
      config.uniswapV3.factory,
      UNISWAP_V3_FACTORY_ABI
    );
    this.v4PoolManager = this.provider.getReadOnlyContract(
      config.uniswapV4.poolManager,
      UNISWAP_V4_POOL_MANAGER_ABI
    );

    this.v3FactoryInterface = new Interface(UNISWAP_V3_FACTORY_ABI);
    this.v4PoolManagerInterface = new Interface(UNISWAP_V4_POOL_MANAGER_ABI);

    // Cache pools for 5 minutes
    this.poolCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  protected async onStart(): Promise<void> {
    this.logger.info('Starting pool detector');

    // Get current block
    this.lastProcessedBlock = await this.provider.getBlockNumber();

    // Subscribe to new blocks
    this.blockListener = this.handleNewBlock.bind(this);
    this.provider.on('block', this.blockListener);

    this.logger.info('Pool detector started', {
      v3Factory: shortenAddress(config.uniswapV3.factory),
      v4PoolManager: shortenAddress(config.uniswapV4.poolManager)
    });
  }

  protected async onStop(): Promise<void> {
    if (this.blockListener) {
      this.provider.off('block', this.blockListener);
      this.blockListener = null;
    }

    this.poolCache.flushAll();
    this.logger.info('Pool detector stopped');
  }

  protected onMessage(message: AgentMessage): void {
    switch (message.type) {
      case MessageType.PENDING_TX_DETECTED:
        this.handlePendingTx(message.payload);
        break;

      case MessageType.COMMAND:
        this.handleCommand(message.payload);
        break;
    }
  }

  /**
   * Handle new block
   */
  private async handleNewBlock(blockNumber: number): Promise<void> {
    if (this.isProcessingBlock) return;
    if (blockNumber <= this.lastProcessedBlock) return;

    this.isProcessingBlock = true;

    try {
      // Process blocks we may have missed
      for (let bn = this.lastProcessedBlock + 1; bn <= blockNumber; bn++) {
        await this.processBlock(bn);
      }
      this.lastProcessedBlock = blockNumber;
    } catch (error) {
      this.logger.error('Error processing block', { blockNumber, error });
    } finally {
      this.isProcessingBlock = false;
    }
  }

  /**
   * Process a single block for pool creation events
   */
  private async processBlock(blockNumber: number): Promise<void> {
    try {
      // Get V3 pool created events
      const v3Logs = await this.provider.getHttpProvider().getLogs({
        fromBlock: blockNumber,
        toBlock: blockNumber,
        address: config.uniswapV3.factory,
        topics: [EVENT_TOPICS.V3_POOL_CREATED]
      });

      // Get V4 initialize events
      const v4Logs = await this.provider.getHttpProvider().getLogs({
        fromBlock: blockNumber,
        toBlock: blockNumber,
        address: config.uniswapV4.poolManager,
        topics: [EVENT_TOPICS.V4_INITIALIZE]
      });

      // Process V3 events
      for (const log of v3Logs) {
        await this.processV3PoolCreated(log);
      }

      // Process V4 events
      for (const log of v4Logs) {
        await this.processV4Initialize(log);
      }
    } catch (error) {
      this.logger.error('Error processing block', { blockNumber, error });
    }
  }

  /**
   * Process V3 PoolCreated event
   */
  private async processV3PoolCreated(log: Log): Promise<void> {
    try {
      const decoded = this.v3FactoryInterface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });

      if (!decoded) return;

      const event: PoolCreatedEvent = {
        version: 'v3',
        poolAddress: decoded.args.pool,
        token0: decoded.args.token0,
        token1: decoded.args.token1,
        fee: Number(decoded.args.fee),
        tickSpacing: Number(decoded.args.tickSpacing),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Date.now()
      };

      // Check if one of the tokens is WETH (potential snipe target)
      const hasWeth = isWETH(event.token0, config.wethAddress) ||
                      isWETH(event.token1, config.wethAddress);

      if (hasWeth) {
        this.logger.pool(`V3 Pool created: ${shortenAddress(event.poolAddress)}`, {
          token0: shortenAddress(event.token0),
          token1: shortenAddress(event.token1),
          fee: event.fee
        });

        // Get full pool info
        const v3Service = getUniswapV3Service();
        const poolInfo = await v3Service.getPoolInfo(event.poolAddress);

        if (poolInfo) {
          // Cache the pool
          this.poolCache.set(event.poolAddress, poolInfo);

          // Broadcast to other agents
          this.broadcast(MessageType.NEW_POOL_DETECTED, {
            event,
            pool: poolInfo
          });
        }
      }
    } catch (error) {
      this.logger.error('Error processing V3 pool created event', { error });
    }
  }

  /**
   * Process V4 Initialize event
   */
  private async processV4Initialize(log: Log): Promise<void> {
    try {
      const decoded = this.v4PoolManagerInterface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });

      if (!decoded) return;

      const event: PoolCreatedEvent = {
        version: 'v4',
        poolAddress: config.uniswapV4.poolManager,
        token0: decoded.args.currency0,
        token1: decoded.args.currency1,
        fee: Number(decoded.args.fee),
        tickSpacing: Number(decoded.args.tickSpacing),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Date.now(),
        hooks: decoded.args.hooks,
        poolId: decoded.args.id
      };

      // Check if one of the tokens is WETH or native ETH
      const hasWethOrEth = isWETH(event.token0, config.wethAddress) ||
                          isWETH(event.token1, config.wethAddress) ||
                          event.token0 === '0x0000000000000000000000000000000000000000' ||
                          event.token1 === '0x0000000000000000000000000000000000000000';

      if (hasWethOrEth) {
        this.logger.pool(`V4 Pool initialized: ${event.poolId?.slice(0, 18)}...`, {
          currency0: shortenAddress(event.token0),
          currency1: shortenAddress(event.token1),
          fee: event.fee,
          hooks: event.hooks !== '0x0000000000000000000000000000000000000000'
            ? shortenAddress(event.hooks!)
            : 'none'
        });

        // Get full pool info
        const v4Service = getUniswapV4Service();
        const poolKey: V4PoolKey = {
          currency0: event.token0,
          currency1: event.token1,
          fee: event.fee,
          tickSpacing: event.tickSpacing,
          hooks: event.hooks || '0x0000000000000000000000000000000000000000'
        };

        const poolInfo = await v4Service.getPoolInfo(poolKey);

        if (poolInfo) {
          // Cache the pool
          this.poolCache.set(event.poolId!, poolInfo);

          // Broadcast to other agents
          this.broadcast(MessageType.NEW_POOL_DETECTED, {
            event,
            pool: poolInfo
          });
        }
      }
    } catch (error) {
      this.logger.error('Error processing V4 initialize event', { error });
    }
  }

  /**
   * Handle pending transaction that might create a pool
   */
  private async handlePendingTx(pendingTx: any): Promise<void> {
    if (!pendingTx.decoded) return;

    // Check for pool initialization in pending transactions
    if (pendingTx.decoded.method === 'initialize') {
      this.logger.info('Detected pending pool initialization', {
        hash: pendingTx.hash,
        method: pendingTx.decoded.method
      });

      // Could potentially front-run this, but for now just log it
      this.broadcast(MessageType.SNIPE_OPPORTUNITY, {
        type: 'pending_pool_init',
        pendingTx
      });
    }
  }

  /**
   * Handle commands
   */
  private handleCommand(command: any): void {
    switch (command.action) {
      case 'scan':
        this.scanHistoricalPools(command.fromBlock, command.toBlock);
        break;

      case 'stats':
        this.broadcast(MessageType.STATUS_UPDATE, {
          cachedPools: this.poolCache.keys().length,
          lastProcessedBlock: this.lastProcessedBlock
        });
        break;
    }
  }

  /**
   * Scan historical blocks for pool creation
   */
  async scanHistoricalPools(fromBlock: number, toBlock: number): Promise<void> {
    this.logger.info(`Scanning blocks ${fromBlock} to ${toBlock} for pools`);

    try {
      // V3 pools
      const v3Logs = await this.provider.getHttpProvider().getLogs({
        fromBlock,
        toBlock,
        address: config.uniswapV3.factory,
        topics: [EVENT_TOPICS.V3_POOL_CREATED]
      });

      // V4 pools
      const v4Logs = await this.provider.getHttpProvider().getLogs({
        fromBlock,
        toBlock,
        address: config.uniswapV4.poolManager,
        topics: [EVENT_TOPICS.V4_INITIALIZE]
      });

      this.logger.info(`Found ${v3Logs.length} V3 pools and ${v4Logs.length} V4 pools`);

      for (const log of v3Logs) {
        await this.processV3PoolCreated(log);
      }

      for (const log of v4Logs) {
        await this.processV4Initialize(log);
      }
    } catch (error) {
      this.logger.error('Error scanning historical pools', { error });
    }
  }

  /**
   * Get cached pool info
   */
  getCachedPool(addressOrId: string): PoolInfo | V4PoolInfo | undefined {
    return this.poolCache.get(addressOrId);
  }

  /**
   * Get all cached pools
   */
  getAllCachedPools(): (PoolInfo | V4PoolInfo)[] {
    const keys = this.poolCache.keys();
    const pools: (PoolInfo | V4PoolInfo)[] = [];
    for (const key of keys) {
      const pool = this.poolCache.get<PoolInfo | V4PoolInfo>(key);
      if (pool) {
        pools.push(pool);
      }
    }
    return pools;
  }
}

export default PoolDetectorAgent;
