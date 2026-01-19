import { EventEmitter } from 'eventemitter3';
import { AgentMessage, MessageType, AgentType } from '../types';
import { createComponentLogger } from '../utils/logger';
import { generateId } from '../utils/helpers';

const logger = createComponentLogger('EventBus');

interface EventBusEvents {
  'message': (message: AgentMessage) => void;
  [key: string]: (...args: any[]) => void;
}

export class EventBus extends EventEmitter<EventBusEvents> {
  private messageHistory: AgentMessage[] = [];
  private maxHistorySize: number = 1000;
  private subscribers: Map<AgentType, Set<MessageType>> = new Map();

  constructor() {
    super();
  }

  /**
   * Publish a message to the event bus
   */
  publish(message: Omit<AgentMessage, 'timestamp' | 'id'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      timestamp: Date.now(),
      id: generateId()
    };

    // Add to history
    this.messageHistory.push(fullMessage);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }

    // Emit to all listeners
    this.emit('message', fullMessage);

    // Emit to specific message type listeners
    this.emit(message.type, fullMessage);

    // Emit to specific agent listeners
    if (message.to !== 'broadcast') {
      this.emit(`agent:${message.to}`, fullMessage);
    }

    logger.debug(`Message published: ${message.type} from ${message.from} to ${message.to}`);
  }

  /**
   * Subscribe an agent to specific message types
   */
  subscribe(agentType: AgentType, messageTypes: MessageType[]): void {
    if (!this.subscribers.has(agentType)) {
      this.subscribers.set(agentType, new Set());
    }

    const agentSubscriptions = this.subscribers.get(agentType)!;
    messageTypes.forEach(type => agentSubscriptions.add(type));

    logger.debug(`Agent ${agentType} subscribed to: ${messageTypes.join(', ')}`);
  }

  /**
   * Unsubscribe an agent from specific message types
   */
  unsubscribe(agentType: AgentType, messageTypes?: MessageType[]): void {
    const agentSubscriptions = this.subscribers.get(agentType);
    if (!agentSubscriptions) return;

    if (messageTypes) {
      messageTypes.forEach(type => agentSubscriptions.delete(type));
    } else {
      this.subscribers.delete(agentType);
    }
  }

  /**
   * Get messages for a specific agent
   */
  getMessagesForAgent(agentType: AgentType, limit?: number): AgentMessage[] {
    const messages = this.messageHistory.filter(
      msg => msg.to === agentType || msg.to === 'broadcast'
    );

    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Get messages by type
   */
  getMessagesByType(type: MessageType, limit?: number): AgentMessage[] {
    const messages = this.messageHistory.filter(msg => msg.type === type);
    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number = 100): AgentMessage[] {
    return this.messageHistory.slice(-limit);
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
    logger.info('Message history cleared');
  }

  /**
   * Send a direct message to an agent
   */
  sendTo(
    from: AgentType,
    to: AgentType,
    type: MessageType,
    payload: any
  ): void {
    this.publish({ from, to, type, payload });
  }

  /**
   * Broadcast a message to all agents
   */
  broadcast(from: AgentType, type: MessageType, payload: any): void {
    this.publish({ from, to: 'broadcast', type, payload });
  }

  /**
   * Wait for a specific message
   */
  waitForMessage(
    type: MessageType,
    timeout: number = 30000,
    filter?: (msg: AgentMessage) => boolean
  ): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(type, handler);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      const handler = (message: AgentMessage) => {
        if (!filter || filter(message)) {
          clearTimeout(timeoutId);
          this.off(type, handler);
          resolve(message);
        }
      };

      this.on(type, handler);
    });
  }

  /**
   * Create a request-response pattern
   */
  async request(
    from: AgentType,
    to: AgentType,
    type: MessageType,
    payload: any,
    responseType: MessageType,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    const requestId = generateId();

    // Start listening for response before sending request
    const responsePromise = this.waitForMessage(
      responseType,
      timeout,
      (msg) => msg.payload?.requestId === requestId
    );

    // Send the request
    this.publish({
      from,
      to,
      type,
      payload: { ...payload, requestId }
    });

    return responsePromise;
  }
}

// Singleton instance
let eventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = new EventBus();
  }
  return eventBus;
}

export default EventBus;
