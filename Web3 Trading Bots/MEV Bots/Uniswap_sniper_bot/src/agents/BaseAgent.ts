import { EventEmitter } from 'eventemitter3';
import { AgentType, AgentStatus, AgentMessage, MessageType, AgentConfig } from '../types';
import { EventBus, getEventBus } from '../core/eventBus';
import { createComponentLogger } from '../utils/logger';

export abstract class BaseAgent extends EventEmitter {
  protected name: string;
  protected type: AgentType;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected eventBus: EventBus;
  protected logger: ReturnType<typeof createComponentLogger>;
  protected config: AgentConfig;
  protected isRunning: boolean = false;

  constructor(type: AgentType, name: string, config: Partial<AgentConfig> = {}) {
    super();
    this.type = type;
    this.name = name;
    this.eventBus = getEventBus();
    this.logger = createComponentLogger(name);

    this.config = {
      type,
      enabled: true,
      priority: 1,
      options: {},
      ...config
    };

    // Subscribe to messages for this agent
    this.eventBus.on(`agent:${type}`, this.handleMessage.bind(this));
    this.eventBus.on('message', this.onBroadcastMessage.bind(this));
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    this.logger.info(`Starting ${this.name} agent`);
    this.status = AgentStatus.RUNNING;
    this.isRunning = true;

    try {
      await this.onStart();
      this.broadcastStatus();
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error('Failed to start agent', { error });
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info(`Stopping ${this.name} agent`);
    this.isRunning = false;

    try {
      await this.onStop();
      this.status = AgentStatus.STOPPED;
      this.broadcastStatus();
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error('Error stopping agent', { error });
    }
  }

  /**
   * Pause the agent
   */
  pause(): void {
    if (this.status === AgentStatus.RUNNING) {
      this.status = AgentStatus.PAUSED;
      this.broadcastStatus();
      this.logger.info('Agent paused');
    }
  }

  /**
   * Resume the agent
   */
  resume(): void {
    if (this.status === AgentStatus.PAUSED) {
      this.status = AgentStatus.RUNNING;
      this.broadcastStatus();
      this.logger.info('Agent resumed');
    }
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent type
   */
  getType(): AgentType {
    return this.type;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if agent is healthy
   */
  isHealthy(): boolean {
    return this.status === AgentStatus.RUNNING;
  }

  /**
   * Send a message to another agent
   */
  protected sendMessage(to: AgentType, type: MessageType, payload: any): void {
    this.eventBus.sendTo(this.type, to, type, payload);
  }

  /**
   * Broadcast a message to all agents
   */
  protected broadcast(type: MessageType, payload: any): void {
    this.eventBus.broadcast(this.type, type, payload);
  }

  /**
   * Broadcast status update
   */
  protected broadcastStatus(): void {
    this.broadcast(MessageType.STATUS_UPDATE, {
      agent: this.type,
      status: this.status,
      name: this.name
    });
  }

  /**
   * Handle incoming message
   */
  protected handleMessage(message: AgentMessage): void {
    if (message.from === this.type) return; // Ignore own messages

    this.onMessage(message);
  }

  /**
   * Handle broadcast messages
   */
  private onBroadcastMessage(message: AgentMessage): void {
    if (message.to === 'broadcast' && message.from !== this.type) {
      this.onMessage(message);
    }
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onMessage(message: AgentMessage): void;
}

export default BaseAgent;
