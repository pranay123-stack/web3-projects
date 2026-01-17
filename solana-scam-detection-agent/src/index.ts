import dotenv from 'dotenv';
import path from 'path';
import { SolanaMonitor } from './services/solanaMonitor';
import { ScamDetector } from './detectors/scamDetector';
import { AlertService } from './alerts/alertService';
import { DatabaseService } from './db/database';
import { ScamClassifier } from './ml/classifier';
import { createApiServer } from './api/server';
import { AgentConfig, AgentStats, NewTokenEvent } from './types';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

class ScamDetectionAgent {
  private config: AgentConfig;
  private solanaMonitor: SolanaMonitor;
  private scamDetector: ScamDetector;
  private alertService: AlertService;
  private db: DatabaseService;
  private classifier: ScamClassifier;
  private stats: AgentStats;
  private isRunning: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.stats = {
      startedAt: new Date().toISOString(),
      tokensAnalyzed: 0,
      scamsDetected: 0,
      alertsSent: 0,
      uptime: 0,
      lastCheck: null,
    };

    // Initialize services
    logger.info('Initializing Scam Detection Agent...');

    this.db = new DatabaseService(this.config.databasePath);

    this.solanaMonitor = new SolanaMonitor(
      this.config.solanaRpcUrl,
      this.config.solanaWsUrl
    );

    this.scamDetector = new ScamDetector(this.solanaMonitor);

    this.alertService = new AlertService(
      this.db,
      this.config.telegramBotToken,
      this.config.telegramChatId,
      this.config.discordWebhookUrl
    );

    this.classifier = new ScamClassifier();

    logger.info('Agent initialized successfully');
  }

  private loadConfig(): AgentConfig {
    return {
      solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      solanaWsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
      heliusApiKey: process.env.HELIUS_API_KEY,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
      databasePath: process.env.DATABASE_PATH || './data/scam_detection.db',
      minScamConfidence: parseFloat(process.env.MIN_SCAM_CONFIDENCE || '0.7'),
      alertThreshold: parseFloat(process.env.ALERT_THRESHOLD || '0.8'),
      monitorNewTokens: process.env.MONITOR_NEW_TOKENS !== 'false',
      monitorLpEvents: process.env.MONITOR_LP_EVENTS !== 'false',
      checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '5000', 10),
    };
  }

  /**
   * Start the detection agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Agent is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting Scam Detection Agent...');

    // Start API server
    const port = parseInt(process.env.PORT || '3001', 10);
    const app = createApiServer(this.scamDetector, this.db, this.stats);

    app.listen(port, () => {
      logger.info(`API server running on port ${port}`);
    });

    // Subscribe to new token events if enabled
    if (this.config.monitorNewTokens) {
      await this.solanaMonitor.subscribeToNewTokens((event) => {
        this.handleNewToken(event);
      });
    }

    logger.info('Scam Detection Agent started successfully');
    logger.info(`Configuration:`);
    logger.info(`  - RPC: ${this.config.solanaRpcUrl}`);
    logger.info(`  - Monitor new tokens: ${this.config.monitorNewTokens}`);
    logger.info(`  - Alert threshold: ${this.config.alertThreshold}`);
    logger.info(`  - Telegram alerts: ${this.config.telegramBotToken ? 'enabled' : 'disabled'}`);
    logger.info(`  - Discord alerts: ${this.config.discordWebhookUrl ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle new token detection
   */
  private async handleNewToken(event: NewTokenEvent): Promise<void> {
    logger.info(`New token detected: ${event.tokenAddress}`);

    try {
      // Analyze the new token
      const detection = await this.scamDetector.detectScam(event.tokenAddress);

      // Save detection
      this.db.saveDetection(detection);
      this.stats.tokensAnalyzed++;
      this.stats.lastCheck = new Date().toISOString();

      if (detection.isScam) {
        this.stats.scamsDetected++;

        // Send alert if confidence meets threshold
        if (detection.confidence >= this.config.alertThreshold) {
          await this.alertService.alertScamDetected(detection);
          this.stats.alertsSent++;
        }
      }

      logger.info(
        `Analysis complete for ${event.tokenAddress}: ` +
        `isScam=${detection.isScam}, confidence=${detection.confidence.toFixed(2)}`
      );
    } catch (error) {
      logger.error(`Error analyzing new token ${event.tokenAddress}:`, error);
    }
  }

  /**
   * Analyze a specific token
   */
  async analyzeToken(tokenAddress: string): Promise<void> {
    logger.info(`Manual analysis requested for: ${tokenAddress}`);

    try {
      const detection = await this.scamDetector.detectScam(tokenAddress);
      this.db.saveDetection(detection);
      this.stats.tokensAnalyzed++;

      if (detection.isScam && detection.confidence >= this.config.alertThreshold) {
        await this.alertService.alertScamDetected(detection);
        this.stats.alertsSent++;
      }

      logger.info(`Manual analysis complete for ${tokenAddress}`);
    } catch (error) {
      logger.error(`Error in manual analysis:`, error);
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    logger.info('Stopping Scam Detection Agent...');
    this.isRunning = false;

    await this.solanaMonitor.unsubscribe();
    this.db.close();

    logger.info('Agent stopped');
  }

  /**
   * Get current statistics
   */
  getStats(): AgentStats {
    return {
      ...this.stats,
      uptime: Math.floor((Date.now() - new Date(this.stats.startedAt).getTime()) / 1000),
    };
  }
}

// Main entry point
async function main() {
  const agent = new ScamDetectionAgent();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received');
    await agent.stop();
    process.exit(0);
  });

  // Start the agent
  await agent.start();
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

export { ScamDetectionAgent };
export default ScamDetectionAgent;
