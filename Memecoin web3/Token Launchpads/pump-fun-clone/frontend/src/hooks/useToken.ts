'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TokenDetails, PriceDataPoint, Holder, Comment, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseTokenOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

interface UseTokenReturn {
  token: TokenDetails | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch token details from API
 */
async function fetchTokenDetails(mint: string): Promise<TokenDetails> {
  const response = await fetch(`${API_BASE_URL}/api/tokens/${mint}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  const data: ApiResponse<TokenDetails> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to fetch token data');
  }

  return data.data;
}

/**
 * Hook to fetch and subscribe to token data
 */
export function useToken(mint: string, options: UseTokenOptions = {}): UseTokenReturn {
  const { enabled = true, refetchInterval = false } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const queryKey = ['token', mint];

  const {
    data: token,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchTokenDetails(mint),
    enabled: enabled && !!mint,
    refetchInterval,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!enabled || !mint) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Subscribe to token updates
      socket.emit('subscribe:token', mint);
    });

    socket.on('token:update', (data: Partial<TokenDetails>) => {
      // Update token data in cache
      queryClient.setQueryData<TokenDetails>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...data };
      });
    });

    socket.on('token:price', (data: { price: number; marketCap: number }) => {
      // Update price in cache
      queryClient.setQueryData<TokenDetails>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          price: data.price,
          marketCap: data.marketCap,
        };
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from token updates');
    });

    return () => {
      socket.emit('unsubscribe:token', mint);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mint, enabled, queryClient, queryKey]);

  const refetchCallback = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    token,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: refetchCallback,
  };
}

/**
 * Hook to fetch price chart data
 */
export function useTokenPriceChart(
  mint: string,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '5m',
  options: UseTokenOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['token-chart', mint, interval],
    queryFn: async (): Promise<PriceDataPoint[]> => {
      const response = await fetch(
        `${API_BASE_URL}/api/tokens/${mint}/chart?interval=${interval}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data: ApiResponse<PriceDataPoint[]> = await response.json();
      return data.data || [];
    },
    enabled: enabled && !!mint,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch token holders
 */
export function useTokenHolders(mint: string, options: UseTokenOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['token-holders', mint],
    queryFn: async (): Promise<Holder[]> => {
      const response = await fetch(`${API_BASE_URL}/api/tokens/${mint}/holders`);

      if (!response.ok) {
        throw new Error('Failed to fetch holders');
      }

      const data: ApiResponse<Holder[]> = await response.json();
      return data.data || [];
    },
    enabled: enabled && !!mint,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });
}

/**
 * Hook to fetch token comments
 */
export function useTokenComments(mint: string, options: UseTokenOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const queryKey = ['token-comments', mint];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Comment[]> => {
      const response = await fetch(`${API_BASE_URL}/api/tokens/${mint}/comments`);

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data: ApiResponse<Comment[]> = await response.json();
      return data.data || [];
    },
    enabled: enabled && !!mint,
    staleTime: 30000,
  });

  // WebSocket for real-time comments
  useEffect(() => {
    if (!enabled || !mint) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe:comments', mint);
    });

    socket.on('comment:new', (comment: Comment) => {
      queryClient.setQueryData<Comment[]>(queryKey, (oldData) => {
        if (!oldData) return [comment];
        return [comment, ...oldData];
      });
    });

    return () => {
      socket.emit('unsubscribe:comments', mint);
      socket.disconnect();
    };
  }, [mint, enabled, queryClient, queryKey]);

  return query;
}

/**
 * Hook to post a comment
 */
export function usePostComment() {
  const queryClient = useQueryClient();

  const postComment = async (mint: string, content: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/api/tokens/${mint}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }

    const data: ApiResponse<Comment> = await response.json();

    // Optimistically update the cache
    if (data.data) {
      queryClient.setQueryData<Comment[]>(['token-comments', mint], (oldData) => {
        if (!oldData) return [data.data!];
        return [data.data!, ...oldData];
      });
    }

    return data.data!;
  };

  return { postComment };
}

export default useToken;
