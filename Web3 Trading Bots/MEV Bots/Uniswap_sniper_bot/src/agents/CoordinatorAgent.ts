import { BaseAgent } from './BaseAgent';
import { MempoolAgent } from './MempoolAgent';
import { PoolDetectorAgent } from './PoolDetectorAgent';
import { SafetyAgent } from './SafetyAgent';
import { SniperAgent } from './SniperAgent';
import { getProviderManager } from '../core/provider';
import { getEventBus } from '../core/eventBus';
import { agentConfig, config } from '../config';
import { AgentType, AgentStatus, AgentMessage, MessageType } from '../types';
import { createComponentLogger } from '../utils/logger';
import { formatEther, parseEther } from 'ethers';

const logger = createComponentLogger('Coordinator');

export class CoordinatorAgent extends BaseAgent {
  private mempoolAgent: MempoolAgent | null = null;
  private poolDetectorAgent: PoolDetectorAgent | null = null;
  private safetyAgent: SafetyAgent | null = null;
  private sniperAgent: SniperAgent | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private stats = {
    poolsDetected: 0,
    snipesAttempted: 0,
    snipesSuccessful: 0,
    totalProfit: BigInt(0),
    uptime: 0
  };
  private startTime: number = 0;

  constructor() {
    super(AgentType.COORDINATOR, 'Coordinator');
  }

  protected async onStart(): Promise<void> {
    this.startTime = Date.now();
    logger.info('Starting Coordinator - initializing all agents');

    // Initialize agents based on configuration
    if (agentConfig.enableMempoolAgent) {
      this.mempoolAgent = new MempoolAgent();
      await this.mempoolAgent.start();
      logger.info('Mempool agent started');
    }

    if (agentConfig.enablePoolDetectorAgent) {
      this.poolDetectorAgent = new PoolDetectorAgent();
      await this.poolDetectorAgent.start();
      logger.info('Pool detector agent started');
    }

    if (agentConfig.enableSafetyAgent) {
      this.safetyAgent = new SafetyAgent();
      await this.safetyAgent.start();
      logger.info('Safety agent started');
    }

    if (agentConfig.enableSniperAgent) {
      this.sniperAgent = new SniperAgent();
      await this.sniperAgent.start();
      logger.info('Sniper agent started');
    }

    // Start health check
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Start stats collection
    this.statsInterval = setInterval(() => {
      this.collectStats();
    }, 60000);

    // Subscribe to relevant events
    const eventBus = getEventBus();
    eventBus.on(MessageType.NEW_POOL_DETECTED, () => this.stats.poolsDetected++);
    eventBus.on(MessageType.SNIPE_EXECUTED, (msg: AgentMessage) => {
      this.stats.snipesAttempted++;
      if (msg.payload.success) {
        this.stats.snipesSuccessful++;
        if (msg.payload.profit) {
          this.stats.totalProfit += msg.payload.profit;
        }
      }
    });

    logger.info('All agents initialized successfully');
    this.printStatus();
  }

  protected async onStop(): Promise<void> {
    logger.info('Stopping all agents');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Stop all agents
    const stopPromises: Promise<void>[] = [];

    if (this.mempoolAgent) {
      stopPromises.push(this.mempoolAgent.stop());
    }
    if (this.poolDetectorAgent) {
      stopPromises.push(this.poolDetectorAgent.stop());
    }
    if (this.safetyAgent) {
      stopPromises.push(this.safetyAgent.stop());
    }
    if (this.sniperAgent) {
      stopPromises.push(this.sniperAgent.stop());
    }

    await Promise.all(stopPromises);
    logger.info('All agents stopped');
  }

  protected onMessage(message: AgentMessage): void {
    switch (message.type) {
      case MessageType.ERROR:
        this.handleAgentError(message);
        break;

      case MessageType.STATUS_UPDATE:
        this.handleStatusUpdate(message);
        break;

      case MessageType.COMMAND:
        this.handleCommand(message.payload);
        break;
    }
  }

  /**
   * Handle error from any agent
   */
  private handleAgentError(message: AgentMessage): void {
    logger.error(`Error from ${message.from}:`, message.payload);

    // Attempt recovery based on agent type
    switch (message.from) {
      case AgentType.MEMPOOL_MONITOR:
        this.restartAgent('mempool');
        break;
      case AgentType.POOL_DETECTOR:
        this.restartAgent('poolDetector');
        break;
    }
  }

  /**
   * Handle status update from agents
   */
  private handleStatusUpdate(message: AgentMessage): void {
    if (message.payload.status === AgentStatus.ERROR) {
      logger.warn(`Agent ${message.from} is in error state`);
    }
  }

  /**
   * Handle commands
   */
  private handleCommand(command: any): void {
    switch (command.action) {
      case 'pause':
        this.pauseAll();
        break;

      case 'resume':
        this.resumeAll();
        break;

      case 'status':
        this.printStatus();
        break;

      case 'stats':
        this.printStats();
        break;

      case 'restart':
        if (command.agent) {
          this.restartAgent(command.agent);
        }
        break;
    }
  }

