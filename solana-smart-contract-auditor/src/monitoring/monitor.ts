import axios from 'axios';
import { ProgramFetcher } from '../services/programFetcher';
import { Auditor } from '../services/auditor';
import { DatabaseService } from '../db/database';
import { ProgramUpgradeEvent, MonitoredProgram } from '../types';
import logger from '../utils/logger';
import { sleep } from '../utils/helpers';

export class ProgramMonitor {
  private programFetcher: ProgramFetcher;
  private auditor: Auditor;
  private db: DatabaseService;
  private intervalMs: number;
  private isRunning: boolean = false;
  private upgradeCallbacks: ((event: ProgramUpgradeEvent) => void)[] = [];

  constructor(
    rpcUrl: string,
    auditor: Auditor,
    db: DatabaseService,
    intervalMs: number = 60000
  ) {
    this.programFetcher = new ProgramFetcher(rpcUrl);
    this.auditor = auditor;
    this.db = db;
    this.intervalMs = intervalMs;
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Monitor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting program monitor...');

    while (this.isRunning) {
      try {
        await this.checkAllPrograms();
      } catch (error) {
        logger.error('Error in monitoring loop:', error);
      }

      await sleep(this.intervalMs);
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    logger.info('Stopping program monitor...');
    this.isRunning = false;
  }

  /**
   * Register callback for upgrade events
   */
  onUpgrade(callback: (event: ProgramUpgradeEvent) => void): void {
    this.upgradeCallbacks.push(callback);
  }

  /**
   * Check all monitored programs
   */
  private async checkAllPrograms(): Promise<void> {
    const programs = this.db.getMonitoredPrograms();

    if (programs.length === 0) {
      logger.debug('No programs to monitor');
      return;
    }

    logger.debug(`Checking ${programs.length} monitored programs...`);

    for (const program of programs) {
      try {
        await this.checkProgram(program);
      } catch (error) {
        logger.error(`Error checking program ${program.programId}:`, error);
      }
    }
  }

  /**
   * Check single program for upgrades
   */
  private async checkProgram(program: MonitoredProgram): Promise<void> {
    const lastKnownSlot = program.lastSlot || 0;

    const { upgraded, newSlot } = await this.programFetcher.wasRecentlyUpgraded(
      program.programId,
      lastKnownSlot
    );

    if (upgraded && newSlot) {
      logger.info(`Upgrade detected for ${program.programId}: slot ${lastKnownSlot} -> ${newSlot}`);

      // Update slot in database
      this.db.updateMonitoredProgramSlot(program.programId, newSlot);

      // Get upgrade authority
      const info = await this.programFetcher.fetchProgramInfo(program.programId);

      const event: ProgramUpgradeEvent = {
        programId: program.programId,
        previousSlot: lastKnownSlot,
        newSlot,
        timestamp: new Date().toISOString(),
        upgradeAuthority: info.upgradeAuthority || 'unknown',
      };

      // Notify callbacks
      for (const callback of this.upgradeCallbacks) {
        try {
          callback(event);
        } catch (err) {
          logger.error('Error in upgrade callback:', err);
        }
      }

      // Send webhook if configured
      if (program.alertOnUpgrade && program.webhookUrl) {
        await this.sendWebhook(program.webhookUrl, event);
      }

      // Optionally run new audit
      if (program.alertOnUpgrade) {
        try {
          logger.info(`Running audit after upgrade for ${program.programId}`);
          await this.auditor.audit(program.programId, program.name, {
            generateReport: true,
            reportFormat: 'markdown',
          });
          this.db.updateLastAudit(program.programId);
        } catch (error) {
          logger.error(`Failed to audit after upgrade:`, error);
        }
      }
    } else if (!program.lastSlot) {
      // Initialize slot for new monitoring entries
      try {
        const info = await this.programFetcher.fetchProgramInfo(program.programId);
        if (info.lastDeploySlot) {
          this.db.updateMonitoredProgramSlot(program.programId, info.lastDeploySlot);
        }
      } catch {
        // Ignore initialization errors
      }
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(
    webhookUrl: string,
    event: ProgramUpgradeEvent
  ): Promise<void> {
    try {
      // Detect webhook type and format accordingly
      if (webhookUrl.includes('discord')) {
        await this.sendDiscordWebhook(webhookUrl, event);
      } else if (webhookUrl.includes('slack')) {
        await this.sendSlackWebhook(webhookUrl, event);
      } else {
        // Generic webhook
        await axios.post(webhookUrl, event);
      }

      logger.info(`Webhook sent for ${event.programId}`);
    } catch (error) {
      logger.error('Failed to send webhook:', error);
    }
  }

  /**
   * Send Discord webhook
   */
  private async sendDiscordWebhook(
    webhookUrl: string,
    event: ProgramUpgradeEvent
  ): Promise<void> {
    const embed = {
      title: '🔔 Program Upgrade Detected',
      color: 0xff6b00,
      fields: [
        {
          name: 'Program ID',
          value: `\`${event.programId}\``,
          inline: false,
        },
        {
          name: 'Previous Slot',
          value: event.previousSlot.toString(),
          inline: true,
        },
        {
          name: 'New Slot',
          value: event.newSlot.toString(),
          inline: true,
        },
        {
          name: 'Upgrade Authority',
          value: `\`${event.upgradeAuthority}\``,
          inline: false,
        },
      ],
      timestamp: event.timestamp,
      footer: {
        text: 'Solana Smart Contract Auditor',
      },
    };

    await axios.post(webhookUrl, { embeds: [embed] });
  }

  /**
   * Send Slack webhook
   */
  private async sendSlackWebhook(
    webhookUrl: string,
    event: ProgramUpgradeEvent
  ): Promise<void> {
    const message = {
      text: `🔔 Program Upgrade Detected`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Program Upgrade Detected',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Program ID:*\n\`${event.programId}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Upgrade Authority:*\n\`${event.upgradeAuthority}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Previous Slot:* ${event.previousSlot}`,
            },
            {
              type: 'mrkdwn',
              text: `*New Slot:* ${event.newSlot}`,
            },
          ],
        },
      ],
    };

    await axios.post(webhookUrl, message);
  }
}

export default ProgramMonitor;
