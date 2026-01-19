import { parseEther, formatEther, MaxUint256 } from 'ethers';
import { Mutex } from 'async-mutex';
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
  SnipeTarget,
  SnipeResult,
  TokenSafetyCheck,
  TradeHistory,
  Position
} from '../types';
import { ERC20_ABI } from '../contracts/abis';
import {
  calculateMinAmountOut,
  getDeadline,
  shortenAddress,
  shortenTxHash,
  formatEthAmount,
  generateId,
  isWETH
} from '../utils/helpers';
import PQueue from 'p-queue';

export class SniperAgent extends BaseAgent {
  private provider: ProviderManager;
  private snipeQueue: PQueue;
  private executionMutex: Mutex;
  private positions: Map<string, Position> = new Map();
  private tradeHistory: TradeHistory[] = [];
  private pendingSnipes: Map<string, SnipeTarget> = new Map();
  private safetyResults: Map<string, TokenSafetyCheck> = new Map();
  private isExecuting: boolean = false;

  constructor() {
    super(AgentType.SNIPER, 'SniperAgent');
    this.provider = getProviderManager();
    this.snipeQueue = new PQueue({ concurrency: 1, interval: 500 });
    this.executionMutex = new Mutex();
  }

  protected async onStart(): Promise<void> {
    // Check wallet balance
    const balance = await this.provider.getBalance();
    this.logger.info('Sniper agent started', {
      wallet: shortenAddress(this.provider.getAddress()),
      balance: formatEther(balance)
    });

    if (balance < config.sniper.maxPositionSizeEth) {
      this.logger.warn('Wallet balance is lower than max position size');
    }
  }

  protected async onStop(): Promise<void> {
    this.snipeQueue.clear();
    this.pendingSnipes.clear();
    this.logger.info('Sniper agent stopped');
  }

  protected onMessage(message: AgentMessage): void {
    switch (message.type) {
      case MessageType.NEW_POOL_DETECTED:
        this.handleNewPool(message.payload);
        break;

      case MessageType.SAFETY_CHECK_RESULT:
        this.handleSafetyResult(message.payload);
        break;

      case MessageType.SNIPE_OPPORTUNITY:
        this.handleSnipeOpportunity(message.payload);
        break;

      case MessageType.GAS_UPDATE:
        this.handleGasUpdate(message.payload);
        break;

      case MessageType.COMMAND:
        this.handleCommand(message.payload);
        break;
    }
  }

  /**
   * Handle new pool detection
   */
  private async handleNewPool(payload: any): Promise<void> {
    const { pool, event } = payload;

    // Determine target token (non-WETH token)
    const targetToken = isWETH(pool.token0.address, config.wethAddress)
      ? pool.token1
      : pool.token0;

    const baseToken = isWETH(pool.token0.address, config.wethAddress)
      ? pool.token0
      : pool.token1;

    this.logger.snipe(`New pool detected - ${targetToken.symbol}/${baseToken.symbol}`, {
      pool: pool.version === 'v4' ? pool.poolId?.slice(0, 18) : shortenAddress(pool.address),
      version: pool.version,
      fee: pool.fee
    });

    // Create snipe target
    const snipeTarget: SnipeTarget = {
      pool,
      targetToken,
      baseToken,
      amountIn: config.sniper.maxPositionSizeEth,
      minAmountOut: BigInt(0), // Will be calculated later
      maxGasPrice: parseEther(config.sniper.maxGasPriceGwei.toString()) / BigInt(1e9),
      deadline: getDeadline(5),
      slippage: config.sniper.slippageTolerance
    };

    // Store as pending
    const poolId = pool.version === 'v4' ? pool.poolId : pool.address;
    this.pendingSnipes.set(poolId, snipeTarget);

    // Request safety check
    this.sendMessage(AgentType.SAFETY, MessageType.SAFETY_CHECK_REQUEST, {
      token: targetToken,
      requestId: poolId
    });
  }

  /**
   * Handle safety check result
   */
  private async handleSafetyResult(payload: any): Promise<void> {
    const { pool, token, result, requestId } = payload;

    // Store safety result
    this.safetyResults.set(token, result);

    // Get pending snipe
    const snipeTarget = this.pendingSnipes.get(requestId || pool);
    if (!snipeTarget) {
      return;
    }

    // Evaluate if we should snipe
    const shouldSnipe = this.evaluateSnipeDecision(snipeTarget, result);

    if (shouldSnipe) {
      this.logger.snipe(`Safety check passed - Executing snipe for ${snipeTarget.targetToken.symbol}`, {
        score: result.score,
        buyTax: result.buyTax,
        sellTax: result.sellTax
      });

      // Queue the snipe
      this.snipeQueue.add(() => this.executeSnipe(snipeTarget));
    } else {
      this.logger.warn(`Skipping snipe for ${snipeTarget.targetToken.symbol}`, {
        score: result.score,
        reasons: result.warnings
      });
      this.pendingSnipes.delete(requestId || pool);
    }
  }

