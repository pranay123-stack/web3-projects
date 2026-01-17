#!/usr/bin/env node

/**
 * Chainlink Price Feed Monitor
 * Real-time monitoring of Chainlink price feeds with alerts
 */

const { ethers } = require("ethers");
const chalk = require("chalk");
const Table = require("cli-table3");
require("dotenv").config();

const { CHAINLINK_ADDRESSES, PRICE_FEED_ABI } = require("./constants");

class PriceFeedMonitor {
  constructor() {
    this.providers = {};
    this.feeds = {};
    this.alerts = [];
    this.priceHistory = {};
  }

  async initialize() {
    const rpcUrls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      if (url) {
        try {
          this.providers[chain] = new ethers.JsonRpcProvider(url);
          this.feeds[chain] = {};

          // Initialize price feeds for this chain
          const chainFeeds = CHAINLINK_ADDRESSES.PRICE_FEEDS[chain];
          if (chainFeeds) {
            for (const [pair, address] of Object.entries(chainFeeds)) {
              this.feeds[chain][pair] = new ethers.Contract(
                address,
                PRICE_FEED_ABI,
                this.providers[chain]
              );
            }
          }
        } catch (e) {
          console.log(chalk.yellow(`Warning: Could not connect to ${chain}`));
        }
      }
    }
  }

  async getPrice(chain, pair) {
    if (!this.feeds[chain] || !this.feeds[chain][pair]) {
      throw new Error(`Feed ${pair} not available on ${chain}`);
    }

    const feed = this.feeds[chain][pair];

    try {
      const [roundData, decimals, description] = await Promise.all([
        feed.latestRoundData(),
        feed.decimals(),
        feed.description()
      ]);

      const price = Number(roundData.answer) / Math.pow(10, Number(decimals));
      const updatedAt = new Date(Number(roundData.updatedAt) * 1000);
      const staleness = (Date.now() - updatedAt.getTime()) / 1000; // seconds

      return {
        pair,
        chain,
        price,
        decimals: Number(decimals),
        roundId: roundData.roundId.toString(),
        updatedAt,
        staleness,
        description,
        isStale: staleness > 3600 // > 1 hour considered stale
      };
    } catch (error) {
      throw new Error(`Failed to get price: ${error.message}`);
    }
  }

  async getAllPrices(chain) {
    const results = [];
    const chainFeeds = this.feeds[chain];

    if (!chainFeeds) {
      return results;
    }

    for (const pair of Object.keys(chainFeeds)) {
      try {
        const priceData = await this.getPrice(chain, pair);
        results.push(priceData);
      } catch (e) {
        results.push({
          pair,
          chain,
          price: null,
          error: e.message
        });
      }
    }

    return results;
  }

  async compareAcrossChains(pair) {
    const results = [];

    for (const chain of Object.keys(this.feeds)) {
      if (this.feeds[chain][pair]) {
        try {
          const priceData = await this.getPrice(chain, pair);
          results.push(priceData);
        } catch (e) {
          results.push({
            pair,
            chain,
            price: null,
            error: e.message
          });
        }
      }
    }

    // Calculate deviation if multiple chains
    if (results.filter((r) => r.price !== null).length > 1) {
      const prices = results.filter((r) => r.price !== null).map((r) => r.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const maxDeviation = Math.max(...prices.map((p) => Math.abs(p - avgPrice) / avgPrice * 100));

      return {
        results,
        avgPrice,
        maxDeviation: maxDeviation.toFixed(4) + "%"
      };
    }

    return { results, avgPrice: null, maxDeviation: null };
  }

  setAlert(chain, pair, condition, threshold, callback) {
    this.alerts.push({
      chain,
      pair,
      condition, // 'above', 'below', 'change_percent'
      threshold,
      callback,
      triggered: false
    });
  }

  async checkAlerts() {
    for (const alert of this.alerts) {
      try {
        const priceData = await this.getPrice(alert.chain, alert.pair);
        const currentPrice = priceData.price;

        let shouldTrigger = false;

        if (alert.condition === "above" && currentPrice > alert.threshold) {
          shouldTrigger = true;
        } else if (alert.condition === "below" && currentPrice < alert.threshold) {
          shouldTrigger = true;
        } else if (alert.condition === "change_percent") {
          const key = `${alert.chain}-${alert.pair}`;
          const lastPrice = this.priceHistory[key];
          if (lastPrice) {
            const changePercent = Math.abs((currentPrice - lastPrice) / lastPrice * 100);
            if (changePercent >= alert.threshold) {
              shouldTrigger = true;
            }
          }
          this.priceHistory[key] = currentPrice;
        }

        if (shouldTrigger && !alert.triggered) {
          alert.triggered = true;
          alert.callback(priceData);
        } else if (!shouldTrigger) {
          alert.triggered = false;
        }
      } catch (e) {
        // Skip failed checks
      }
    }
  }

  async startMonitoring(intervalMs = 30000) {
    console.log(chalk.blue(`Starting price monitoring (interval: ${intervalMs / 1000}s)...\n`));

    const monitor = async () => {
      console.clear();
      console.log(chalk.blue.bold("\n📊 Chainlink Price Feed Monitor\n"));
      console.log(chalk.gray(`Last updated: ${new Date().toLocaleString()}\n`));

      for (const chain of Object.keys(this.feeds)) {
        const prices = await this.getAllPrices(chain);
        if (prices.length > 0) {
          this.printPriceTable(chain, prices);
        }
      }

      await this.checkAlerts();
    };

    await monitor();
    setInterval(monitor, intervalMs);
  }

  printPriceTable(chain, prices) {
    const table = new Table({
      head: [
        chalk.cyan("Pair"),
        chalk.cyan("Price"),
        chalk.cyan("Updated"),
        chalk.cyan("Staleness"),
        chalk.cyan("Status")
      ],
      colWidths: [12, 18, 22, 12, 12]
    });

    for (const p of prices) {
      if (p.error) {
        table.push([p.pair, chalk.red("Error"), "-", "-", chalk.red("Failed")]);
      } else {
        const stalenessStr = p.staleness < 60
          ? `${Math.round(p.staleness)}s`
          : `${Math.round(p.staleness / 60)}m`;

        table.push([
          p.pair,
          chalk.green(`$${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`),
          p.updatedAt.toLocaleString(),
          stalenessStr,
          p.isStale ? chalk.red("Stale") : chalk.green("Fresh")
        ]);
      }
    }

    console.log(chalk.yellow.bold(`\n${chain.toUpperCase()}`));
    console.log(table.toString());
  }

  printComparisonTable(comparison) {
    const table = new Table({
      head: [
        chalk.cyan("Chain"),
        chalk.cyan("Price"),
        chalk.cyan("Deviation from Avg")
      ],
      colWidths: [15, 18, 20]
    });

    for (const r of comparison.results) {
      if (r.error) {
        table.push([r.chain, chalk.red("Error"), "-"]);
      } else {
        const deviation = comparison.avgPrice
          ? ((r.price - comparison.avgPrice) / comparison.avgPrice * 100).toFixed(4) + "%"
          : "N/A";
        table.push([
          r.chain,
          chalk.green(`$${r.price.toLocaleString()}`),
          deviation
        ]);
      }
    }

    console.log(table.toString());
    if (comparison.avgPrice) {
      console.log(chalk.gray(`Average: $${comparison.avgPrice.toLocaleString()}`));
      console.log(chalk.gray(`Max Deviation: ${comparison.maxDeviation}`));
    }
  }
}

