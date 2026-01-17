#!/usr/bin/env node

/**
 * Chainlink Community Tools
 * Interactive CLI for all Chainlink utilities
 */

const inquirer = require("inquirer");
const chalk = require("chalk");
require("dotenv").config();

const { CCIPFeeEstimator } = require("./ccip-fee-estimator");
const { PriceFeedMonitor } = require("./price-feed-monitor");
const { VRFSubscriptionManager } = require("./vrf-subscription-manager");
const { AutomationHealthChecker } = require("./automation-health-checker");

async function main() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════╗
║             🔗 Chainlink Community Tools 🔗               ║
║                                                           ║
║   CCIP • Price Feeds • VRF • Automation                   ║
╚═══════════════════════════════════════════════════════════╝
`));

  const { tool } = await inquirer.prompt([
    {
      type: "list",
      name: "tool",
      message: "Select a tool:",
      choices: [
        { name: "🌉 CCIP Fee Estimator - Estimate cross-chain fees", value: "ccip" },
        { name: "📊 Price Feed Monitor - Monitor oracle prices", value: "price" },
        { name: "🎲 VRF Subscription Manager - Manage VRF subscriptions", value: "vrf" },
        { name: "⚡ Automation Health Checker - Check upkeep status", value: "automation" },
        new inquirer.Separator(),
        { name: "❌ Exit", value: "exit" }
      ]
    }
  ]);

  if (tool === "exit") {
    console.log(chalk.gray("\nGoodbye! 👋\n"));
    process.exit(0);
  }

  const chains = ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc", "base"];

  switch (tool) {
    case "ccip":
      await handleCCIP(chains);
      break;
    case "price":
      await handlePriceFeed(chains);
      break;
    case "vrf":
      await handleVRF(chains);
      break;
    case "automation":
      await handleAutomation(chains);
      break;
  }

  // Ask to continue
  const { again } = await inquirer.prompt([
    {
      type: "confirm",
      name: "again",
      message: "Would you like to use another tool?",
      default: true
    }
  ]);

  if (again) {
    await main();
  } else {
    console.log(chalk.gray("\nGoodbye! 👋\n"));
  }
}

async function handleCCIP(chains) {
  const estimator = new CCIPFeeEstimator();
  await estimator.initialize();

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "CCIP Fee Estimator - Select action:",
      choices: [
        { name: "Estimate single route fee", value: "single" },
        { name: "Get all routes from chain", value: "all" },
        { name: "Check route support", value: "support" }
      ]
    }
  ]);

  const { sourceChain } = await inquirer.prompt([
    {
      type: "list",
      name: "sourceChain",
      message: "Select source chain:",
      choices: chains
    }
  ]);

  if (action === "single" || action === "support") {
    const { destChain } = await inquirer.prompt([
      {
        type: "list",
        name: "destChain",
        message: "Select destination chain:",
        choices: chains.filter((c) => c !== sourceChain)
      }
    ]);

    if (action === "support") {
      const support = await estimator.checkRouteSupport(sourceChain, destChain);
      console.log(
        support.supported
          ? chalk.green(`\n✓ Route ${sourceChain} → ${destChain} is supported`)
          : chalk.red(`\n✗ Route not supported: ${support.reason}`)
      );
    } else {
      try {
        const fee = await estimator.estimateFee(sourceChain, destChain);
        console.log(chalk.green(`\n✓ Fee: ${fee.feeEther} native tokens`));
      } catch (e) {
        console.log(chalk.red(`\nError: ${e.message}`));
      }
    }
  } else {
    console.log(chalk.yellow(`\nFetching all routes from ${sourceChain}...\n`));
    const fees = await estimator.getAllRoutesFees(sourceChain);
    estimator.printFeeTable(fees);
  }
}

async function handlePriceFeed(chains) {
  const monitor = new PriceFeedMonitor();
  await monitor.initialize();

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Price Feed Monitor - Select action:",
      choices: [
        { name: "Get single price", value: "single" },
        { name: "List all prices for chain", value: "list" },
        { name: "Compare price across chains", value: "compare" }
      ]
    }
  ]);

  const availableChains = ["ethereum", "polygon", "arbitrum"];
  const pairs = ["ETH/USD", "BTC/USD", "LINK/USD"];

  if (action === "single") {
    const { chain, pair } = await inquirer.prompt([
      {
        type: "list",
        name: "chain",
        message: "Select chain:",
        choices: availableChains
      },
      {
        type: "list",
        name: "pair",
        message: "Select pair:",
        choices: pairs
      }
    ]);

    try {
      const priceData = await monitor.getPrice(chain, pair);
      console.log(chalk.green(`\n${pair} on ${chain}: $${priceData.price.toLocaleString()}`));
      console.log(chalk.gray(`Updated: ${priceData.updatedAt.toLocaleString()}`));
    } catch (e) {
      console.log(chalk.red(`\nError: ${e.message}`));
    }
  } else if (action === "list") {
    const { chain } = await inquirer.prompt([
      {
        type: "list",
        name: "chain",
        message: "Select chain:",
        choices: availableChains
      }
    ]);

    const prices = await monitor.getAllPrices(chain);
    monitor.printPriceTable(chain, prices);
  } else {
    const { pair } = await inquirer.prompt([
      {
        type: "list",
        name: "pair",
        message: "Select pair to compare:",
        choices: ["ETH/USD", "BTC/USD", "LINK/USD"]
      }
    ]);

    console.log(chalk.yellow(`\nComparing ${pair} across chains...\n`));
    const comparison = await monitor.compareAcrossChains(pair);
    monitor.printComparisonTable(comparison);
  }
}

async function handleVRF(chains) {
  const manager = new VRFSubscriptionManager();
  await manager.initialize();

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "VRF Subscription Manager - Select action:",
      choices: [
        { name: "Get subscription details", value: "get" },
        { name: "Check subscription health", value: "health" },
        { name: "Estimate request cost", value: "estimate" },
        { name: "Check LINK balance", value: "balance" }
      ]
    }
  ]);

  const availableChains = ["ethereum", "polygon", "arbitrum"];

  const { chain } = await inquirer.prompt([
    {
      type: "list",
      name: "chain",
      message: "Select chain:",
      choices: availableChains
    }
  ]);

  if (action === "get" || action === "health") {
    const { subId } = await inquirer.prompt([
      {
        type: "input",
        name: "subId",
        message: "Enter subscription ID:",
        validate: (input) => !isNaN(input) || "Please enter a valid number"
      }
    ]);

    try {
      if (action === "health") {
        const health = await manager.checkSubscriptionHealth(chain, subId);
        manager.printHealthReport(health);
      } else {
        const sub = await manager.getSubscription(chain, subId);
        manager.printSubscriptionInfo(sub);
      }
    } catch (e) {
      console.log(chalk.red(`\nError: ${e.message}`));
    }
  } else if (action === "estimate") {
    const { gasLimit, numWords } = await inquirer.prompt([
      {
        type: "input",
        name: "gasLimit",
        message: "Callback gas limit:",
        default: "100000"
      },
      {
        type: "input",
        name: "numWords",
        message: "Number of random words:",
        default: "1"
      }
    ]);

    const estimate = await manager.estimateRequestCost(
      chain,
      parseInt(gasLimit),
      parseInt(numWords)
    );
    console.log(chalk.green(`\nEstimated cost: ${estimate.estimatedCost}`));
    console.log(chalk.gray(`Note: ${estimate.note}`));
  } else {
    const { address } = await inquirer.prompt([
      {
        type: "input",
        name: "address",
        message: "Enter address:",
        validate: (input) => input.startsWith("0x") || "Please enter a valid address"
      }
    ]);

    try {
      const balance = await manager.getLinkBalance(chain, address);
      console.log(chalk.green(`\nLINK Balance: ${balance.balance} LINK`));
    } catch (e) {
      console.log(chalk.red(`\nError: ${e.message}`));
    }
  }
}

async function handleAutomation(chains) {
  const checker = new AutomationHealthChecker();
  await checker.initialize();

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Automation Health Checker - Select action:",
      choices: [
        { name: "Get upkeep details", value: "get" },
        { name: "Full health check", value: "health" },
        { name: "Get registry state", value: "registry" }
      ]
    }
  ]);

  const availableChains = ["ethereum", "polygon", "arbitrum"];

  const { chain } = await inquirer.prompt([
    {
      type: "list",
      name: "chain",
      message: "Select chain:",
      choices: availableChains
    }
  ]);

  if (action === "get" || action === "health") {
    const { upkeepId } = await inquirer.prompt([
      {
        type: "input",
        name: "upkeepId",
        message: "Enter upkeep ID:",
        validate: (input) => input.length > 0 || "Please enter an upkeep ID"
      }
    ]);

    try {
      if (action === "health") {
        const health = await checker.checkUpkeepHealth(chain, upkeepId);
        checker.printHealthReport(health);
      } else {
        const upkeep = await checker.getUpkeep(chain, upkeepId);
        checker.printUpkeepInfo(upkeep);
      }
    } catch (e) {
      console.log(chalk.red(`\nError: ${e.message}`));
    }
  } else {
    try {
      const state = await checker.getRegistryState(chain);
      console.log(chalk.blue.bold(`\nRegistry State (${state.chain})`));
      console.log(chalk.gray("─".repeat(40)));
      console.log(`Total Upkeeps:  ${chalk.white(state.numUpkeeps)}`);
      console.log(`Total Balance:  ${chalk.green(state.totalBalance + " LINK")}`);
    } catch (e) {
      console.log(chalk.red(`\nError: ${e.message}`));
    }
  }
}

main().catch(console.error);
