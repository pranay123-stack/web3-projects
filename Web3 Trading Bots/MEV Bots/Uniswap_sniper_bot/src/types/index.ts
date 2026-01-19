import { BigNumberish } from 'ethers';

// ============================================
// CORE TYPES
// ============================================

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
}

export interface PoolInfo {
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
  version: 'v3' | 'v4';
  createdAt: number;
  createdTxHash: string;
}

export interface V4PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface V4PoolInfo extends PoolInfo {
  poolKey: V4PoolKey;
  poolId: string;
  hookAddress: string;
  hookFlags: number;
}

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit: bigint;
  nonce: number;
  data: string;
  timestamp: number;
  decoded?: DecodedTransaction;
}

export interface DecodedTransaction {
  method: string;
  params: Record<string, any>;
  targetPool?: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: bigint;
  amountOut?: bigint;
}

export interface SnipeTarget {
  pool: PoolInfo | V4PoolInfo;
  targetToken: TokenInfo;
  baseToken: TokenInfo;
  amountIn: bigint;
  minAmountOut: bigint;
  maxGasPrice: bigint;
  deadline: number;
  slippage: number;
}

export interface SnipeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  amountIn?: bigint;
  amountOut?: bigint;
  profit?: bigint;
  timestamp: number;
}

export interface TokenSafetyCheck {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  isRenounced: boolean;
  hasBlacklist: boolean;
  hasMaxTx: boolean;
  maxTxAmount?: bigint;
  hasMaxWallet: boolean;
  maxWalletAmount?: bigint;
  liquidityLocked: boolean;
  lockDuration?: number;
  score: number;
  warnings: string[];
}

export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: bigint;
}

// ============================================
// AGENT TYPES
// ============================================

export enum AgentType {
  MEMPOOL_MONITOR = 'mempool_monitor',
  POOL_DETECTOR = 'pool_detector',
  SNIPER = 'sniper',
  SAFETY = 'safety',
  COORDINATOR = 'coordinator'
}

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error',
  STOPPED = 'stopped'
}

export interface AgentMessage {
  from: AgentType;
  to: AgentType | 'broadcast';
  type: MessageType;
  payload: any;
  timestamp: number;
  id: string;
}

export enum MessageType {
  NEW_POOL_DETECTED = 'new_pool_detected',
  PENDING_TX_DETECTED = 'pending_tx_detected',
  SNIPE_OPPORTUNITY = 'snipe_opportunity',
  SNIPE_EXECUTED = 'snipe_executed',
  SAFETY_CHECK_REQUEST = 'safety_check_request',
  SAFETY_CHECK_RESULT = 'safety_check_result',
  GAS_UPDATE = 'gas_update',
  ERROR = 'error',
  STATUS_UPDATE = 'status_update',
  COMMAND = 'command'
}

export interface AgentConfig {
  type: AgentType;
  enabled: boolean;
  priority: number;
  options: Record<string, any>;
}

// ============================================
// EVENT TYPES
// ============================================

export interface PoolCreatedEvent {
  version: 'v3' | 'v4';
  poolAddress: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  // V4 specific
  hooks?: string;
  poolId?: string;
}

export interface SwapEvent {
  version: 'v3' | 'v4';
  poolAddress: string;
  sender: string;
  recipient: string;
  amount0: bigint;
  amount1: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
  txHash: string;
  blockNumber: number;
}

export interface LiquidityEvent {
  version: 'v3' | 'v4';
  poolAddress: string;
  sender: string;
  owner: string;
  tickLower: number;
  tickUpper: number;
  amount: bigint;
  amount0: bigint;
  amount1: bigint;
  txHash: string;
  blockNumber: number;
  eventType: 'mint' | 'burn';
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  wssUrl: string;
  backupRpcUrl?: string;
  blockTime: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface UniswapV3Config {
  factory: string;
  router: string;
  quoter: string;
  positionManager: string;
}

export interface UniswapV4Config {
  poolManager: string;
  positionManager: string;
  quoter: string;
  stateView: string;
}

export interface SniperConfig {
  minLiquidityEth: bigint;
  maxBuyTax: number;
  maxSellTax: number;
  slippageTolerance: number;
  maxPositionSizeEth: bigint;
  autoSellProfitPercent: number;
  stopLossPercent: number;
  maxGasPriceGwei: number;
  gasLimitMultiplier: number;
}

export interface BotConfig {
  network: NetworkConfig;
  uniswapV3: UniswapV3Config;
  uniswapV4: UniswapV4Config;
  sniper: SniperConfig;
  wethAddress: string;
  privateKey: string;
  simulationMode: boolean;
  logLevel: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type Address = `0x${string}`;

export interface Position {
  token: TokenInfo;
  pool: PoolInfo;
  entryPrice: bigint;
  amount: bigint;
  currentPrice: bigint;
  pnl: bigint;
  pnlPercent: number;
  timestamp: number;
}

export interface TradeHistory {
  id: string;
  type: 'buy' | 'sell';
  token: TokenInfo;
  pool: PoolInfo;
  amountIn: bigint;
  amountOut: bigint;
  price: bigint;
  gasUsed: bigint;
  gasCost: bigint;
  txHash: string;
  timestamp: number;
  profit?: bigint;
}
