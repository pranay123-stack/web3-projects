// Mock contract ABIs and interaction utilities
// In production, this would contain actual contract ABIs and ethers/viem interactions

import { CYPHER_ADDRESSES, TOKEN_ADDRESSES } from './constants';

// Pool Factory ABI (simplified)
export const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
  'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)',
] as const;

// Pool ABI (simplified)
export const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function tickSpacing() external view returns (int24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
  'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
] as const;

// Position Manager ABI (simplified)
export const POSITION_MANAGER_ABI = [
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function mint(MintParams calldata params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function increaseLiquidity(IncreaseLiquidityParams calldata params) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity(DecreaseLiquidityParams calldata params) external payable returns (uint256 amount0, uint256 amount1)',
  'function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1)',
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
] as const;

// Contract addresses helper
export function getContractAddress(contract: keyof typeof CYPHER_ADDRESSES): string {
  return CYPHER_ADDRESSES[contract];
}

// Token address helper
export function getTokenAddress(symbol: keyof typeof TOKEN_ADDRESSES): string {
  return TOKEN_ADDRESSES[symbol];
}

// Mock function to simulate contract reads
// In production, this would use ethers/viem to read from the blockchain
export async function readContract<T>(
  address: string,
  method: string,
  _args: unknown[] = []
): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Return mock data based on method
  switch (method) {
    case 'slot0':
      return {
        sqrtPriceX96: BigInt('1992823806219823941892398'),
        tick: 200123,
        observationIndex: 100,
        observationCardinality: 1000,
        observationCardinalityNext: 1000,
        feeProtocol: 0,
        unlocked: true,
      } as T;

    case 'liquidity':
      return BigInt('1000000000000000000000') as T;

    case 'fee':
      return 3000 as T;

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// Mock function to simulate contract writes
export async function writeContract(
  _address: string,
  _method: string,
  _args: unknown[] = []
): Promise<{ hash: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock transaction hash
  return {
    hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  };
}

// Mock function to estimate gas
export async function estimateGas(
  _address: string,
  _method: string,
  _args: unknown[] = []
): Promise<bigint> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return BigInt(150000 + Math.floor(Math.random() * 50000));
}

// Multicall helper (mock)
export async function multicall<T>(
  calls: Array<{
    address: string;
    method: string;
    args?: unknown[];
  }>
): Promise<T[]> {
  const results = await Promise.all(
    calls.map(call => readContract<T>(call.address, call.method, call.args))
  );
  return results;
}
