'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Holding, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UseHoldingsOptions {
  address: string;
  enabled?: boolean;
  sortBy?: 'value' | 'pnl' | 'amount' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

interface HoldingsStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  holdingsCount: number;
}

interface HoldingsData {
  holdings: Holding[];
  stats: HoldingsStats;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

/**
 * Fetch user holdings
 */
async function fetchHoldings(
  address: string,
  page = 1,
  pageSize = 20,
  sortBy = 'value',
  sortOrder = 'desc'
): Promise<HoldingsData> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy,
    sortOrder,
  });

  const response = await fetch(`${API_BASE_URL}/users/${address}/holdings?${params}`);

  if (!response.ok) {
    if (response.status === 404) {
      // Return empty holdings for new users
      return {
        holdings: [],
        stats: {
          totalValue: 0,
          totalPnL: 0,
          totalPnLPercentage: 0,
          holdingsCount: 0,
        },
        pagination: {
          total: 0,
          page: 1,
          pageSize,
          hasMore: false,
        },
      };
    }
    throw new Error('Failed to fetch holdings');
  }

  return response.json();
}

/**
 * Fetch holdings for a specific token
 */
async function fetchTokenHolding(
  address: string,
  tokenAddress: string
): Promise<Holding | null> {
  const response = await fetch(
    `${API_BASE_URL}/users/${address}/holdings/${tokenAddress}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch token holding');
  }

  return response.json();
}

/**
 * Hook to fetch and manage user holdings
 */
export function useHoldings({
  address,
  enabled = true,
  sortBy = 'value',
  sortOrder = 'desc',
}: UseHoldingsOptions) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isOwnHoldings = currentUser?.address === address;

  // Holdings query
  const holdingsQuery = useQuery({
    queryKey: ['holdings', address, sortBy, sortOrder],
    queryFn: () => fetchHoldings(address, 1, 20, sortBy, sortOrder),
    enabled: enabled && !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isOwnHoldings ? 60 * 1000 : false, // Refetch own holdings every minute
  });

  // Load more holdings
  const loadMoreHoldings = async (page: number) => {
    const data = await fetchHoldings(address, page, 20, sortBy, sortOrder);
    queryClient.setQueryData(
      ['holdings', address, sortBy, sortOrder],
      (old: HoldingsData | undefined) => {
        if (!old) return data;
        return {
          ...data,
          holdings: [...old.holdings, ...data.holdings],
        };
      }
    );
  };

  // Refresh holdings
  const refreshHoldings = () => {
    queryClient.invalidateQueries({ queryKey: ['holdings', address] });
  };

  // Get holding for specific token
  const getTokenHolding = async (tokenAddress: string) => {
    return fetchTokenHolding(address, tokenAddress);
  };

  // Calculate portfolio breakdown by token
  const portfolioBreakdown = holdingsQuery.data?.holdings.map((holding) => ({
    token: holding.token,
    value: holding.value,
    percentage: holdingsQuery.data?.stats.totalValue
      ? (holding.value / holdingsQuery.data.stats.totalValue) * 100
      : 0,
  })) ?? [];

  // Get top performers
  const topPerformers = [...(holdingsQuery.data?.holdings ?? [])]
    .sort((a, b) => b.pnlPercentage - a.pnlPercentage)
    .slice(0, 5);

  // Get worst performers
  const worstPerformers = [...(holdingsQuery.data?.holdings ?? [])]
    .sort((a, b) => a.pnlPercentage - b.pnlPercentage)
    .slice(0, 5);

  return {
    // Holdings data
    holdings: holdingsQuery.data?.holdings ?? [],
    stats: holdingsQuery.data?.stats ?? {
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      holdingsCount: 0,
    },

    // Pagination
    totalHoldings: holdingsQuery.data?.pagination.total ?? 0,
    hasMore: holdingsQuery.data?.pagination.hasMore ?? false,

    // Loading states
    isLoading: holdingsQuery.isLoading,
    isError: holdingsQuery.isError,
    error: holdingsQuery.error,
    isFetching: holdingsQuery.isFetching,

    // Derived data
    portfolioBreakdown,
    topPerformers,
    worstPerformers,
    isOwnHoldings,

    // Actions
    loadMoreHoldings,
    refreshHoldings,
    getTokenHolding,
  };
}

/**
 * Hook to check if user has a specific token
 */
export function useTokenHolding(userAddress: string, tokenAddress: string) {
  return useQuery({
    queryKey: ['holding', userAddress, tokenAddress],
    queryFn: () => fetchTokenHolding(userAddress, tokenAddress),
    enabled: !!userAddress && !!tokenAddress,
    staleTime: 30 * 1000,
  });
}

export default useHoldings;
