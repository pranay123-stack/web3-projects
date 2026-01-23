import dotenv from 'dotenv';
import { BotConfig, NetworkConfig, UniswapV3Config, UniswapV4Config, SniperConfig } from '../types';
import { parseEther } from 'ethers';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseFloat(value) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Base Mainnet Configuration
export const networkConfig: NetworkConfig = {
  chainId: getEnvNumber('CHAIN_ID', 8453),
  name: getEnvVar('NETWORK_NAME', 'base'),
  rpcUrl: getEnvVar('RPC_URL', 'https://mainnet.base.org'),
  wssUrl: getEnvVar('WSS_URL', 'wss://base-mainnet.g.alchemy.com/v2/demo'),
  backupRpcUrl: process.env.BACKUP_RPC_URL,
  blockTime: 2000, // Base block time ~2s
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
};

// Uniswap v3 Addresses on Base
export const uniswapV3Config: UniswapV3Config = {
  factory: getEnvVar('UNISWAP_V3_FACTORY', '0x33128a8fC17869897dcE68Ed026d694621f6FDfD'),
  router: getEnvVar('UNISWAP_V3_ROUTER', '0x2626664c2603336E57B271c5C0b26F421741e481'),
  quoter: getEnvVar('UNISWAP_V3_QUOTER', '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'),
  positionManager: getEnvVar('UNISWAP_V3_POSITION_MANAGER', '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1')
};

// Uniswap v4 Addresses on Base
export const uniswapV4Config: UniswapV4Config = {
  poolManager: getEnvVar('UNISWAP_V4_POOL_MANAGER', '0x498581fF718922c3f8e6A244956aF099B2652b2b'),
  positionManager: getEnvVar('UNISWAP_V4_POSITION_MANAGER', '0x7C5f5A4bBd8fD63184577525326123B519429bDc'),
  quoter: getEnvVar('UNISWAP_V4_QUOTER', '0x0d5e0F971ED27FBfF6c2837bf31316121532048D'),
  stateView: getEnvVar('UNISWAP_V4_STATE_VIEW', '0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71')
};

// Sniper Configuration
export const sniperConfig: SniperConfig = {
  minLiquidityEth: parseEther(getEnvVar('MIN_LIQUIDITY_ETH', '1')),
  maxBuyTax: getEnvNumber('MAX_BUY_TAX', 10),
  maxSellTax: getEnvNumber('MAX_SELL_TAX', 10),
  slippageTolerance: getEnvNumber('SLIPPAGE_TOLERANCE', 5),
  maxPositionSizeEth: parseEther(getEnvVar('MAX_POSITION_SIZE_ETH', '0.5')),
  autoSellProfitPercent: getEnvNumber('AUTO_SELL_PROFIT_PERCENT', 100),
  stopLossPercent: getEnvNumber('STOP_LOSS_PERCENT', 50),
  maxGasPriceGwei: getEnvNumber('MAX_GAS_PRICE_GWEI', 50),
  gasLimitMultiplier: getEnvNumber('GAS_LIMIT_MULTIPLIER', 1.2)
};

// Full Bot Configuration
export const config: BotConfig = {
  network: networkConfig,
  uniswapV3: uniswapV3Config,
  uniswapV4: uniswapV4Config,
  sniper: sniperConfig,
  wethAddress: getEnvVar('WETH_ADDRESS', '0x4200000000000000000000000000000000000006'),
  privateKey: getEnvVar('PRIVATE_KEY', ''),
  simulationMode: getEnvBoolean('SIMULATION_MODE', false),
  logLevel: getEnvVar('LOG_LEVEL', 'info')
};

// Agent Configuration
export const agentConfig = {
  enableMempoolAgent: getEnvBoolean('ENABLE_MEMPOOL_AGENT', true),
  enablePoolDetectorAgent: getEnvBoolean('ENABLE_POOL_DETECTOR_AGENT', true),
  enableSniperAgent: getEnvBoolean('ENABLE_SNIPER_AGENT', true),
  enableSafetyAgent: getEnvBoolean('ENABLE_SAFETY_AGENT', true)
};

// Mempool Configuration
export const mempoolConfig = {
  scanIntervalMs: getEnvNumber('MEMPOOL_SCAN_INTERVAL_MS', 100),
  pendingTxTimeoutMs: getEnvNumber('PENDING_TX_TIMEOUT_MS', 30000),
  maxPendingTxs: getEnvNumber('MAX_PENDING_TXS', 100)
};

// Fee tiers for Uniswap v3
export const V3_FEE_TIERS = [100, 500, 3000, 10000];

// Tick spacings for Uniswap v4
export const V4_TICK_SPACINGS = [1, 10, 60, 200];

export default config;
