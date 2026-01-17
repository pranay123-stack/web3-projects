#!/usr/bin/env node

/**
 * CCIP Fee Estimator
 * Estimates cross-chain message fees for Chainlink CCIP
 */

const { ethers } = require("ethers");
const chalk = require("chalk");
const Table = require("cli-table3");
require("dotenv").config();

const { CHAINLINK_ADDRESSES, CCIP_ROUTER_ABI, ERC20_ABI } = require("./constants");

class CCIPFeeEstimator {
  constructor() {
    this.providers = {};
    this.routers = {};
  }

  async initialize() {
    const rpcUrls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL,
      optimism: process.env.OPTIMISM_RPC_URL,
      avalanche: process.env.AVALANCHE_RPC_URL,
      bsc: process.env.BSC_RPC_URL,
      base: process.env.BASE_RPC_URL
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      if (url && CHAINLINK_ADDRESSES.CCIP_ROUTER[chain]) {
        try {
          this.providers[chain] = new ethers.JsonRpcProvider(url);
          this.routers[chain] = new ethers.Contract(
            CHAINLINK_ADDRESSES.CCIP_ROUTER[chain],
            CCIP_ROUTER_ABI,
            this.providers[chain]
          );
        } catch (e) {
          console.log(chalk.yellow(`Warning: Could not connect to ${chain}`));
        }
      }
    }
  }

  async estimateFee(sourceChain, destChain, data = "0x", tokenAmounts = []) {
    if (!this.routers[sourceChain]) {
      throw new Error(`Source chain ${sourceChain} not configured`);
    }

    const destSelector = CHAINLINK_ADDRESSES.CHAIN_SELECTORS[destChain];
    if (!destSelector) {
      throw new Error(`Destination chain ${destChain} not supported`);
    }

    // Build CCIP message
    const message = {
      receiver: ethers.zeroPadValue("0x0000000000000000000000000000000000000001", 32),
      data: data,
      tokenAmounts: tokenAmounts,
      feeToken: ethers.ZeroAddress, // Native token for fee
      extraArgs: "0x"
    };

    try {
      const fee = await this.routers[sourceChain].getFee(destSelector, [
        message.receiver,
        message.data,
        message.feeToken,
        message.tokenAmounts,
        message.extraArgs
      ]);

      return {
        sourceChain,
        destChain,
        feeWei: fee.toString(),
        feeEther: ethers.formatEther(fee)
      };
    } catch (error) {
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  async getAllRoutesFees(sourceChain) {
    const results = [];
    const destChains = Object.keys(CHAINLINK_ADDRESSES.CHAIN_SELECTORS).filter(
      (c) => c !== sourceChain
    );

    for (const destChain of destChains) {
      try {
        const estimate = await this.estimateFee(sourceChain, destChain);
        results.push(estimate);
      } catch (e) {
        results.push({
          sourceChain,
          destChain,
          feeWei: "N/A",
          feeEther: "Route not available",
          error: e.message
        });
      }
    }

    return results;
  }

  async checkRouteSupport(sourceChain, destChain) {
    if (!this.routers[sourceChain]) {
      return { supported: false, reason: "Source chain not configured" };
    }

    const destSelector = CHAINLINK_ADDRESSES.CHAIN_SELECTORS[destChain];
    if (!destSelector) {
      return { supported: false, reason: "Destination chain not in registry" };
    }

    try {
      const isSupported = await this.routers[sourceChain].isChainSupported(destSelector);
      return { supported: isSupported, reason: isSupported ? "Route active" : "Route not enabled" };
    } catch (e) {
      return { supported: false, reason: e.message };
    }
  }

  async getSupportedTokens(sourceChain, destChain) {
    if (!this.routers[sourceChain]) {
      throw new Error(`Source chain ${sourceChain} not configured`);
    }

    const destSelector = CHAINLINK_ADDRESSES.CHAIN_SELECTORS[destChain];
    try {
      const tokens = await this.routers[sourceChain].getSupportedTokens(destSelector);
      return tokens;
    } catch (e) {
      return [];
    }
  }

  printFeeTable(fees) {
    const table = new Table({
      head: [
        chalk.cyan("Source"),
        chalk.cyan("Destination"),
        chalk.cyan("Fee (Native)"),
        chalk.cyan("Status")
      ],
      colWidths: [15, 15, 20, 20]
    });

    for (const fee of fees) {
      table.push([
        fee.sourceChain,
        fee.destChain,
        fee.error ? chalk.red("N/A") : chalk.green(fee.feeEther),
        fee.error ? chalk.red("Unavailable") : chalk.green("Available")
      ]);
    }

    console.log(table.toString());
  }
}

// CLI Entry Point
async function main() {
  console.log(chalk.blue.bold("\n🔗 Chainlink CCIP Fee Estimator\n"));

  const estimator = new CCIPFeeEstimator();
  await estimator.initialize();

  const args = process.argv.slice(2);
  const sourceChain = args[0] || "ethereum";
  const destChain = args[1];

  if (destChain) {
    // Single route estimation
    console.log(chalk.yellow(`Estimating fee: ${sourceChain} → ${destChain}\n`));

    try {
      const support = await estimator.checkRouteSupport(sourceChain, destChain);
      if (!support.supported) {
        console.log(chalk.red(`Route not supported: ${support.reason}`));
        return;
      }

      const fee = await estimator.estimateFee(sourceChain, destChain);
      console.log(chalk.green(`✓ Fee: ${fee.feeEther} native tokens`));
      console.log(chalk.gray(`  Wei: ${fee.feeWei}`));

      // Get supported tokens
      const tokens = await estimator.getSupportedTokens(sourceChain, destChain);
      if (tokens.length > 0) {
        console.log(chalk.cyan(`\nSupported tokens (${tokens.length}):`));
        tokens.slice(0, 5).forEach((t) => console.log(chalk.gray(`  - ${t}`)));
        if (tokens.length > 5) console.log(chalk.gray(`  ... and ${tokens.length - 5} more`));
      }
    } catch (e) {
      console.log(chalk.red(`Error: ${e.message}`));
    }
  } else {
    // All routes from source
    console.log(chalk.yellow(`Fetching all routes from ${sourceChain}...\n`));

    const fees = await estimator.getAllRoutesFees(sourceChain);
    estimator.printFeeTable(fees);
  }
}

main().catch(console.error);

module.exports = { CCIPFeeEstimator };
