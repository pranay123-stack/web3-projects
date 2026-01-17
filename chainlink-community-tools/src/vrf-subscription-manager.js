#!/usr/bin/env node

/**
 * Chainlink VRF Subscription Manager
 * Manage VRF subscriptions, check balances, add consumers
 */

const { ethers } = require("ethers");
const chalk = require("chalk");
const Table = require("cli-table3");
require("dotenv").config();

const { CHAINLINK_ADDRESSES, VRF_COORDINATOR_ABI, ERC20_ABI } = require("./constants");

class VRFSubscriptionManager {
  constructor() {
    this.providers = {};
    this.coordinators = {};
    this.linkTokens = {};
    this.wallets = {};
  }

  async initialize() {
    const rpcUrls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      if (url && CHAINLINK_ADDRESSES.VRF_COORDINATOR[chain]) {
        try {
          this.providers[chain] = new ethers.JsonRpcProvider(url);

          // Setup coordinator (read-only)
          this.coordinators[chain] = new ethers.Contract(
            CHAINLINK_ADDRESSES.VRF_COORDINATOR[chain],
            VRF_COORDINATOR_ABI,
            this.providers[chain]
          );

          // Setup LINK token
          if (CHAINLINK_ADDRESSES.LINK_TOKEN[chain]) {
            this.linkTokens[chain] = new ethers.Contract(
              CHAINLINK_ADDRESSES.LINK_TOKEN[chain],
              ERC20_ABI,
              this.providers[chain]
            );
          }

          // Setup wallet if private key provided
          if (process.env.PRIVATE_KEY) {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.providers[chain]);
            this.wallets[chain] = wallet;

            // Re-create coordinator with signer
            this.coordinators[chain] = new ethers.Contract(
              CHAINLINK_ADDRESSES.VRF_COORDINATOR[chain],
              VRF_COORDINATOR_ABI,
              wallet
            );
          }
        } catch (e) {
          console.log(chalk.yellow(`Warning: Could not connect to ${chain}: ${e.message}`));
        }
      }
    }
  }

  async getSubscription(chain, subId) {
    if (!this.coordinators[chain]) {
      throw new Error(`Chain ${chain} not configured`);
    }

    try {
      const sub = await this.coordinators[chain].getSubscription(subId);

      return {
        subId,
        chain,
        balance: ethers.formatEther(sub.balance),
        balanceWei: sub.balance.toString(),
        requestCount: sub.reqCount.toString(),
        owner: sub.owner,
        consumers: sub.consumers,
        consumerCount: sub.consumers.length
      };
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async getLinkBalance(chain, address) {
    if (!this.linkTokens[chain]) {
      throw new Error(`LINK token not configured for ${chain}`);
    }

    try {
      const balance = await this.linkTokens[chain].balanceOf(address);
      return {
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error) {
      throw new Error(`Failed to get LINK balance: ${error.message}`);
    }
  }

  async checkSubscriptionHealth(chain, subId) {
    const sub = await this.getSubscription(chain, subId);
    const balance = parseFloat(sub.balance);

    const health = {
      ...sub,
      status: "healthy",
      warnings: [],
      recommendations: []
    };

    // Check balance
    if (balance === 0) {
      health.status = "critical";
      health.warnings.push("Subscription has zero balance");
      health.recommendations.push("Fund subscription with LINK tokens");
    } else if (balance < 1) {
      health.status = "warning";
      health.warnings.push("Low LINK balance (< 1 LINK)");
      health.recommendations.push("Consider adding more LINK for reliability");
    } else if (balance < 5) {
      health.warnings.push("Moderate LINK balance");
      health.recommendations.push("Monitor balance and top up as needed");
    }

    // Check consumers
    if (sub.consumerCount === 0) {
      health.warnings.push("No consumers registered");
      health.recommendations.push("Add consumer contracts to use VRF");
    } else if (sub.consumerCount > 50) {
      health.warnings.push("Many consumers registered (>50)");
      health.recommendations.push("Consider creating additional subscriptions");
    }

    return health;
  }

  async estimateRequestCost(chain, callbackGasLimit = 100000, numWords = 1) {
    // Approximate cost estimation
    // Actual cost depends on gas price and LINK/ETH rate
    const baseFee = 0.25; // Base fee in LINK
    const perWordFee = 0.001 * numWords;
    const gasEstimate = callbackGasLimit * 0.000001; // Rough gas cost in LINK

    return {
      chain,
      callbackGasLimit,
      numWords,
      estimatedCost: (baseFee + perWordFee + gasEstimate).toFixed(4) + " LINK",
      note: "Estimate only - actual cost depends on gas price and LINK/ETH rate"
    };
  }

  // Write operations (require PRIVATE_KEY)
  async createSubscription(chain) {
    if (!this.wallets[chain]) {
      throw new Error("Wallet not configured. Set PRIVATE_KEY in .env");
    }

    try {
      console.log(chalk.yellow("Creating subscription..."));
      const tx = await this.coordinators[chain].createSubscription();
      const receipt = await tx.wait();

      // Parse subscription ID from events
      const subId = receipt.logs[0]?.args?.[0] || "Check transaction for subId";

      return {
        success: true,
        txHash: receipt.hash,
        subId: subId.toString()
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async addConsumer(chain, subId, consumerAddress) {
    if (!this.wallets[chain]) {
      throw new Error("Wallet not configured. Set PRIVATE_KEY in .env");
    }

    try {
      console.log(chalk.yellow(`Adding consumer ${consumerAddress}...`));
      const tx = await this.coordinators[chain].addConsumer(subId, consumerAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };
    } catch (error) {
      throw new Error(`Failed to add consumer: ${error.message}`);
    }
  }

  async removeConsumer(chain, subId, consumerAddress) {
    if (!this.wallets[chain]) {
      throw new Error("Wallet not configured. Set PRIVATE_KEY in .env");
    }

    try {
      console.log(chalk.yellow(`Removing consumer ${consumerAddress}...`));
      const tx = await this.coordinators[chain].removeConsumer(subId, consumerAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };
    } catch (error) {
      throw new Error(`Failed to remove consumer: ${error.message}`);
    }
  }

  printSubscriptionInfo(sub) {
    console.log(chalk.blue.bold(`\nVRF Subscription #${sub.subId}`));
    console.log(chalk.gray("─".repeat(40)));
    console.log(`Chain:          ${chalk.yellow(sub.chain)}`);
    console.log(`Owner:          ${chalk.cyan(sub.owner)}`);
    console.log(`Balance:        ${chalk.green(sub.balance + " LINK")}`);
    console.log(`Request Count:  ${chalk.white(sub.requestCount)}`);
    console.log(`Consumers:      ${chalk.white(sub.consumerCount)}`);

    if (sub.consumers && sub.consumers.length > 0) {
      console.log(chalk.gray("\nRegistered Consumers:"));
      sub.consumers.forEach((c, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${c}`));
      });
    }
  }

  printHealthReport(health) {
    this.printSubscriptionInfo(health);

    console.log(chalk.gray("\n─".repeat(40)));
    const statusColor = health.status === "healthy" ? chalk.green :
                       health.status === "warning" ? chalk.yellow : chalk.red;
    console.log(`Status: ${statusColor(health.status.toUpperCase())}`);

    if (health.warnings.length > 0) {
      console.log(chalk.yellow("\n⚠️  Warnings:"));
      health.warnings.forEach((w) => console.log(chalk.yellow(`   - ${w}`)));
    }

    if (health.recommendations.length > 0) {
      console.log(chalk.cyan("\n💡 Recommendations:"));
      health.recommendations.forEach((r) => console.log(chalk.cyan(`   - ${r}`)));
    }
  }
}

// CLI Entry Point
async function main() {
  console.log(chalk.blue.bold("\n🎲 Chainlink VRF Subscription Manager\n"));

  const manager = new VRFSubscriptionManager();
  await manager.initialize();

  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "get":
      const getChain = args[1] || "ethereum";
      const getSubId = args[2];
      if (!getSubId) {
        console.log(chalk.red("Error: Subscription ID required"));
        console.log(chalk.gray("Usage: node vrf-subscription-manager.js get [chain] [subId]"));
        return;
      }
      try {
        const sub = await manager.getSubscription(getChain, getSubId);
        manager.printSubscriptionInfo(sub);
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "health":
      const healthChain = args[1] || "ethereum";
      const healthSubId = args[2];
      if (!healthSubId) {
        console.log(chalk.red("Error: Subscription ID required"));
        return;
      }
      try {
        const health = await manager.checkSubscriptionHealth(healthChain, healthSubId);
        manager.printHealthReport(health);
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "estimate":
      const estChain = args[1] || "ethereum";
      const gasLimit = parseInt(args[2]) || 100000;
      const numWords = parseInt(args[3]) || 1;
      const estimate = await manager.estimateRequestCost(estChain, gasLimit, numWords);
      console.log(chalk.green(`Estimated cost: ${estimate.estimatedCost}`));
      console.log(chalk.gray(`Callback gas limit: ${estimate.callbackGasLimit}`));
      console.log(chalk.gray(`Number of words: ${estimate.numWords}`));
      console.log(chalk.gray(`Note: ${estimate.note}`));
      break;

    case "create":
      const createChain = args[1] || "ethereum";
      try {
        const result = await manager.createSubscription(createChain);
        console.log(chalk.green(`✓ Subscription created!`));
        console.log(chalk.gray(`TX: ${result.txHash}`));
        console.log(chalk.cyan(`Sub ID: ${result.subId}`));
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "add-consumer":
      const addChain = args[1];
      const addSubId = args[2];
      const addConsumer = args[3];
      if (!addChain || !addSubId || !addConsumer) {
        console.log(chalk.red("Error: chain, subId, and consumer address required"));
        return;
      }
      try {
        const result = await manager.addConsumer(addChain, addSubId, addConsumer);
        console.log(chalk.green(`✓ Consumer added!`));
        console.log(chalk.gray(`TX: ${result.txHash}`));
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "link-balance":
      const balChain = args[1] || "ethereum";
      const balAddr = args[2];
      if (!balAddr) {
        console.log(chalk.red("Error: Address required"));
        return;
      }
      try {
        const balance = await manager.getLinkBalance(balChain, balAddr);
        console.log(chalk.green(`LINK Balance: ${balance.balance} LINK`));
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    default:
      console.log(chalk.yellow("Usage:"));
      console.log("  get [chain] [subId]                    - Get subscription details");
      console.log("  health [chain] [subId]                 - Check subscription health");
      console.log("  estimate [chain] [gasLimit] [numWords] - Estimate request cost");
      console.log("  create [chain]                         - Create new subscription");
      console.log("  add-consumer [chain] [subId] [address] - Add consumer contract");
      console.log("  link-balance [chain] [address]         - Check LINK balance");
  }
}

main().catch(console.error);

module.exports = { VRFSubscriptionManager };
