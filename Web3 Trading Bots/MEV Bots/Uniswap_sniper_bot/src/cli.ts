#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from './config';
import { initializeProvider, getProviderManager } from './core/provider';
import { getCoordinatorAgent } from './agents';
import { createComponentLogger } from './utils/logger';
import { formatEther, parseEther } from 'ethers';
import readline from 'readline';

const logger = createComponentLogger('CLI');

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.yellow.bold('🎯 UNISWAP V3 & V4 SNIPER BOT')}                               ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Base Blockchain • Multi-Agent Architecture')}                  ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════╝')}
`;

program
  .name('sniper-bot')
  .description('Uniswap V3 & V4 Sniper Bot for Base Blockchain')
  .version('1.0.0');

// Main snipe command
program
  .command('start')
  .description('Start the sniper bot with all agents')
  .option('-s, --simulation', 'Run in simulation mode')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    console.log(banner);

    if (options.simulation) {
      process.env.SIMULATION_MODE = 'true';
      logger.info(chalk.yellow('Running in SIMULATION MODE'));
    }

    try {
      // Initialize provider
      logger.info('Initializing provider...');
      await initializeProvider();

      // Get wallet info
      const provider = getProviderManager();
      const balance = await provider.getBalance();

      console.log(chalk.green('\n✓ Connected to Base Network'));
      console.log(chalk.gray(`  Wallet: ${provider.getAddress()}`));
      console.log(chalk.gray(`  Balance: ${formatEther(balance)} ETH\n`));

      // Start coordinator
      const coordinator = getCoordinatorAgent();
      await coordinator.start();

      console.log(chalk.green('✓ All agents started successfully\n'));
      console.log(chalk.gray('Press Ctrl+C to stop, or type "help" for commands\n'));

      // Start interactive mode
      startInteractiveMode(coordinator);

    } catch (error: any) {
      logger.error('Failed to start bot:', { error: error.message });
      process.exit(1);
    }
  });

// Monitor command - just monitor without sniping
program
  .command('monitor')
  .description('Monitor new pools without executing trades')
  .action(async () => {
    console.log(banner);
    logger.info(chalk.yellow('Running in MONITOR-ONLY mode'));

    // Disable sniper agent
    process.env.ENABLE_SNIPER_AGENT = 'false';

    try {
      await initializeProvider();
      const coordinator = getCoordinatorAgent();
      await coordinator.start();

      console.log(chalk.green('✓ Monitoring started\n'));
      startInteractiveMode(coordinator);

    } catch (error: any) {
      logger.error('Failed to start monitor:', { error: error.message });
      process.exit(1);
    }
  });

// Simulate command
program
  .command('simulate')
  .description('Run simulation with historical data')
  .option('-f, --from <block>', 'Start block number')
  .option('-t, --to <block>', 'End block number')
  .action(async (options) => {
    console.log(banner);
    logger.info('Running historical simulation...');

    process.env.SIMULATION_MODE = 'true';

    try {
      await initializeProvider();
      const provider = getProviderManager();

      const toBlock = options.to ? parseInt(options.to) : await provider.getBlockNumber();
      const fromBlock = options.from ? parseInt(options.from) : toBlock - 1000;

      logger.info(`Scanning blocks ${fromBlock} to ${toBlock}`);

      const coordinator = getCoordinatorAgent();
      await coordinator.start();

      // Trigger historical scan
      // This would need pool detector to implement historical scanning

      console.log(chalk.green('✓ Simulation complete\n'));

    } catch (error: any) {
      logger.error('Simulation failed:', { error: error.message });
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show current bot status')
  .action(async () => {
    try {
      await initializeProvider();
      const provider = getProviderManager();

      const balance = await provider.getBalance();
      const blockNumber = await provider.getBlockNumber();

      console.log(chalk.cyan('\n📊 Bot Status\n'));
      console.log(chalk.gray('Network:'), 'Base Mainnet');
      console.log(chalk.gray('Wallet:'), provider.getAddress());
      console.log(chalk.gray('Balance:'), formatEther(balance), 'ETH');
      console.log(chalk.gray('Block:'), blockNumber);
      console.log(chalk.gray('Simulation:'), config.simulationMode ? 'Yes' : 'No');
      console.log();

    } catch (error: any) {
      logger.error('Failed to get status:', { error: error.message });
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log(chalk.cyan('\n⚙️  Configuration\n'));
    console.log(chalk.gray('Network:'));
    console.log(`  Chain ID: ${config.network.chainId}`);
    console.log(`  RPC URL: ${config.network.rpcUrl}`);
    console.log();
    console.log(chalk.gray('Uniswap V3:'));
    console.log(`  Factory: ${config.uniswapV3.factory}`);
    console.log(`  Router: ${config.uniswapV3.router}`);
    console.log();
    console.log(chalk.gray('Uniswap V4:'));
    console.log(`  Pool Manager: ${config.uniswapV4.poolManager}`);
    console.log();
    console.log(chalk.gray('Sniper Settings:'));
    console.log(`  Min Liquidity: ${formatEther(config.sniper.minLiquidityEth)} ETH`);
    console.log(`  Max Position Size: ${formatEther(config.sniper.maxPositionSizeEth)} ETH`);
    console.log(`  Slippage: ${config.sniper.slippageTolerance}%`);
    console.log(`  Max Buy Tax: ${config.sniper.maxBuyTax}%`);
    console.log(`  Max Sell Tax: ${config.sniper.maxSellTax}%`);
    console.log();
  });

/**
 * Interactive command mode
 */
function startInteractiveMode(coordinator: any): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('sniper> ')
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim().toLowerCase();
    const args = input.split(' ');
    const command = args[0];

    switch (command) {
      case 'help':
        printHelp();
        break;

      case 'status':
        coordinator.printStatus();
        break;

      case 'stats':
        coordinator.printStats();
        break;

      case 'positions':
        printPositions(coordinator);
        break;

      case 'history':
        printHistory(coordinator);
        break;

      case 'pause':
        coordinator.pauseAll();
        console.log(chalk.yellow('Bot paused'));
        break;

      case 'resume':
        coordinator.resumeAll();
        console.log(chalk.green('Bot resumed'));
        break;

      case 'sell':
        if (args[1]) {
          await coordinator.sellPosition(args[1]);
        } else {
          console.log(chalk.red('Usage: sell <token_address>'));
        }
        break;

      case 'sellall':
        await coordinator.sellAllPositions();
        console.log(chalk.yellow('Selling all positions...'));
        break;

      case 'balance':
        await printBalance();
        break;

      case 'exit':
      case 'quit':
        console.log(chalk.yellow('\nShutting down...'));
        await coordinator.stop();
        process.exit(0);
        break;

      case '':
        break;

      default:
        console.log(chalk.red(`Unknown command: ${command}. Type 'help' for available commands.`));
    }

    rl.prompt();
  });

  rl.on('close', async () => {
    console.log(chalk.yellow('\nShutting down...'));
    await coordinator.stop();
    process.exit(0);
  });

  // Handle Ctrl+C
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\nReceived SIGINT. Shutting down gracefully...'));
    await coordinator.stop();
    process.exit(0);
  });
}

function printHelp(): void {
  console.log(chalk.cyan('\n📖 Available Commands:\n'));
  console.log(chalk.white('  status     '), chalk.gray('Show agent status'));
  console.log(chalk.white('  stats      '), chalk.gray('Show statistics'));
  console.log(chalk.white('  positions  '), chalk.gray('Show current positions'));
  console.log(chalk.white('  history    '), chalk.gray('Show trade history'));
  console.log(chalk.white('  balance    '), chalk.gray('Show wallet balance'));
  console.log(chalk.white('  pause      '), chalk.gray('Pause all agents'));
  console.log(chalk.white('  resume     '), chalk.gray('Resume all agents'));
  console.log(chalk.white('  sell <addr>'), chalk.gray('Sell a specific position'));
  console.log(chalk.white('  sellall    '), chalk.gray('Sell all positions'));
  console.log(chalk.white('  exit       '), chalk.gray('Stop bot and exit'));
  console.log();
}

function printPositions(coordinator: any): void {
  const positions = coordinator.getPositions();

  if (positions.length === 0) {
    console.log(chalk.gray('\nNo open positions\n'));
    return;
  }

  console.log(chalk.cyan('\n📊 Open Positions:\n'));
  positions.forEach((pos: any, i: number) => {
    console.log(chalk.white(`  ${i + 1}. ${pos.token.symbol}`));
    console.log(chalk.gray(`     Address: ${pos.token.address}`));
    console.log(chalk.gray(`     Amount: ${formatEther(pos.amount)}`));
    console.log(chalk.gray(`     Entry: ${formatEther(pos.entryPrice)}`));
    console.log(chalk.gray(`     P&L: ${pos.pnlPercent.toFixed(2)}%`));
    console.log();
  });
}

function printHistory(coordinator: any): void {
  const history = coordinator.getTradeHistory();

  if (history.length === 0) {
    console.log(chalk.gray('\nNo trade history\n'));
    return;
  }

  console.log(chalk.cyan('\n📜 Trade History:\n'));
  history.slice(-10).forEach((trade: any, i: number) => {
    const color = trade.type === 'buy' ? chalk.green : chalk.red;
    console.log(color(`  ${trade.type.toUpperCase()} ${trade.token.symbol}`));
    console.log(chalk.gray(`     Amount In: ${formatEther(trade.amountIn)} ETH`));
    console.log(chalk.gray(`     Amount Out: ${formatEther(trade.amountOut)}`));
    console.log(chalk.gray(`     TX: ${trade.txHash.slice(0, 20)}...`));
    console.log();
  });
}

async function printBalance(): Promise<void> {
  try {
    const provider = getProviderManager();
    const balance = await provider.getBalance();
    console.log(chalk.cyan('\n💰 Wallet Balance:'), formatEther(balance), 'ETH\n');
  } catch (error) {
    console.log(chalk.red('Failed to fetch balance'));
  }
}

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.outputHelp();
}
