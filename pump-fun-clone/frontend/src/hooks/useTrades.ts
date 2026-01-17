'use client';

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TradeWithTrader, ApiResponse, PaginatedResponse, NewTradeEvent } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseTradesOptions {
  enabled?: boolean;
  limit?: number;
  realtime?: boolean;
}

interface UseTradesReturn {
  trades: TradeWithTrader[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  newTradesCount: number;
  clearNewTrades: () => void;
}

/**
 * Fetch trades from API with pagination
 */
async function fetchTrades(
  mint: string,
  page: number,
  limit: number
): Promise<PaginatedResponse<TradeWithTrader>> {
  const response = await fetch(
    `${API_BASE_URL}/api/trades?mint=${mint}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }

  const data: ApiResponse<PaginatedResponse<TradeWithTrader>> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch trades');
  }

  return data.data;
}

/**
 * Hook to fetch and subscribe to trade history with real-time updates
 */
export function useTrades(mint: string, options: UseTradesOptions = {}): UseTradesReturn {
  const { enabled = true, limit = 20, realtime = true } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [newTradesCount, setNewTradesCount] = useState(0);

  const queryKey = ['trades', mint];

  // Infinite query for paginated trades
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchTrades(mint, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: enabled && !!mint,
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
  });

  // WebSocket subscription for real-time trades
  useEffect(() => {
    if (!enabled || !mint || !realtime) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to trades WebSocket');
      socket.emit('subscribe:trades', mint);
    });

    socket.on('trade:new', (eventData: NewTradeEvent) => {
      if (eventData.mint !== mint) return;

      const newTrade = eventData.trade;

      // Add new trade to the beginning of the first page
      queryClient.setQueryData(queryKey, (oldData: typeof data) => {
        if (!oldData) return oldData;

        const newPages = [...oldData.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            items: [newTrade, ...newPages[0].items],
            total: newPages[0].total + 1,
          };
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });

      // Increment new trades counter
      setNewTradesCount((prev) => prev + 1);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from trades WebSocket');
    });

    socket.on('error', (err: Error) => {
      console.error('WebSocket error:', err);
    });

    return () => {
      socket.emit('unsubscribe:trades', mint);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mint, enabled, realtime, queryClient, queryKey]);

  // Clear new trades count
  const clearNewTrades = useCallback(() => {
    setNewTradesCount(0);
  }, []);

  // Flatten paginated data
  const trades = data?.pages.flatMap((page) => page.items) ?? [];

  const refetchCallback = useCallback(() => {
    refetch();
    setNewTradesCount(0);
  }, [refetch]);

  const fetchNextPageCallback = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    trades,
    isLoading,
    isError,
    error: error as Error | null,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNextPageCallback,
    refetch: refetchCallback,
    newTradesCount,
    clearNewTrades,
  };
}

/**
 * Hook to fetch recent trades for a token (non-paginated, for quick display)
 */
export function useRecentTrades(mint: string, limit: number = 10, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['recent-trades', mint, limit],
    queryFn: async (): Promise<TradeWithTrader[]> => {
      const response = await fetch(
        `${API_BASE_URL}/api/trades?mint=${mint}&page=1&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent trades');
      }

      const data: ApiResponse<PaginatedResponse<TradeWithTrader>> = await response.json();
      return data.data?.items ?? [];
    },
    enabled: enabled && !!mint,
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

/**
 * Hook to fetch user's trades for a specific token
 */
export function useUserTrades(
  mint: string,
  userAddress: string | undefined,
  options: UseTradesOptions = {}
) {
  const { enabled = true, limit = 50 } = options;

  return useQuery({
    queryKey: ['user-trades', mint, userAddress],
    queryFn: async (): Promise<TradeWithTrader[]> => {
      const response = await fetch(
        `${API_BASE_URL}/api/trades?mint=${mint}&user=${userAddress}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user trades');
      }

      const data: ApiResponse<PaginatedResponse<TradeWithTrader>> = await response.json();
      return data.data?.items ?? [];
    },
    enabled: enabled && !!mint && !!userAddress,
    staleTime: 10000,
  });
}

/**
 * Hook to get trade statistics
 */
export function useTradeStats(mint: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['trade-stats', mint],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/trades/stats?mint=${mint}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trade stats');
      }

      const data: ApiResponse<{
        totalTrades: number;
        totalVolume: number;
        buyCount: number;
        sellCount: number;
        avgTradeSize: number;
        largestTrade: TradeWithTrader;
      }> = await response.json();

      return data.data;
    },
    enabled: enabled && !!mint,
    staleTime: 30000,
  });
}

export default useTrades;
