#!/usr/bin/env node

/**
 * Chainlink Automation Health Checker
 * Monitor upkeep status, balance, and performance
 */

const { ethers } = require("ethers");
const chalk = require("chalk");
const Table = require("cli-table3");
require("dotenv").config();

const { CHAINLINK_ADDRESSES, AUTOMATION_REGISTRY_ABI, ERC20_ABI } = require("./constants");

class AutomationHealthChecker {
  constructor() {
    this.providers = {};
    this.registries = {};
    this.linkTokens = {};
  }

  async initialize() {
    const rpcUrls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      if (url && CHAINLINK_ADDRESSES.AUTOMATION_REGISTRY[chain]) {
        try {
          this.providers[chain] = new ethers.JsonRpcProvider(url);

          this.registries[chain] = new ethers.Contract(
            CHAINLINK_ADDRESSES.AUTOMATION_REGISTRY[chain],
            AUTOMATION_REGISTRY_ABI,
            this.providers[chain]
          );

          if (CHAINLINK_ADDRESSES.LINK_TOKEN[chain]) {
            this.linkTokens[chain] = new ethers.Contract(
              CHAINLINK_ADDRESSES.LINK_TOKEN[chain],
              ERC20_ABI,
              this.providers[chain]
            );
          }
        } catch (e) {
          console.log(chalk.yellow(`Warning: Could not connect to ${chain}: ${e.message}`));
        }
      }
    }
  }

  async getUpkeep(chain, upkeepId) {
    if (!this.registries[chain]) {
      throw new Error(`Chain ${chain} not configured`);
    }

    try {
      const upkeep = await this.registries[chain].getUpkeep(upkeepId);

      return {
        upkeepId,
        chain,
        target: upkeep.target,
        executeGas: upkeep.executeGas.toString(),
        balance: ethers.formatEther(upkeep.balance),
        balanceWei: upkeep.balance.toString(),
        admin: upkeep.admin,
        maxValidBlocknumber: upkeep.maxValidBlocknumber.toString(),
        lastPerformBlockNumber: upkeep.lastPerformBlockNumber.toString(),
        amountSpent: ethers.formatEther(upkeep.amountSpent),
        paused: upkeep.paused
      };
    } catch (error) {
      throw new Error(`Failed to get upkeep: ${error.message}`);
    }
  }

  async getRegistryState(chain) {
    if (!this.registries[chain]) {
      throw new Error(`Chain ${chain} not configured`);
    }

    try {
      const state = await this.registries[chain].getState();

      return {
        chain,
        numUpkeeps: state.state[0]?.toString() || "N/A",
        totalBalance: state.state[8] ? ethers.formatEther(state.state[8]) : "N/A",
        signers: state.signers?.length || 0,
        transmitters: state.transmitters?.length || 0
      };
    } catch (error) {
      // Different registry versions have different return structures
      return {
        chain,
        numUpkeeps: "N/A",
        totalBalance: "N/A",
        signers: "N/A",
        transmitters: "N/A",
        note: "Registry version may not support this query"
      };
    }
  }

  async checkUpkeepHealth(chain, upkeepId) {
    const upkeep = await this.getUpkeep(chain, upkeepId);
    const balance = parseFloat(upkeep.balance);

    const health = {
      ...upkeep,
      status: "healthy",
      warnings: [],
      recommendations: [],
      metrics: {}
    };

    // Check if paused
    if (upkeep.paused) {
      health.status = "paused";
      health.warnings.push("Upkeep is paused");
      health.recommendations.push("Unpause the upkeep if it should be running");
    }

    // Check balance
    if (balance === 0) {
      health.status = "critical";
      health.warnings.push("Upkeep has zero balance");
      health.recommendations.push("Fund upkeep immediately to continue automation");
    } else if (balance < 0.5) {
      health.status = health.status === "healthy" ? "warning" : health.status;
      health.warnings.push("Low LINK balance (< 0.5 LINK)");
      health.recommendations.push("Add more LINK to ensure continued operation");
    } else if (balance < 2) {
      health.warnings.push("Moderate LINK balance");
      health.recommendations.push("Monitor balance and top up as needed");
    }

    // Check max valid block
    const currentBlock = await this.providers[chain].getBlockNumber();
    const maxValidBlock = parseInt(upkeep.maxValidBlocknumber);
    if (maxValidBlock > 0 && maxValidBlock < currentBlock) {
      health.status = "expired";
      health.warnings.push("Upkeep has expired (maxValidBlocknumber reached)");
      health.recommendations.push("Extend upkeep validity or create new upkeep");
    }

    // Calculate metrics
    const amountSpent = parseFloat(upkeep.amountSpent);
    if (amountSpent > 0) {
      health.metrics.totalSpent = amountSpent.toFixed(4) + " LINK";
      health.metrics.remainingFunds = balance.toFixed(4) + " LINK";

      // Rough estimate of runs remaining (assumes average 0.01 LINK per run)
      const avgCostPerRun = 0.01;
      health.metrics.estimatedRunsRemaining = Math.floor(balance / avgCostPerRun);
    }

    // Gas limit check
    const gasLimit = parseInt(upkeep.executeGas);
    if (gasLimit < 50000) {
      health.warnings.push("Gas limit may be too low (<50k)");
      health.recommendations.push("Consider increasing gas limit if executions fail");
    } else if (gasLimit > 2500000) {
      health.warnings.push("High gas limit (>2.5M)");
      health.recommendations.push("Review if gas limit can be optimized");
    }

    return health;
  }

  async monitorMultipleUpkeeps(chain, upkeepIds) {
    const results = [];

    for (const id of upkeepIds) {
      try {
        const health = await this.checkUpkeepHealth(chain, id);
        results.push(health);
      } catch (e) {
        results.push({
          upkeepId: id,
          chain,
          status: "error",
          error: e.message
        });
      }
    }

    return results;
  }

  printUpkeepInfo(upkeep) {
    console.log(chalk.blue.bold(`\n⚡ Automation Upkeep #${upkeep.upkeepId}`));
    console.log(chalk.gray("─".repeat(50)));
    console.log(`Chain:              ${chalk.yellow(upkeep.chain)}`);
    console.log(`Target Contract:    ${chalk.cyan(upkeep.target)}`);
    console.log(`Admin:              ${chalk.cyan(upkeep.admin)}`);
    console.log(`Balance:            ${chalk.green(upkeep.balance + " LINK")}`);
    console.log(`Amount Spent:       ${chalk.white(upkeep.amountSpent + " LINK")}`);
    console.log(`Execute Gas Limit:  ${chalk.white(upkeep.executeGas)}`);
    console.log(`Last Perform Block: ${chalk.white(upkeep.lastPerformBlockNumber)}`);
    console.log(`Paused:             ${upkeep.paused ? chalk.red("Yes") : chalk.green("No")}`);
  }

  printHealthReport(health) {
    this.printUpkeepInfo(health);

    console.log(chalk.gray("\n─".repeat(50)));

    const statusColor =
      health.status === "healthy" ? chalk.green :
      health.status === "warning" ? chalk.yellow :
      health.status === "paused" ? chalk.blue :
      chalk.red;

    console.log(`Status: ${statusColor(health.status.toUpperCase())}`);

    if (health.metrics && Object.keys(health.metrics).length > 0) {
      console.log(chalk.gray("\n📊 Metrics:"));
      for (const [key, value] of Object.entries(health.metrics)) {
        console.log(chalk.gray(`   ${key}: ${value}`));
      }
    }

    if (health.warnings.length > 0) {
      console.log(chalk.yellow("\n⚠️  Warnings:"));
      health.warnings.forEach((w) => console.log(chalk.yellow(`   - ${w}`)));
    }

    if (health.recommendations.length > 0) {
      console.log(chalk.cyan("\n💡 Recommendations:"));
      health.recommendations.forEach((r) => console.log(chalk.cyan(`   - ${r}`)));
    }
  }

  printMultiUpkeepTable(upkeeps) {
    const table = new Table({
      head: [
        chalk.cyan("Upkeep ID"),
        chalk.cyan("Balance"),
        chalk.cyan("Paused"),
        chalk.cyan("Status")
      ],
      colWidths: [25, 15, 10, 15]
    });

    for (const u of upkeeps) {
      if (u.error) {
        table.push([u.upkeepId, chalk.red("Error"), "-", chalk.red("Failed")]);
      } else {
        const statusColor =
          u.status === "healthy" ? chalk.green :
          u.status === "warning" ? chalk.yellow : chalk.red;

        table.push([
          u.upkeepId,
          chalk.green(u.balance + " LINK"),
          u.paused ? chalk.red("Yes") : chalk.green("No"),
          statusColor(u.status)
        ]);
      }
    }

    console.log(table.toString());
  }
}