// CLI Entry Point
async function main() {
  console.log(chalk.blue.bold("\n📊 Chainlink Price Feed Monitor\n"));

  const monitor = new PriceFeedMonitor();
  await monitor.initialize();

  const args = process.argv.slice(2);
  const command = args[0] || "list";

  switch (command) {
    case "list":
      const chain = args[1] || "ethereum";
      console.log(chalk.yellow(`Fetching prices for ${chain}...\n`));
      const prices = await monitor.getAllPrices(chain);
      monitor.printPriceTable(chain, prices);
      break;

    case "compare":
      const pair = args[1] || "ETH/USD";
      console.log(chalk.yellow(`Comparing ${pair} across chains...\n`));
      const comparison = await monitor.compareAcrossChains(pair);
      monitor.printComparisonTable(comparison);
      break;

    case "watch":
      const interval = parseInt(args[1]) || 30;
      await monitor.startMonitoring(interval * 1000);
      break;

    case "get":
      const c = args[1] || "ethereum";
      const p = args[2] || "ETH/USD";
      try {
        const priceData = await monitor.getPrice(c, p);
        console.log(chalk.green(`${p} on ${c}: $${priceData.price.toLocaleString()}`));
        console.log(chalk.gray(`Updated: ${priceData.updatedAt.toLocaleString()}`));
        console.log(chalk.gray(`Round ID: ${priceData.roundId}`));
      } catch (e) {
        console.log(chalk.red(`Error: ${e.message}`));
      }
      break;

    default:
      console.log(chalk.yellow("Usage:"));
      console.log("  node price-feed-monitor.js list [chain]     - List all prices for a chain");
      console.log("  node price-feed-monitor.js compare [pair]   - Compare pair across chains");
      console.log("  node price-feed-monitor.js watch [interval] - Live monitoring");
      console.log("  node price-feed-monitor.js get [chain] [pair] - Get single price");
  }
}

main().catch(console.error);

module.exports = { PriceFeedMonitor };
