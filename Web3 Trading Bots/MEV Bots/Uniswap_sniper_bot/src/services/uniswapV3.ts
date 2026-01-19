import { Contract, Interface, parseEther, formatEther, ZeroAddress, MaxUint256 } from 'ethers';
import { ProviderManager, getProviderManager } from '../core/provider';
import { config, V3_FEE_TIERS } from '../config';
import {
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_QUOTER_ABI,
  ERC20_ABI
} from '../contracts/abis';
import { PoolInfo, TokenInfo, SwapEvent, PoolCreatedEvent, GasEstimate } from '../types';
import { createComponentLogger } from '../utils/logger';
import {
  sqrtPriceX96ToPrice,
  calculateMinAmountOut,
  getDeadline,
  sortTokens,
  retry
} from '../utils/helpers';

const logger = createComponentLogger('UniswapV3');

export class UniswapV3Service {
  private provider: ProviderManager;
  private factory: Contract;
  private router: Contract;
  private quoter: Contract;
  private factoryInterface: Interface;
  private poolInterface: Interface;

  constructor() {
    this.provider = getProviderManager();
    this.factory = this.provider.getContract(config.uniswapV3.factory, UNISWAP_V3_FACTORY_ABI);
    this.router = this.provider.getContract(config.uniswapV3.router, UNISWAP_V3_ROUTER_ABI);
    this.quoter = this.provider.getReadOnlyContract(config.uniswapV3.quoter, UNISWAP_V3_QUOTER_ABI);
    this.factoryInterface = new Interface(UNISWAP_V3_FACTORY_ABI);
    this.poolInterface = new Interface(UNISWAP_V3_POOL_ABI);
  }

  /**
   * Get pool address for a token pair
   */
  async getPool(tokenA: string, tokenB: string, fee: number): Promise<string | null> {
    try {
      const poolAddress = await this.factory.getPool(tokenA, tokenB, fee);
      if (poolAddress === ZeroAddress) {
        return null;
      }
      return poolAddress;
    } catch (error) {
      logger.error('Error getting pool', { tokenA, tokenB, fee, error });
      return null;
    }
  }

  /**
   * Find all pools for a token pair across all fee tiers
   */
  async findAllPools(tokenA: string, tokenB: string): Promise<string[]> {
    const pools: string[] = [];

    for (const fee of V3_FEE_TIERS) {
      const pool = await this.getPool(tokenA, tokenB, fee);
      if (pool) {
        pools.push(pool);
      }
    }

    return pools;
  }

