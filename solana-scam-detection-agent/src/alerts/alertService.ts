import axios from 'axios';
import { Alert, AlertType, AlertSeverity, ScamDetectionResult } from '../types';
import { DatabaseService } from '../db/database';
import logger from '../utils/logger';
import {
  generateAlertId,
  truncateAddress,
  scamTypeToReadable,
  severityEmoji,
  confidenceToSeverity,
} from '../utils/helpers';

export class AlertService {
  private db: DatabaseService;
  private telegramBotToken?: string;
  private telegramChatId?: string;
  private discordWebhookUrl?: string;

  constructor(
    db: DatabaseService,
    telegramBotToken?: string,
    telegramChatId?: string,
    discordWebhookUrl?: string
  ) {
    this.db = db;
    this.telegramBotToken = telegramBotToken;
    this.telegramChatId = telegramChatId;
    this.discordWebhookUrl = discordWebhookUrl;
  }

  /**
   * Create and send alert for detected scam
   */
  async alertScamDetected(detection: ScamDetectionResult): Promise<Alert> {
    const severity = confidenceToSeverity(detection.confidence);

    const alert: Alert = {
      id: generateAlertId(),
      type: 'SCAM_DETECTED',
      severity,
      tokenAddress: detection.tokenAddress,
      title: `${severityEmoji(severity)} Scam Detected: ${detection.metadata.symbol}`,
      message: this.formatAlertMessage(detection),
      timestamp: new Date().toISOString(),
      detection,
      sent: false,
    };

    // Save to database
    this.db.saveAlert(alert);

    // Send notifications
    await this.sendAlert(alert);

    return alert;
  }

  /**
   * Send alert through all configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.telegramBotToken && this.telegramChatId) {
      promises.push(this.sendTelegramAlert(alert));
    }

    if (this.discordWebhookUrl) {
      promises.push(this.sendDiscordAlert(alert));
    }

    try {
      await Promise.all(promises);
      alert.sent = true;
      this.db.markAlertSent(alert.id);
      logger.info(`Alert sent successfully: ${alert.id}`);
    } catch (error) {
      logger.error(`Failed to send alert ${alert.id}:`, error);
    }
  }

  /**
   * Send alert to Telegram
   */
  private async sendTelegramAlert(alert: Alert): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChatId) return;

    const message = this.formatTelegramMessage(alert);

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }
      );

      logger.debug(`Telegram alert sent: ${alert.id}`);
    } catch (error) {
      logger.error('Failed to send Telegram alert:', error);
      throw error;
    }
  }

  /**
   * Send alert to Discord
   */
  private async sendDiscordAlert(alert: Alert): Promise<void> {
    if (!this.discordWebhookUrl) return;

    const embed = this.formatDiscordEmbed(alert);

    try {
      await axios.post(this.discordWebhookUrl, { embeds: [embed] });
      logger.debug(`Discord alert sent: ${alert.id}`);
    } catch (error) {
      logger.error('Failed to send Discord alert:', error);
      throw error;
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(detection: ScamDetectionResult): string {
    const indicators = detection.indicators
      .filter((i) => i.detected)
      .map((i) => `- ${i.description}`)
      .join('\n');

    return `
Token: ${detection.metadata.name} (${detection.metadata.symbol})
Address: ${detection.tokenAddress}
Risk Score: ${detection.riskScore}/100
Confidence: ${(detection.confidence * 100).toFixed(1)}%
Scam Type: ${scamTypeToReadable(detection.scamType)}

Indicators:
${indicators}

Recommendation: ${detection.recommendation}
    `.trim();
  }

  /**
   * Format Telegram message with HTML
   */
  private formatTelegramMessage(alert: Alert): string {
    const d = alert.detection;
    const indicators = d.indicators
      .filter((i) => i.detected)
      .slice(0, 5)
      .map((i) => `• ${i.description}`)
      .join('\n');

    return `
<b>${alert.title}</b>

<b>Token:</b> ${d.metadata.name} (<code>${d.metadata.symbol}</code>)
<b>Address:</b> <code>${d.tokenAddress}</code>
<b>Risk Score:</b> ${d.riskScore}/100
<b>Confidence:</b> ${(d.confidence * 100).toFixed(1)}%
<b>Type:</b> ${scamTypeToReadable(d.scamType)}

<b>Indicators:</b>
${indicators}

<b>Recommendation:</b>
${d.recommendation}

<a href="https://solscan.io/token/${d.tokenAddress}">View on Solscan</a>
    `.trim();
  }

  /**
   * Format Discord embed
   */
  private formatDiscordEmbed(alert: Alert): object {
    const d = alert.detection;
    const color = this.severityToColor(alert.severity);

    const indicators = d.indicators
      .filter((i) => i.detected)
      .slice(0, 5)
      .map((i) => `• ${i.description}`)
      .join('\n');

    return {
      title: alert.title,
      color,
      fields: [
        {
          name: 'Token',
          value: `${d.metadata.name} (${d.metadata.symbol})`,
          inline: true,
        },
        {
          name: 'Risk Score',
          value: `${d.riskScore}/100`,
          inline: true,
        },
        {
          name: 'Confidence',
          value: `${(d.confidence * 100).toFixed(1)}%`,
          inline: true,
        },
        {
          name: 'Scam Type',
          value: scamTypeToReadable(d.scamType),
          inline: true,
        },
        {
          name: 'Address',
          value: `\`${truncateAddress(d.tokenAddress)}\``,
          inline: true,
        },
        {
          name: 'Indicators',
          value: indicators || 'None',
          inline: false,
        },
        {
          name: 'Recommendation',
          value: d.recommendation,
          inline: false,
        },
      ],
      timestamp: alert.timestamp,
      footer: {
        text: 'Solana Scam Detection Agent',
      },
      url: `https://solscan.io/token/${d.tokenAddress}`,
    };
  }

  /**
   * Convert severity to Discord color
   */
  private severityToColor(severity: AlertSeverity): number {
    const colors: Record<AlertSeverity, number> = {
      INFO: 0x3498db,     // Blue
      WARNING: 0xf1c40f,  // Yellow
      DANGER: 0xe67e22,   // Orange
      CRITICAL: 0xe74c3c, // Red
    };
    return colors[severity];
  }
}

export default AlertService;
