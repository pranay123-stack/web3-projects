'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export type ActivityType = 'new_token' | 'buy' | 'sell' | 'graduated';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    image: string;
  };
  user?: {
    address: string;
    avatar?: string;
  };
  amount?: number;
  price?: number;
  solAmount?: number;
  marketCap?: number;
}

interface UseLiveFeedOptions {
  maxItems?: number;
  types?: ActivityType[];
  autoConnect?: boolean;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

function generateMockActivity(): Activity {
  const types: ActivityType[] = ['new_token', 'buy', 'sell', 'graduated'];
  const type = types[Math.floor(Math.random() * types.length)];

  const mockTokens = [
    { name: 'Pepe 2.0', symbol: 'PEPE2' },
    { name: 'Moon Dog', symbol: 'MDOG' },
    { name: 'Solana Cat', symbol: 'SCAT' },
    { name: 'Based Frog', symbol: 'BFROG' },
    { name: 'Degen Ape', symbol: 'DAPE' },
    { name: 'Turbo Bull', symbol: 'TBULL' },
    { name: 'Diamond Paws', symbol: 'DPAW' },
    { name: 'Rocket Shib', symbol: 'RSHIB' },
  ];

  const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];

  const baseActivity = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    token: {
      address: Math.random().toString(36).substring(2, 14),
      name: token.name,
      symbol: token.symbol,
      image: `https://picsum.photos/seed/${token.symbol}${Date.now()}/100`,
    },
  };

  if (type === 'new_token') {
    return {
      ...baseActivity,
      user: {
        address: Math.random().toString(36).substring(2, 10),
        avatar: `https://picsum.photos/seed/user${Date.now()}/50`,
      },
      marketCap: Math.random() * 10000 + 1000,
    };
  }

  if (type === 'graduated') {
    return {
      ...baseActivity,
      marketCap: 69000 + Math.random() * 10000,
    };
  }

  // buy or sell
  return {
    ...baseActivity,
    user: {
      address: Math.random().toString(36).substring(2, 10),
      avatar: `https://picsum.photos/seed/trader${Date.now()}/50`,
    },
    amount: Math.random() * 10000000,
    price: Math.random() * 0.001,
    solAmount: Math.random() * 50 + 0.1,
  };
}

export function useLiveFeed(options: UseLiveFeedOptions = {}) {
  const { maxItems = 50, types, autoConnect = true } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addActivity = useCallback((activity: Activity) => {
    if (types && !types.includes(activity.type)) return;

    setActivities((prev) => {
      const newActivities = [activity, ...prev];
      return newActivities.slice(0, maxItems);
    });
  }, [maxItems, types]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Live feed connected');
      setIsConnected(true);
      socket.emit('subscribe', { channel: 'live_feed' });
    });

    socket.on('activity', (activity: Activity) => {
      if (!isPaused) {
        addActivity(activity);
      }
    });

    socket.on('disconnect', () => {
      console.log('Live feed disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.log('Live feed connection error, using mock data', error.message);
      setIsConnected(false);

      // Fallback to mock data
      if (!mockIntervalRef.current) {
        mockIntervalRef.current = setInterval(() => {
          if (!isPaused) {
            addActivity(generateMockActivity());
          }
        }, 2000 + Math.random() * 3000);
      }
    });

    socketRef.current = socket;
  }, [addActivity, isPaused]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const clear = useCallback(() => {
    setActivities([]);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();

      // Start with mock data initially
      const initialActivities = Array.from({ length: 10 }, () => generateMockActivity());
      setActivities(initialActivities);

      // Start mock interval for development
      mockIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          addActivity(generateMockActivity());
        }
      }, 2000 + Math.random() * 3000);
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, isPaused, addActivity]);

  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'new_token':
        return 'rocket';
      case 'buy':
        return 'arrow-up';
      case 'sell':
        return 'arrow-down';
      case 'graduated':
        return 'graduation-cap';
      default:
        return 'activity';
    }
  };

  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case 'new_token':
        return 'text-neon-purple';
      case 'buy':
        return 'text-neon-green';
      case 'sell':
        return 'text-red-500';
      case 'graduated':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return {
    activities,
    isConnected,
    isPaused,
    connect,
    disconnect,
    pause,
    resume,
    clear,
    getActivityIcon,
    getActivityColor,
  };
}

export default useLiveFeed;