  /**
   * Get detailed pool information
   */
  async getPoolInfo(poolAddress: string): Promise<PoolInfo | null> {
    try {
      const pool = this.provider.getReadOnlyContract(poolAddress, UNISWAP_V3_POOL_ABI);

      const [token0Address, token1Address, fee, slot0, liquidity] = await Promise.all([
        pool.token0(),
        pool.token1(),
        pool.fee(),
        pool.slot0(),
        pool.liquidity()
      ]);

      const [token0, token1] = await Promise.all([
        this.getTokenInfo(token0Address),
        this.getTokenInfo(token1Address)
      ]);

      if (!token0 || !token1) {
        return null;
      }

      return {
        address: poolAddress,
        token0,
        token1,
        fee: Number(fee),
        liquidity: BigInt(liquidity),
        sqrtPriceX96: BigInt(slot0.sqrtPriceX96),
        tick: Number(slot0.tick),
        version: 'v3',
        createdAt: Date.now(),
        createdTxHash: ''
      };
    } catch (error) {
      logger.error('Error getting pool info', { poolAddress, error });
      return null;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const token = this.provider.getReadOnlyContract(tokenAddress, ERC20_ABI);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: BigInt(totalSupply)
      };
    } catch (error) {
      logger.error('Error getting token info', { tokenAddress, error });
      return null;
    }
  }

  /**
   * Get quote for exact input swap
   */
  async quoteExactInputSingle(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    fee: number
  ): Promise<{ amountOut: bigint; gasEstimate: bigint } | null> {
    try {
      const result = await this.quoter.quoteExactInputSingle.staticCall({
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0
      });

      return {
        amountOut: BigInt(result.amountOut),
        gasEstimate: BigInt(result.gasEstimate)
      };
    } catch (error) {
      logger.debug('Quote failed', { tokenIn, tokenOut, fee, error });
      return null;
    }
  }

  /**
   * Find best quote across all fee tiers
   */
  async getBestQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<{ amountOut: bigint; fee: number; gasEstimate: bigint } | null> {
    let bestQuote: { amountOut: bigint; fee: number; gasEstimate: bigint } | null = null;

    for (const fee of V3_FEE_TIERS) {
      const quote = await this.quoteExactInputSingle(tokenIn, tokenOut, amountIn, fee);
      if (quote && (!bestQuote || quote.amountOut > bestQuote.amountOut)) {
        bestQuote = { ...quote, fee };
      }
    }

    return bestQuote;
  }

  /**
   * Execute exact input single swap
   */
  async swapExactInputSingle(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: bigint,
    amountOutMinimum: bigint,
    recipient?: string,
    deadline?: number
  ): Promise<string> {
    const swapParams = {
      tokenIn,
      tokenOut,
      fee,
      recipient: recipient || this.provider.getAddress(),
      deadline: deadline || getDeadline(20),
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0
    };

    // Check if we need to send ETH (if tokenIn is WETH)
    const value = tokenIn.toLowerCase() === config.wethAddress.toLowerCase() ? amountIn : BigInt(0);

    const tx = await this.router.exactInputSingle(swapParams, { value });
    logger.info('Swap transaction sent', { hash: tx.hash });

    return tx.hash;
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spender: string, amount?: bigint): Promise<string> {
    const token = this.provider.getContract(tokenAddress, ERC20_ABI);
    const approveAmount = amount || MaxUint256;

    const tx = await token.approve(spender, approveAmount);
    await tx.wait();

    logger.info('Token approved', { token: tokenAddress, spender, amount: approveAmount.toString() });
    return tx.hash;
  }

  /**
   * Check and approve token if needed
   */
  async ensureApproval(tokenAddress: string, amount: bigint): Promise<void> {
    const token = this.provider.getReadOnlyContract(tokenAddress, ERC20_ABI);
    const allowance = await token.allowance(this.provider.getAddress(), config.uniswapV3.router);

    if (BigInt(allowance) < amount) {
      await this.approveToken(tokenAddress, config.uniswapV3.router);
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string, holder?: string): Promise<bigint> {
    const token = this.provider.getReadOnlyContract(tokenAddress, ERC20_ABI);
    const balance = await token.balanceOf(holder || this.provider.getAddress());
    return BigInt(balance);
  }

  /**
   * Decode pool created event from logs
   */
  decodePoolCreatedEvent(log: any): PoolCreatedEvent | null {
    try {
      const decoded = this.factoryInterface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (!decoded || decoded.name !== 'PoolCreated') {
        return null;
      }

      return {
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode swap event from logs
   */
  decodeSwapEvent(log: any): SwapEvent | null {
    try {
      const decoded = this.poolInterface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (!decoded || decoded.name !== 'Swap') {
        return null;
      }

      return {
        version: 'v3',
        poolAddress: log.address,
        sender: decoded.args.sender,
        recipient: decoded.args.recipient,
        amount0: BigInt(decoded.args.amount0),
        amount1: BigInt(decoded.args.amount1),
        sqrtPriceX96: BigInt(decoded.args.sqrtPriceX96),
        liquidity: BigInt(decoded.args.liquidity),
        tick: Number(decoded.args.tick),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Estimate gas for swap
   */
  async estimateSwapGas(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: bigint,
    amountOutMinimum: bigint
  ): Promise<GasEstimate> {
    const swapParams = {
      tokenIn,
      tokenOut,
      fee,
      recipient: this.provider.getAddress(),
      deadline: getDeadline(20),
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0
    };

    const value = tokenIn.toLowerCase() === config.wethAddress.toLowerCase() ? amountIn : BigInt(0);

    const gasLimit = await this.router.exactInputSingle.estimateGas(swapParams, { value });
    const feeData = await this.provider.getFeeData();

    return {
      gasLimit: BigInt(gasLimit),
      maxFeePerGas: feeData.maxFeePerGas || BigInt(0),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || BigInt(0),
      estimatedCost: BigInt(gasLimit) * (feeData.maxFeePerGas || BigInt(0))
    };
  }

  /**
   * Get factory address
   */
  getFactoryAddress(): string {
    return config.uniswapV3.factory;
  }

  /**
   * Get router address
   */
  getRouterAddress(): string {
    return config.uniswapV3.router;
  }
}

// Singleton instance
let uniswapV3Service: UniswapV3Service | null = null;

export function getUniswapV3Service(): UniswapV3Service {
  if (!uniswapV3Service) {
    uniswapV3Service = new UniswapV3Service();
  }
  return uniswapV3Service;
}

export default UniswapV3Service;
