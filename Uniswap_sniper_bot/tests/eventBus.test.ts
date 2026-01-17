import { EventBus } from '../src/core/eventBus';
import { AgentType, MessageType, AgentMessage } from '../src/types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('publish', () => {
    it('should publish messages with timestamp and id', (done) => {
      eventBus.on('message', (message: AgentMessage) => {
        expect(message.timestamp).toBeDefined();
        expect(message.id).toBeDefined();
        expect(message.from).toBe(AgentType.POOL_DETECTOR);
        expect(message.to).toBe(AgentType.SNIPER);
        expect(message.type).toBe(MessageType.NEW_POOL_DETECTED);
        done();
      });

      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: AgentType.SNIPER,
        type: MessageType.NEW_POOL_DETECTED,
        payload: { pool: '0x123' }
      });
    });

    it('should emit to specific message type listeners', (done) => {
      eventBus.on(MessageType.NEW_POOL_DETECTED, (message: AgentMessage) => {
        expect(message.type).toBe(MessageType.NEW_POOL_DETECTED);
        done();
      });

      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: 'broadcast',
        type: MessageType.NEW_POOL_DETECTED,
        payload: {}
      });
    });
  });

  describe('sendTo', () => {
    it('should send direct messages', (done) => {
      eventBus.on(`agent:${AgentType.SNIPER}`, (message: AgentMessage) => {
        expect(message.to).toBe(AgentType.SNIPER);
        done();
      });

      eventBus.sendTo(
        AgentType.POOL_DETECTOR,
        AgentType.SNIPER,
        MessageType.NEW_POOL_DETECTED,
        { pool: '0x123' }
      );
    });
  });

  describe('broadcast', () => {
    it('should broadcast to all', (done) => {
      eventBus.on('message', (message: AgentMessage) => {
        expect(message.to).toBe('broadcast');
        done();
      });

      eventBus.broadcast(
        AgentType.COORDINATOR,
        MessageType.STATUS_UPDATE,
        { status: 'running' }
      );
    });
  });

  describe('message history', () => {
    it('should store message history', () => {
      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: 'broadcast',
        type: MessageType.NEW_POOL_DETECTED,
        payload: { id: 1 }
      });

      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: 'broadcast',
        type: MessageType.NEW_POOL_DETECTED,
        payload: { id: 2 }
      });

      const messages = eventBus.getRecentMessages(10);
      expect(messages.length).toBe(2);
    });

    it('should filter messages by type', () => {
      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: 'broadcast',
        type: MessageType.NEW_POOL_DETECTED,
        payload: {}
      });

      eventBus.publish({
        from: AgentType.SNIPER,
        to: 'broadcast',
        type: MessageType.SNIPE_EXECUTED,
        payload: {}
      });

      const poolMessages = eventBus.getMessagesByType(MessageType.NEW_POOL_DETECTED);
      expect(poolMessages.length).toBe(1);
    });

    it('should clear history', () => {
      eventBus.publish({
        from: AgentType.POOL_DETECTOR,
        to: 'broadcast',
        type: MessageType.NEW_POOL_DETECTED,
        payload: {}
      });

      eventBus.clearHistory();

      const messages = eventBus.getRecentMessages();
      expect(messages.length).toBe(0);
    });
  });

  describe('waitForMessage', () => {
    it('should resolve when message is received', async () => {
      const messagePromise = eventBus.waitForMessage(MessageType.NEW_POOL_DETECTED, 5000);

      // Emit after a short delay
      setTimeout(() => {
        eventBus.publish({
          from: AgentType.POOL_DETECTOR,
          to: 'broadcast',
          type: MessageType.NEW_POOL_DETECTED,
          payload: { test: true }
        });
      }, 100);

      const message = await messagePromise;
      expect(message.payload.test).toBe(true);
    });

    it('should timeout if message not received', async () => {
      await expect(
        eventBus.waitForMessage(MessageType.NEW_POOL_DETECTED, 100)
      ).rejects.toThrow('Timeout');
    });

    it('should filter messages with custom filter', async () => {
      const messagePromise = eventBus.waitForMessage(
        MessageType.NEW_POOL_DETECTED,
        5000,
        (msg) => msg.payload.id === 2
      );

      setTimeout(() => {
        eventBus.publish({
          from: AgentType.POOL_DETECTOR,
          to: 'broadcast',
          type: MessageType.NEW_POOL_DETECTED,
          payload: { id: 1 }
        });

        eventBus.publish({
          from: AgentType.POOL_DETECTOR,
          to: 'broadcast',
          type: MessageType.NEW_POOL_DETECTED,
          payload: { id: 2 }
        });
      }, 100);

      const message = await messagePromise;
      expect(message.payload.id).toBe(2);
    });
  });
});
