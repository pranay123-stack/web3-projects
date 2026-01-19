import { Contract, Interface, ZeroAddress, MaxUint256, keccak256, AbiCoder } from 'ethers';
import { ProviderManager, getProviderManager } from '../core/provider';
import { config, V4_TICK_SPACINGS } from '../config';
import {
  UNISWAP_V4_POOL_MANAGER_ABI,
  UNISWAP_V4_POSITION_MANAGER_ABI,
  UNISWAP_V4_QUOTER_ABI,
  UNISWAP_V4_STATE_VIEW_ABI,
  ERC20_ABI
} from '../contracts/abis';
import {
  V4PoolInfo,
  V4PoolKey,
  TokenInfo,
  PoolCreatedEvent,
  SwapEvent,
  GasEstimate
} from '../types';
import { createComponentLogger } from '../utils/logger';
import { getDeadline, computePoolId, sortTokens } from '../utils/helpers';

const logger = createComponentLogger('UniswapV4');

// V4 Hook Flags
export enum HookFlags {
  BEFORE_INITIALIZE = 1 << 0,
  AFTER_INITIALIZE = 1 << 1,
  BEFORE_ADD_LIQUIDITY = 1 << 2,
  AFTER_ADD_LIQUIDITY = 1 << 3,
  BEFORE_REMOVE_LIQUIDITY = 1 << 4,
  AFTER_REMOVE_LIQUIDITY = 1 << 5,
  BEFORE_SWAP = 1 << 6,
  AFTER_SWAP = 1 << 7,
  BEFORE_DONATE = 1 << 8,
  AFTER_DONATE = 1 << 9,
  BEFORE_SWAP_RETURNS_DELTA = 1 << 10,
  AFTER_SWAP_RETURNS_DELTA = 1 << 11,
  AFTER_ADD_LIQUIDITY_RETURNS_DELTA = 1 << 12,
  AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA = 1 << 13
}

export class UniswapV4Service {
  private provider: ProviderManager;
  private poolManager: Contract;
  private positionManager: Contract;
  private quoter: Contract;
  private stateView: Contract;
  private poolManagerInterface: Interface;
  private abiCoder: AbiCoder;

  constructor() {
    this.provider = getProviderManager();
    this.poolManager = this.provider.getContract(config.uniswapV4.poolManager, UNISWAP_V4_POOL_MANAGER_ABI);
    this.positionManager = this.provider.getContract(config.uniswapV4.positionManager, UNISWAP_V4_POSITION_MANAGER_ABI);
    this.quoter = this.provider.getReadOnlyContract(config.uniswapV4.quoter, UNISWAP_V4_QUOTER_ABI);
    this.stateView = this.provider.getReadOnlyContract(config.uniswapV4.stateView, UNISWAP_V4_STATE_VIEW_ABI);
    this.poolManagerInterface = new Interface(UNISWAP_V4_POOL_MANAGER_ABI);
    this.abiCoder = new AbiCoder();
  }

