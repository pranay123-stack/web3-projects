/**
 * Uniswap V3 & V4 Sniper Bot
 *
 * A multi-agent sniper bot for Base blockchain that supports
 * both Uniswap v3 and Uniswap v4 protocols.
 *
 * Features:
 * - Mempool monitoring for pending transactions
 * - Pool detection for V3 and V4 factories
 * - Token safety analysis (honeypot detection, tax estimation)
 * - Automated snipe execution
 * - Multi-agent coordination system
 */

import dotenv from 'dotenv';
dotenv.config();

import { initializeProvider, getProviderManager } from './core/provider';
import { getCoordinatorAgent } from './agents';
import { config } from './config';
import { createComponentLogger } from './utils/logger';
import { formatEther } from 'ethers';

const logger = createComponentLogger('Main');

async function main(): Promise<void> {
  logger.info('Starting Uniswap V3 & V4 Sniper Bot');
  logger.info(`Network: ${config.network.name} (Chain ID: ${config.network.chainId})`);

  try {
    // Initialize provider
    logger.info('Initializing blockchain provider...');
    const provider = await initializeProvider();

    // Log wallet info
    const address = provider.getAddress();
    const balance = await provider.getBalance();
    logger.info(`Wallet: ${address}`);
    logger.info(`Balance: ${formatEther(balance)} ETH`);

    // Check if we have enough balance
    if (balance < config.sniper.maxPositionSizeEth) {
      logger.warn('Warning: Wallet balance is less than max position size');
    }

    // Start coordinator agent (which starts all other agents)
    logger.info('Starting multi-agent system...');
    const coordinator = getCoordinatorAgent();
    await coordinator.start();

    logger.info('Bot is now running. Monitoring for new pools...');

    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await coordinator.stop();
      await provider.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await coordinator.stop();
      await provider.destroy();
      process.exit(0);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', { error: error.message, stack: error.stack });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection:', { reason });
    });

  } catch (error: any) {
    logger.error('Failed to start bot:', { error: error.message });
    process.exit(1);
  }
}

// Export for programmatic use
export { initializeProvider, getProviderManager } from './core/provider';
export { getCoordinatorAgent } from './agents';
export { getUniswapV3Service } from './services/uniswapV3';
export { getUniswapV4Service } from './services/uniswapV4';
export { config } from './config';
export * from './types';

// Run if called directly
if (require.main === module) {
  main();
}