  /**
   * Perform health check on all agents
   */
  private performHealthCheck(): void {
    const unhealthy: string[] = [];

    if (this.mempoolAgent && !this.mempoolAgent.isHealthy()) {
      unhealthy.push('mempool');
    }
    if (this.poolDetectorAgent && !this.poolDetectorAgent.isHealthy()) {
      unhealthy.push('poolDetector');
    }
    if (this.safetyAgent && !this.safetyAgent.isHealthy()) {
      unhealthy.push('safety');
    }
    if (this.sniperAgent && !this.sniperAgent.isHealthy()) {
      unhealthy.push('sniper');
    }

    if (unhealthy.length > 0) {
      logger.warn(`Unhealthy agents: ${unhealthy.join(', ')}`);

      // Attempt to restart unhealthy agents
      unhealthy.forEach(agent => this.restartAgent(agent));
    }
  }

  /**
   * Collect and log stats
   */
  private collectStats(): void {
    this.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Restart a specific agent
   */
  private async restartAgent(agentName: string): Promise<void> {
    logger.info(`Restarting ${agentName} agent`);

    try {
      switch (agentName) {
        case 'mempool':
          if (this.mempoolAgent) {
            await this.mempoolAgent.stop();
            await this.mempoolAgent.start();
          }
          break;

        case 'poolDetector':
          if (this.poolDetectorAgent) {
            await this.poolDetectorAgent.stop();
            await this.poolDetectorAgent.start();
          }
          break;

        case 'safety':
          if (this.safetyAgent) {
            await this.safetyAgent.stop();
            await this.safetyAgent.start();
          }
          break;

        case 'sniper':
          if (this.sniperAgent) {
            await this.sniperAgent.stop();
            await this.sniperAgent.start();
          }
          break;
      }

      logger.info(`${agentName} agent restarted successfully`);
    } catch (error) {
      logger.error(`Failed to restart ${agentName} agent`, { error });
    }
  }

  /**
   * Pause all agents
   */
  pauseAll(): void {
    this.mempoolAgent?.pause();
    this.poolDetectorAgent?.pause();
    this.sniperAgent?.pause();
    logger.info('All agents paused');
  }

  /**
   * Resume all agents
   */
  resumeAll(): void {
    this.mempoolAgent?.resume();
    this.poolDetectorAgent?.resume();
    this.sniperAgent?.resume();
    logger.info('All agents resumed');
  }

  /**
   * Print current status
   */
  printStatus(): void {
    const status = {
      coordinator: this.status,
      mempool: this.mempoolAgent?.getStatus() || 'disabled',
      poolDetector: this.poolDetectorAgent?.getStatus() || 'disabled',
      safety: this.safetyAgent?.getStatus() || 'disabled',
      sniper: this.sniperAgent?.getStatus() || 'disabled'
    };

    logger.info('Agent Status:', status);
  }

  /**
   * Print statistics
   */
  printStats(): void {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    logger.info('Statistics:', {
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      poolsDetected: this.stats.poolsDetected,
      snipesAttempted: this.stats.snipesAttempted,
      snipesSuccessful: this.stats.snipesSuccessful,
      successRate: this.stats.snipesAttempted > 0
        ? `${((this.stats.snipesSuccessful / this.stats.snipesAttempted) * 100).toFixed(1)}%`
        : 'N/A',
      totalProfit: formatEther(this.stats.totalProfit)
    });
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  /**
   * Get positions from sniper agent
   */
  getPositions() {
    return this.sniperAgent?.getPositions() || [];
  }

  /**
   * Get trade history from sniper agent
   */
  getTradeHistory() {
    return this.sniperAgent?.getTradeHistory() || [];
  }

  /**
   * Execute manual snipe
   */
  async manualSnipe(tokenAddress: string, amountEth: string): Promise<void> {
    if (!this.sniperAgent) {
      logger.error('Sniper agent not initialized');
      return;
    }

    // Broadcast snipe opportunity
    this.broadcast(MessageType.SNIPE_OPPORTUNITY, {
      type: 'manual',
      tokenAddress,
      amountIn: parseEther(amountEth)
    });
  }

  /**
   * Sell position
   */
  async sellPosition(tokenAddress: string): Promise<void> {
    if (this.sniperAgent) {
      await this.sniperAgent.sellPosition(tokenAddress);
    }
  }

  /**
   * Sell all positions
   */
  async sellAllPositions(): Promise<void> {
    if (this.sniperAgent) {
      await this.sniperAgent.sellAllPositions();
    }
  }
}

// Singleton instance
let coordinatorAgent: CoordinatorAgent | null = null;

export function getCoordinatorAgent(): CoordinatorAgent {
  if (!coordinatorAgent) {
    coordinatorAgent = new CoordinatorAgent();
  }
  return coordinatorAgent;
}

export default CoordinatorAgent;