// CLI Entry Point
async function main() {
  console.log(chalk.blue.bold("\n⚡ Chainlink Automation Health Checker\n"));

  const checker = new AutomationHealthChecker();
  await checker.initialize();

  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "get":
      const getChain = args[1] || "ethereum";
      const getUpkeepId = args[2];
      if (!getUpkeepId) {
        console.log(chalk.red("Error: Upkeep ID required"));
        console.log(chalk.gray("Usage: node automation-health-checker.js get [chain] [upkeepId]"));
        return;
      }
      try {
        const upkeep = await checker.getUpkeep(getChain, getUpkeepId);
        checker.printUpkeepInfo(upkeep);
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "health":
      const healthChain = args[1] || "ethereum";
      const healthUpkeepId = args[2];
      if (!healthUpkeepId) {
        console.log(chalk.red("Error: Upkeep ID required"));
        return;
      }
      try {
        const health = await checker.checkUpkeepHealth(healthChain, healthUpkeepId);
        checker.printHealthReport(health);
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "batch":
      const batchChain = args[1] || "ethereum";
      const batchIds = args.slice(2);
      if (batchIds.length === 0) {
        console.log(chalk.red("Error: At least one upkeep ID required"));
        return;
      }
      try {
        console.log(chalk.yellow(`Checking ${batchIds.length} upkeeps...\n`));
        const results = await checker.monitorMultipleUpkeeps(batchChain, batchIds);
        checker.printMultiUpkeepTable(results);
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    case "registry":
      const regChain = args[1] || "ethereum";
      try {
        const state = await checker.getRegistryState(regChain);
        console.log(chalk.blue.bold(`\nRegistry State (${state.chain})`));
        console.log(chalk.gray("─".repeat(40)));
        console.log(`Total Upkeeps:  ${chalk.white(state.numUpkeeps)}`);
        console.log(`Total Balance:  ${chalk.green(state.totalBalance + " LINK")}`);
        console.log(`Signers:        ${chalk.white(state.signers)}`);
        console.log(`Transmitters:   ${chalk.white(state.transmitters)}`);
        if (state.note) {
          console.log(chalk.gray(`\nNote: ${state.note}`));
        }
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    default:
      console.log(chalk.yellow("Usage:"));
      console.log("  get [chain] [upkeepId]           - Get upkeep details");
      console.log("  health [chain] [upkeepId]        - Full health check");
      console.log("  batch [chain] [id1] [id2] ...    - Check multiple upkeeps");
      console.log("  registry [chain]                 - Get registry state");
  }
}

main().catch(console.error);

module.exports = { AutomationHealthChecker };
