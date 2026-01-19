'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';

/**
 * Generic type for socket event handlers
 */
type EventHandler<T = unknown> = (data: T) => void;

/**
 * Options for useSocketEvent hook
 */
interface UseSocketEventOptions {
  /** Whether the subscription is enabled */
  enabled?: boolean;
  /** Whether to fire the callback only once */
  once?: boolean;
}

/**
 * Hook for subscribing to socket events
 * Automatically handles subscription cleanup
 *
 * @param event - The socket event to listen for
 * @param handler - Callback function when event is received
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useSocketEvent('trade:new', (trade) => {
 *   console.log('New trade:', trade);
 * });
 * ```
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: EventHandler<T>,
  options: UseSocketEventOptions = {}
): void {
  const { socket, isConnected } = useSocket();
  const { enabled = true, once = false } = options;

  // Store handler in ref to avoid stale closures
  const handlerRef = useRef(handler);
  const firedRef = useRef(false);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Subscribe to event
  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return;
    }

    // Reset fired flag when re-enabling
    if (enabled) {
      firedRef.current = false;
    }

    const eventHandler = (data: T) => {
      // Handle once option
      if (once && firedRef.current) {
        return;
      }
      firedRef.current = true;
      handlerRef.current(data);
    };

    socket.on(event, eventHandler);

    return () => {
      socket.off(event, eventHandler);
    };
  }, [socket, isConnected, event, enabled, once]);
}

/**
 * Hook for subscribing to multiple socket events
 *
 * @param events - Map of event names to handlers
 * @param enabled - Whether subscriptions are enabled
 *
 * @example
 * ```tsx
 * useSocketEvents({
 *   'trade:new': handleNewTrade,
 *   'price:update': handlePriceUpdate,
 * });
 * ```
 */
export function useSocketEvents<T extends Record<string, EventHandler>>(
  events: T,
  enabled: boolean = true
): void {
  const { socket, isConnected } = useSocket();
  const eventsRef = useRef(events);

  // Update events ref
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Subscribe to all events
  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return;
    }

    const handlers: Array<{ event: string; handler: EventHandler }> = [];

    for (const [event, handler] of Object.entries(eventsRef.current)) {
      const wrappedHandler: EventHandler = (data) => {
        // Get current handler from ref to avoid stale closures
        const currentHandler = eventsRef.current[event];
        if (currentHandler) {
          currentHandler(data);
        }
      };

      socket.on(event, wrappedHandler);
      handlers.push({ event, handler: wrappedHandler });
    }

    return () => {
      for (const { event, handler } of handlers) {
        socket.off(event, handler);
      }
    };
  }, [socket, isConnected, enabled]);
}

/**
 * Hook for emitting socket events with type safety
 *
 * @returns emit function
 *
 * @example
 * ```tsx
 * const emit = useSocketEmit();
 * emit('join:token', tokenMint);
 * ```
 */
export function useSocketEmit() {
  const { socket, isConnected } = useSocket();

  return useCallback(
    <T = unknown>(event: string, data?: T): boolean => {
      if (!socket || !isConnected) {
        console.warn(`Cannot emit ${event}: socket not connected`);
        return false;
      }

      socket.emit(event, data);
      return true;
    },
    [socket, isConnected]
  );
}

/**
 * Hook for emitting events with acknowledgement
 *
 * @returns emit function that returns a promise
 *
 * @example
 * ```tsx
 * const emitWithAck = useSocketEmitWithAck();
 * const response = await emitWithAck('ping', {});
 * ```
 */
export function useSocketEmitWithAck() {
  const { socket, isConnected } = useSocket();

  return useCallback(
    <TData = unknown, TResponse = unknown>(
      event: string,
      data?: TData,
      timeout: number = 5000
    ): Promise<TResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error(`Cannot emit ${event}: socket not connected`));
          return;
        }

        const timer = setTimeout(() => {
          reject(new Error(`Socket event ${event} timed out`));
        }, timeout);

        socket.emit(event, data, (response: TResponse) => {
          clearTimeout(timer);
          resolve(response);
        });
      });
    },
    [socket, isConnected]
  );
}

/**
 * Hook for one-time socket events
 * Event fires once and then unsubscribes
 *
 * @param event - Event name
 * @param handler - Handler function
 * @param enabled - Whether subscription is active
 */
export function useSocketEventOnce<T = unknown>(
  event: string,
  handler: EventHandler<T>,
  enabled: boolean = true
): void {
  useSocketEvent(event, handler, { enabled, once: true });
}

export default useSocketEvent;