  /**
   * Evaluate whether to proceed with snipe
   */
  private evaluateSnipeDecision(target: SnipeTarget, safety: TokenSafetyCheck): boolean {
    // Reject honeypots
    if (safety.isHoneypot) {
      return false;
    }

    // Check safety score
    if (safety.score < 50) {
      return false;
    }

    // Check taxes
    if (safety.buyTax > config.sniper.maxBuyTax) {
      return false;
    }

    if (safety.sellTax > config.sniper.maxSellTax) {
      return false;
    }

    // Check liquidity
    if (target.pool.liquidity < config.sniper.minLiquidityEth) {
      return false;
    }

    return true;
  }

  /**
   * Execute the snipe
   */
  private async executeSnipe(target: SnipeTarget): Promise<SnipeResult> {
    const release = await this.executionMutex.acquire();

    try {
      this.isExecuting = true;
      const poolId = target.pool.version === 'v4'
        ? (target.pool as V4PoolInfo).poolId
        : target.pool.address;

      this.logger.snipe(`Executing snipe for ${target.targetToken.symbol}`, {
        amountIn: formatEther(target.amountIn),
        pool: shortenAddress(poolId)
      });

      // Check balance
      const balance = await this.provider.getBalance();
      if (balance < target.amountIn) {
        throw new Error('Insufficient balance');
      }

      // Get quote and calculate min amount out
      let amountOut: bigint;
      let txHash: string;

      if (target.pool.version === 'v3') {
        // V3 snipe
        const result = await this.executeV3Snipe(target);
        amountOut = result.amountOut;
        txHash = result.txHash;
      } else {
        // V4 snipe
        const result = await this.executeV4Snipe(target);
        amountOut = result.amountOut;
        txHash = result.txHash;
      }

      // Record the trade
      const trade: TradeHistory = {
        id: generateId(),
        type: 'buy',
        token: target.targetToken,
        pool: target.pool,
        amountIn: target.amountIn,
        amountOut,
        price: target.amountIn * BigInt(10 ** target.targetToken.decimals) / amountOut,
        gasUsed: BigInt(0),
        gasCost: BigInt(0),
        txHash,
        timestamp: Date.now()
      };

      this.tradeHistory.push(trade);

      // Create position
      const position: Position = {
        token: target.targetToken,
        pool: target.pool,
        entryPrice: trade.price,
        amount: amountOut,
        currentPrice: trade.price,
        pnl: BigInt(0),
        pnlPercent: 0,
        timestamp: Date.now()
      };

      this.positions.set(target.targetToken.address, position);

      // Broadcast success
      const result: SnipeResult = {
        success: true,
        txHash,
        amountIn: target.amountIn,
        amountOut,
        timestamp: Date.now()
      };

      this.broadcast(MessageType.SNIPE_EXECUTED, result);

      this.logger.success(`Snipe successful: ${target.targetToken.symbol}`, {
        txHash: shortenTxHash(txHash),
        amountIn: formatEther(target.amountIn),
        amountOut: formatEther(amountOut)
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Snipe failed for ${target.targetToken.symbol}`, { error: error.message });

      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    } finally {
      this.isExecuting = false;
      const poolId = target.pool.version === 'v4'
        ? (target.pool as V4PoolInfo).poolId
        : target.pool.address;
      this.pendingSnipes.delete(poolId);
      release();
    }
  }

  /**
   * Execute V3 snipe
   */
  private async executeV3Snipe(target: SnipeTarget): Promise<{ txHash: string; amountOut: bigint }> {
    const v3Service = getUniswapV3Service();

    // Ensure WETH is approved if needed
    if (!isWETH(target.baseToken.address, config.wethAddress)) {
      await v3Service.ensureApproval(target.baseToken.address, target.amountIn);
    }

    // Get quote
    const quote = await v3Service.quoteExactInputSingle(
      target.baseToken.address,
      target.targetToken.address,
      target.amountIn,
      target.pool.fee
    );

    if (!quote) {
      throw new Error('Failed to get quote');
    }

    const minAmountOut = calculateMinAmountOut(quote.amountOut, target.slippage);

    // Execute swap
    const txHash = await v3Service.swapExactInputSingle(
      target.baseToken.address,
      target.targetToken.address,
      target.pool.fee,
      target.amountIn,
      minAmountOut,
      undefined,
      target.deadline
    );

    // Wait for confirmation
    const receipt = await this.provider.waitForTransaction(txHash, 1);

    if (!receipt || receipt.status === 0) {
      throw new Error('Transaction failed');
    }

    return { txHash, amountOut: quote.amountOut };
  }

  /**
   * Execute V4 snipe
   */
  private async executeV4Snipe(target: SnipeTarget): Promise<{ txHash: string; amountOut: bigint }> {
    const v4Service = getUniswapV4Service();
    const v4Pool = target.pool as V4PoolInfo;

    // Get quote
    const zeroForOne = target.baseToken.address.toLowerCase() < target.targetToken.address.toLowerCase();
    const quote = await v4Service.quoteExactInputSingle(
      v4Pool.poolKey,
      zeroForOne,
      target.amountIn
    );

    if (!quote) {
      throw new Error('Failed to get V4 quote');
    }

    const amountOut = zeroForOne
      ? BigInt(-quote.deltaAmounts[1])
      : BigInt(-quote.deltaAmounts[0]);

    // Execute swap
    const txHash = await v4Service.executeSwap(
      v4Pool.poolKey,
      zeroForOne,
      target.amountIn,
      BigInt(0)
    );

    // Wait for confirmation
    const receipt = await this.provider.waitForTransaction(txHash, 1);

    if (!receipt || receipt.status === 0) {
      throw new Error('V4 Transaction failed');
    }

    return { txHash, amountOut };
  }

  /**
   * Handle snipe opportunity from mempool
   */
  private handleSnipeOpportunity(payload: any): void {
    if (payload.type === 'pending_pool_init') {
      this.logger.info('Potential front-run opportunity detected');
      // Could implement front-running logic here
    }
  }

  /**
   * Handle gas price updates
   */
  private handleGasUpdate(payload: any): void {
    // Adjust strategy based on gas prices
    if (payload.gasPrice > config.sniper.maxGasPriceGwei * 1e9) {
      this.logger.warn('Gas price too high, pausing sniper');
      this.pause();
    } else if (this.status === 'paused') {
      this.resume();
    }
  }

  /**
   * Handle commands
   */
  private handleCommand(command: any): void {
    switch (command.action) {
      case 'sell':
        if (command.token) {
          this.sellPosition(command.token);
        }
        break;

      case 'sellAll':
        this.sellAllPositions();
        break;

      case 'status':
        this.broadcast(MessageType.STATUS_UPDATE, {
          positions: Array.from(this.positions.values()),
          pendingSnipes: this.pendingSnipes.size,
          isExecuting: this.isExecuting
        });
        break;
    }
  }

  /**
   * Sell a specific position
   */
  async sellPosition(tokenAddress: string): Promise<SnipeResult> {
    const position = this.positions.get(tokenAddress);
    if (!position) {
      return { success: false, error: 'Position not found', timestamp: Date.now() };
    }

    try {
      const v3Service = getUniswapV3Service();

      // Approve token if needed
      await v3Service.ensureApproval(tokenAddress, position.amount);

      // Get quote
      const quote = await v3Service.getBestQuote(
        tokenAddress,
        config.wethAddress,
        position.amount
      );

      if (!quote) {
        throw new Error('Failed to get sell quote');
      }

      const minAmountOut = calculateMinAmountOut(quote.amountOut, config.sniper.slippageTolerance);

      // Execute sell
      const txHash = await v3Service.swapExactInputSingle(
        tokenAddress,
        config.wethAddress,
        quote.fee,
        position.amount,
        minAmountOut
      );

      await this.provider.waitForTransaction(txHash, 1);

      // Remove position
      this.positions.delete(tokenAddress);

      this.logger.success(`Sold position: ${position.token.symbol}`, {
        txHash: shortenTxHash(txHash),
        amountOut: formatEther(quote.amountOut)
      });

      return {
        success: true,
        txHash,
        amountOut: quote.amountOut,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return { success: false, error: error.message, timestamp: Date.now() };
    }
  }

  /**
   * Sell all positions
   */
  async sellAllPositions(): Promise<void> {
    for (const [tokenAddress] of this.positions) {
      await this.sellPosition(tokenAddress);
    }
  }

  /**
   * Get current positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get trade history
   */
  getTradeHistory(): TradeHistory[] {
    return this.tradeHistory;
  }
}

export default SniperAgent;