  /**
   * Compute pool ID from pool key
   */
  computePoolId(poolKey: V4PoolKey): string {
    // Encode pool key and hash it
    const encoded = this.abiCoder.encode(
      ['address', 'address', 'uint24', 'int24', 'address'],
      [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
    );
    return keccak256(encoded);
  }

  /**
   * Get pool state from pool ID
   */
  async getPoolState(poolId: string): Promise<{
    sqrtPriceX96: bigint;
    tick: number;
    protocolFee: number;
    lpFee: number;
  } | null> {
    try {
      const slot0 = await this.stateView.getSlot0(poolId);
      return {
        sqrtPriceX96: BigInt(slot0.sqrtPriceX96),
        tick: Number(slot0.tick),
        protocolFee: Number(slot0.protocolFee),
        lpFee: Number(slot0.lpFee)
      };
    } catch (error) {
      logger.error('Error getting pool state', { poolId, error });
      return null;
    }
  }

  /**
   * Get pool liquidity
   */
  async getPoolLiquidity(poolId: string): Promise<bigint> {
    try {
      const liquidity = await this.stateView.getLiquidity(poolId);
      return BigInt(liquidity);
    } catch (error) {
      logger.error('Error getting pool liquidity', { poolId, error });
      return BigInt(0);
    }
  }

  /**
   * Get detailed pool information for V4
   */
  async getPoolInfo(poolKey: V4PoolKey): Promise<V4PoolInfo | null> {
    try {
      const poolId = this.computePoolId(poolKey);
      const [state, liquidity, token0Info, token1Info] = await Promise.all([
        this.getPoolState(poolId),
        this.getPoolLiquidity(poolId),
        this.getTokenInfo(poolKey.currency0),
        this.getTokenInfo(poolKey.currency1)
      ]);

      if (!state || !token0Info || !token1Info) {
        return null;
      }

      const hookFlags = this.decodeHookFlags(poolKey.hooks);

      return {
        address: config.uniswapV4.poolManager,
        token0: token0Info,
        token1: token1Info,
        fee: poolKey.fee,
        liquidity,
        sqrtPriceX96: state.sqrtPriceX96,
        tick: state.tick,
        version: 'v4',
        createdAt: Date.now(),
        createdTxHash: '',
        poolKey,
        poolId,
        hookAddress: poolKey.hooks,
        hookFlags
      };
    } catch (error) {
      logger.error('Error getting V4 pool info', { poolKey, error });
      return null;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    // Handle native ETH (address(0))
    if (tokenAddress === ZeroAddress) {
      return {
        address: ZeroAddress,
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
        totalSupply: BigInt(0)
      };
    }

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
   * Quote exact input single for V4
   */
  async quoteExactInputSingle(
    poolKey: V4PoolKey,
    zeroForOne: boolean,
    exactAmount: bigint
  ): Promise<{ deltaAmounts: bigint[]; sqrtPriceX96After: bigint } | null> {
    try {
      const result = await this.quoter.quoteExactInputSingle.staticCall(
        poolKey,
        zeroForOne,
        exactAmount,
        '0x' // Empty hook data
      );

      return {
        deltaAmounts: result.deltaAmounts.map((d: any) => BigInt(d)),
        sqrtPriceX96After: BigInt(result.sqrtPriceX96After)
      };
    } catch (error) {
      logger.debug('V4 quote failed', { poolKey, error });
      return null;
    }
  }

  /**
   * Find best V4 pool for a token pair
   */
  async findBestPool(
    tokenA: string,
    tokenB: string,
    amountIn: bigint
  ): Promise<{ poolKey: V4PoolKey; amountOut: bigint } | null> {
    const [currency0, currency1] = sortTokens(tokenA, tokenB);
    const zeroForOne = tokenA.toLowerCase() === currency0.toLowerCase();

    let bestResult: { poolKey: V4PoolKey; amountOut: bigint } | null = null;

    // Try different fee tiers and tick spacings
    const fees = [100, 500, 3000, 10000];

    for (const fee of fees) {
      for (const tickSpacing of V4_TICK_SPACINGS) {
        // Try with no hooks first
        const poolKey: V4PoolKey = {
          currency0,
          currency1,
          fee,
          tickSpacing,
          hooks: ZeroAddress
        };

        const quote = await this.quoteExactInputSingle(poolKey, zeroForOne, amountIn);

        if (quote) {
          const amountOut = zeroForOne
            ? BigInt(-quote.deltaAmounts[1])
            : BigInt(-quote.deltaAmounts[0]);

          if (!bestResult || amountOut > bestResult.amountOut) {
            bestResult = { poolKey, amountOut };
          }
        }
      }
    }

    return bestResult;
  }

  /**
   * Execute swap through V4 Pool Manager
   * Note: V4 swaps require going through the unlock callback pattern
   */
  async executeSwap(
    poolKey: V4PoolKey,
    zeroForOne: boolean,
    amountSpecified: bigint,
    sqrtPriceLimitX96: bigint = BigInt(0)
  ): Promise<string> {
    const swapParams = {
      zeroForOne,
      amountSpecified,
      sqrtPriceLimitX96: sqrtPriceLimitX96 || (zeroForOne
        ? BigInt('4295128739') + BigInt(1) // MIN_SQRT_PRICE + 1
        : BigInt('1461446703485210103287273052203988822378723970342') - BigInt(1)) // MAX_SQRT_PRICE - 1
    };

    // For V4, swaps need to go through a router that handles the unlock pattern
    // This is a simplified version - production would use a dedicated swap router
    const tx = await this.poolManager.swap(poolKey, swapParams, '0x');
    logger.info('V4 Swap transaction sent', { hash: tx.hash });

    return tx.hash;
  }

  /**
   * Decode hook flags from hook address
   * In V4, the hook permissions are encoded in the address itself
   */
  decodeHookFlags(hookAddress: string): number {
    if (hookAddress === ZeroAddress) {
      return 0;
    }

    // The last 14 bits of the hook address encode the permissions
    const addressBigInt = BigInt(hookAddress);
    return Number(addressBigInt & BigInt(0x3FFF));
  }

  /**
   * Check if a hook has specific capability
   */
  hasHookCapability(hookAddress: string, flag: HookFlags): boolean {
    const flags = this.decodeHookFlags(hookAddress);
    return (flags & flag) !== 0;
  }

  /**
   * Decode Initialize event from V4
   */
  decodeInitializeEvent(log: any): PoolCreatedEvent | null {
    try {
      const decoded = this.poolManagerInterface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (!decoded || decoded.name !== 'Initialize') {
        return null;
      }

      return {
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode Swap event from V4
   */
  decodeSwapEvent(log: any): SwapEvent | null {
    try {
      const decoded = this.poolManagerInterface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (!decoded || decoded.name !== 'Swap') {
        return null;
      }

      return {
        version: 'v4',
        poolAddress: config.uniswapV4.poolManager,
        sender: decoded.args.sender,
        recipient: decoded.args.sender, // V4 doesn't have separate recipient in event
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
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string, holder?: string): Promise<bigint> {
    if (tokenAddress === ZeroAddress) {
      return this.provider.getBalance(holder);
    }

    const token = this.provider.getReadOnlyContract(tokenAddress, ERC20_ABI);
    const balance = await token.balanceOf(holder || this.provider.getAddress());
    return BigInt(balance);
  }

  /**
   * Estimate gas for V4 swap
   */
  async estimateSwapGas(
    poolKey: V4PoolKey,
    zeroForOne: boolean,
    amountSpecified: bigint
  ): Promise<GasEstimate> {
    const swapParams = {
      zeroForOne,
      amountSpecified,
      sqrtPriceLimitX96: BigInt(0)
    };

    try {
      const gasLimit = await this.poolManager.swap.estimateGas(poolKey, swapParams, '0x');
      const feeData = await this.provider.getFeeData();

      return {
        gasLimit: BigInt(gasLimit),
        maxFeePerGas: feeData.maxFeePerGas || BigInt(0),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || BigInt(0),
        estimatedCost: BigInt(gasLimit) * (feeData.maxFeePerGas || BigInt(0))
      };
    } catch (error) {
      // Return default estimates if estimation fails
      const feeData = await this.provider.getFeeData();
      return {
        gasLimit: BigInt(300000),
        maxFeePerGas: feeData.maxFeePerGas || BigInt(0),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || BigInt(0),
        estimatedCost: BigInt(300000) * (feeData.maxFeePerGas || BigInt(0))
      };
    }
  }

  /**
   * Get Pool Manager address
   */
  getPoolManagerAddress(): string {
    return config.uniswapV4.poolManager;
  }
}

// Singleton instance
let uniswapV4Service: UniswapV4Service | null = null;

export function getUniswapV4Service(): UniswapV4Service {
  if (!uniswapV4Service) {
    uniswapV4Service = new UniswapV4Service();
  }
  return uniswapV4Service;
}

export default UniswapV4Service;
