'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV, WS_EVENTS } from '@/lib/constants';
import { useStore } from '@/store/useStore';
import type {
  PriceUpdate,
  NewTradeEvent,
  NewTokenEvent,
  BondingCurveProgressEvent,
  MigrationEvent,
} from '@/types';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToToken: (mint: string) => void;
  unsubscribeFromToken: (mint: string) => void;
  subscribeToAll: () => void;
}

// Event handlers type
interface SocketEventHandlers {
  onPriceUpdate?: (data: PriceUpdate) => void;
  onNewTrade?: (data: NewTradeEvent) => void;
  onNewToken?: (data: NewTokenEvent) => void;
  onBondingCurveProgress?: (data: BondingCurveProgressEvent) => void;
  onMigration?: (data: MigrationEvent) => void;
}

export const useSocket = (
  options: UseSocketOptions = {},
  handlers: SocketEventHandlers = {}
): UseSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const {
    onPriceUpdate,
    onNewTrade,
    onNewToken,
    onBondingCurveProgress,
    onMigration,
  } = handlers;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const updatePriceCache = useStore((state) => state.updatePriceCache);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(ENV.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on(WS_EVENTS.CONNECT, () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      onConnect?.();
    });

    socket.on(WS_EVENTS.DISCONNECT, (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on(WS_EVENTS.ERROR, (error) => {
      console.error('WebSocket error:', error);
      onError?.(new Error(error));
    });

    // Price update handler
    socket.on(WS_EVENTS.PRICE_UPDATE, (data: PriceUpdate) => {
      // Update price cache
      updatePriceCache(data.mint, data.price);
      onPriceUpdate?.(data);
    });

    // New trade handler
    socket.on(WS_EVENTS.NEW_TRADE, (data: NewTradeEvent) => {
      onNewTrade?.(data);
    });

    // New token handler
    socket.on(WS_EVENTS.NEW_TOKEN, (data: NewTokenEvent) => {
      onNewToken?.(data);
    });

    // Bonding curve progress handler
    socket.on(
      WS_EVENTS.BONDING_CURVE_PROGRESS,
      (data: BondingCurveProgressEvent) => {
        onBondingCurveProgress?.(data);
      }
    );

    // Migration handlers
    socket.on(WS_EVENTS.MIGRATION_STARTED, (data: MigrationEvent) => {
      onMigration?.({ ...data, status: 'started' });
    });

    socket.on(WS_EVENTS.MIGRATION_COMPLETED, (data: MigrationEvent) => {
      onMigration?.({ ...data, status: 'completed' });
    });

    socketRef.current = socket;
  }, [
    onConnect,
    onDisconnect,
    onError,
    onPriceUpdate,
    onNewTrade,
    onNewToken,
    onBondingCurveProgress,
    onMigration,
    updatePriceCache,
  ]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Subscribe to specific token updates
  const subscribeToToken = useCallback((mint: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WS_EVENTS.SUBSCRIBE_TOKEN, { mint });
    }
  }, []);

  // Unsubscribe from token updates
  const unsubscribeFromToken = useCallback((mint: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WS_EVENTS.UNSUBSCRIBE_TOKEN, { mint });
    }
  }, []);

  // Subscribe to all platform updates
  const subscribeToAll = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(WS_EVENTS.SUBSCRIBE_ALL);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    socket: socketRef.current,
    connect,
    disconnect,
    subscribeToToken,
    unsubscribeFromToken,
    subscribeToAll,
  };
};

// Hook for subscribing to a specific token's real-time updates
export const useTokenSocket = (
  mint: string | null,
  handlers: Omit<SocketEventHandlers, 'onNewToken'> = {}
) => {
  const { subscribeToToken, unsubscribeFromToken, isConnected } = useSocket(
    {},
    handlers
  );

  useEffect(() => {
    if (mint && isConnected) {
      subscribeToToken(mint);
      return () => {
        unsubscribeFromToken(mint);
      };
    }
  }, [mint, isConnected, subscribeToToken, unsubscribeFromToken]);

  return { isConnected };
};

export default useSocket;
