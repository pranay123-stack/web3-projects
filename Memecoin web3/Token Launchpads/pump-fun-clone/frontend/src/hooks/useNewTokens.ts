'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface NewToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  creator: string;
  creatorAvatar?: string;
  createdAt: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
  replies: number;
}

interface NewTokensResponse {
  tokens: NewToken[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface UseNewTokensOptions {
  limit?: number;
  page?: number;
  filter?: 'all' | 'graduating' | 'graduated';
  sort?: 'newest' | 'marketCap' | 'volume' | 'holders';
  realtime?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

async function fetchNewTokens(options: UseNewTokensOptions): Promise<NewTokensResponse> {
  const { limit = 12, page = 1, filter = 'all', sort = 'newest' } = options;

  try {
    const response = await axios.get(`${API_BASE_URL}/api/tokens/new`, {
      params: { limit, page, filter, sort },
    });
    return response.data;
  } catch (error) {
    // Return mock data for development
    return {
      tokens: generateMockNewTokens(limit, page),
      total: 100,
      page,
      hasMore: page < 10,
    };
  }
}

function generateMockNewTokens(count: number, page: number): NewToken[] {
  const mockNames = [
    { name: 'Baby Shark', symbol: 'BSHARK' },
    { name: 'Solana Frog', symbol: 'SFROG' },
    { name: 'Moon Doge', symbol: 'MDOGE' },
    { name: 'Crypto Cat', symbol: 'CCAT' },
    { name: 'Pixel Punk', symbol: 'PPUNK' },
    { name: 'Meta Ape', symbol: 'MAPE' },
    { name: 'Diamond Hands', symbol: 'DHAND' },
    { name: 'Rocket Fuel', symbol: 'RFUEL' },
    { name: 'Neon Tiger', symbol: 'NTIGER' },
    { name: 'Cyber Wolf', symbol: 'CWOLF' },
    { name: 'Astro Bear', symbol: 'ABEAR' },
    { name: 'Turbo Coin', symbol: 'TURBO' },
  ];

  const offset = (page - 1) * count;

  return Array.from({ length: count }, (_, i) => {
    const index = (offset + i) % mockNames.length;
    const mockToken = mockNames[index];
    const randomMarketCap = Math.random() * 500000 + 5000;
    const randomPrice = Math.random() * 0.001;
    const randomChange = (Math.random() - 0.4) * 80;
    const bondingProgress = Math.random() * 100;
    const createdMinutesAgo = Math.floor(Math.random() * 120) + i * 5;

    return {
      id: `new-token-${offset + i}`,
      address: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      name: mockToken.name,
      symbol: mockToken.symbol,
      image: `https://picsum.photos/seed/${mockToken.symbol}${offset + i}/200`,
      description: `${mockToken.name} - The next 100x gem!`,
      creator: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      creatorAvatar: `https://picsum.photos/seed/creator${offset + i}/100`,
      createdAt: new Date(Date.now() - createdMinutesAgo * 60 * 1000).toISOString(),
      marketCap: randomMarketCap,
      price: randomPrice,
      priceChange24h: randomChange,
      volume24h: randomMarketCap * (0.05 + Math.random() * 0.3),
      holders: Math.floor(Math.random() * 1000) + 10,
      bondingCurveProgress: bondingProgress,
      isGraduated: bondingProgress >= 100,
      replies: Math.floor(Math.random() * 100),
    };
  });
}

export function useNewTokens(options: UseNewTokensOptions = {}) {
  const { limit = 12, page = 1, filter = 'all', sort = 'newest', realtime = true } = options;
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newTokenAlert, setNewTokenAlert] = useState<NewToken | null>(null);

  const query = useQuery({
    queryKey: ['newTokens', limit, page, filter, sort],
    queryFn: () => fetchNewTokens({ limit, page, filter, sort }),
    refetchInterval: realtime ? 60000 : false,
    staleTime: 30000,
  });

  const handleNewToken = useCallback((token: NewToken) => {
    setNewTokenAlert(token);

    // Update cache with new token
    queryClient.setQueryData(
      ['newTokens', limit, 1, filter, sort],
      (oldData: NewTokensResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tokens: [token, ...oldData.tokens.slice(0, -1)],
          total: oldData.total + 1,
        };
      }
    );

    // Clear alert after 5 seconds
    setTimeout(() => setNewTokenAlert(null), 5000);
  }, [queryClient, limit, filter, sort]);

  useEffect(() => {
    if (!realtime) return;

    const newSocket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to token updates');
      newSocket.emit('subscribe', { channel: 'new_tokens' });
    });

    newSocket.on('new_token', handleNewToken);

    newSocket.on('disconnect', () => {
      console.log('Disconnected from token updates');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new_token', handleNewToken);
      newSocket.disconnect();
    };
  }, [realtime, handleNewToken]);

  const clearNewTokenAlert = useCallback(() => {
    setNewTokenAlert(null);
  }, []);

  return {
    ...query,
    newTokenAlert,
    clearNewTokenAlert,
    isConnected: socket?.connected ?? false,
  };
}

export default useNewTokens;
