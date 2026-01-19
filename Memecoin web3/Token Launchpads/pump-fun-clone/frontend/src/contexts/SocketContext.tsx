'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

// Types
interface SocketContextState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  latency: number | null;
  reconnectAttempts: number;
}

interface SocketContextValue extends SocketContextState {
  connect: () => void;
  disconnect: () => void;
  emit: <T = unknown>(event: string, data?: T) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  subscribeToGlobal: () => void;
  unsubscribeFromGlobal: () => void;
}

interface SocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
  walletAddress?: string | null;
}

// Default socket URL
const DEFAULT_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Reconnection config
const RECONNECT_CONFIG = {
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 1.5,
};

// Create context
const SocketContext = createContext<SocketContextValue | undefined>(undefined);

/**
 * Socket Provider Component
 * Manages WebSocket connection with automatic reconnection
 */
export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  url = DEFAULT_SOCKET_URL,
  autoConnect = true,
  walletAddress = null,
}) => {
  const [state, setState] = useState<SocketContextState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    latency: null,
    reconnectAttempts: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.multiplier, attempt);
    return Math.min(delay, RECONNECT_CONFIG.maxDelay);
  }, []);

  // Update state safely
  const safeSetState = useCallback((updates: Partial<SocketContextState>) => {
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Connect to socket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    safeSetState({ isConnecting: true, error: null });

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually
      timeout: 10000,
      auth: {
        walletAddress,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      safeSetState({
        socket,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
      });

      // Start ping interval for latency measurement
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        const start = Date.now();
        socket.emit('ping', (response: { timestamp: number }) => {
          if (mountedRef.current) {
            const latency = Date.now() - start;
            safeSetState({ latency });
          }
        });
      }, 30000);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      safeSetState({
        isConnected: false,
        latency: null,
      });

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Auto reconnect for certain reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      safeSetState({
        isConnecting: false,
        error: error.message,
      });
      scheduleReconnect();
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      safeSetState({ error: error.message });
    });
  }, [url, walletAddress, safeSetState]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    setState((prev) => {
      if (prev.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
        console.log('Max reconnect attempts reached');
        return { ...prev, error: 'Unable to connect. Please refresh the page.' };
      }

      const newAttempts = prev.reconnectAttempts + 1;
      const delay = getReconnectDelay(newAttempts);

      console.log(`Scheduling reconnect attempt ${newAttempts} in ${delay}ms`);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, delay);

      return { ...prev, reconnectAttempts: newAttempts };
    });
  }, [connect, getReconnectDelay]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    safeSetState({
      socket: null,
      isConnected: false,
      isConnecting: false,
      latency: null,
    });
  }, [safeSetState]);

  // Emit event
  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  }, []);

  // Join a room (for specific token)
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:token', room);
    }
  }, []);

  // Leave a room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:token', room);
    }
  }, []);

  // Subscribe to global feed
  const subscribeToGlobal = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:global');
    }
  }, []);

  // Unsubscribe from global feed
  const unsubscribeFromGlobal = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:global');
    }
  }, []);

  // Auto connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update wallet address in socket auth
  useEffect(() => {
    if (socketRef.current?.connected && walletAddress !== undefined) {
      socketRef.current.auth = { walletAddress };
    }
  }, [walletAddress]);

  const value: SocketContextValue = {
    ...state,
    connect,
    disconnect,
    emit,
    joinRoom,
    leaveRoom,
    subscribeToGlobal,
    unsubscribeFromGlobal,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

/**
 * Hook to use socket context
 */
export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * Hook to get connection status
 */
export const useSocketConnection = () => {
  const { isConnected, isConnecting, error, latency, reconnectAttempts } = useSocket();
  return { isConnected, isConnecting, error, latency, reconnectAttempts };
};

export default SocketContext;
