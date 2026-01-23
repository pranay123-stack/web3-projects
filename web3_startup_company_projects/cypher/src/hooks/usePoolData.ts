'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Pool, PoolHistoricalData, FilterConfig, SortConfig, TimeRange } from '@/types';
import { MOCK_POOLS, generatePoolHistory } from '@/lib/mockData';

interface UsePoolDataReturn {
  pools: Pool[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePoolData(): UsePoolDataReturn {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPools(MOCK_POOLS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return {
    pools,
    isLoading,
    error,
    refetch: fetchPools,
  };
}

// Hook for filtered and sorted pools
interface UseFilteredPoolsOptions {
  filter?: FilterConfig;
  sort?: SortConfig;
}

export function useFilteredPools({ filter, sort }: UseFilteredPoolsOptions = {}) {
  const { pools, isLoading, error, refetch } = usePoolData();

  const filteredPools = useMemo(() => {
    let result = [...pools];

    // Apply search filter
    if (filter?.search) {
      const query = filter.search.toLowerCase();
      result = result.filter(
        (pool) =>
          pool.token0.symbol.toLowerCase().includes(query) ||
          pool.token1.symbol.toLowerCase().includes(query) ||
          pool.token0.name.toLowerCase().includes(query) ||
          pool.token1.name.toLowerCase().includes(query)
      );
    }

    // Apply fee tier filter
    if (filter?.feeTier !== undefined) {
      result = result.filter((pool) => pool.feeTier === filter.feeTier);
    }

    // Apply TVL range filter
    if (filter?.minTVL !== undefined) {
      result = result.filter((pool) => pool.tvl >= filter.minTVL!);
    }
    if (filter?.maxTVL !== undefined) {
      result = result.filter((pool) => pool.tvl <= filter.maxTVL!);
    }

    // Apply sorting
    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.key as keyof Pool];
        const bVal = b[sort.key as keyof Pool];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sort.direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [pools, filter, sort]);

  return {
    pools: filteredPools,
    totalPools: pools.length,
    isLoading,
    error,
    refetch,
  };
}

// Hook for a single pool
export function usePool(poolId: string) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPool = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        const foundPool = MOCK_POOLS.find((p) => p.id === poolId);
        if (!foundPool) {
          throw new Error('Pool not found');
        }

        setPool(foundPool);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pool');
      } finally {
        setIsLoading(false);
      }
    };

    if (poolId) {
      fetchPool();
    }
  }, [poolId]);

  return { pool, isLoading, error };
}

// Hook for pool historical data
export function usePoolHistory(poolId: string, timeRange: TimeRange = '30d') {
  const [data, setData] = useState<PoolHistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 400));

        const pool = MOCK_POOLS.find((p) => p.id === poolId);
        if (!pool) {
          throw new Error('Pool not found');
        }

        const days = {
          '24h': 1,
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
          'all': 365,
        }[timeRange];

        const history = generatePoolHistory(pool, days);
        setData(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    if (poolId) {
      fetchHistory();
    }
  }, [poolId, timeRange]);

  return { data, isLoading, error };
}

// Hook for top pools by metric
export function useTopPools(
  metric: 'tvl' | 'volume24h' | 'apy' | 'fees24h',
  limit: number = 5
) {
  const { pools, isLoading, error } = usePoolData();

  const topPools = useMemo(() => {
    return [...pools]
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }, [pools, metric, limit]);

  return { pools: topPools, isLoading, error };
}

// Hook for pool stats aggregation
export function usePoolStats() {
  const { pools, isLoading, error } = usePoolData();

  const stats = useMemo(() => {
    if (pools.length === 0) {
      return {
        totalTVL: 0,
        totalVolume24h: 0,
        totalFees24h: 0,
        avgAPY: 0,
        poolCount: 0,
      };
    }

    const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume24h = pools.reduce((sum, p) => sum + p.volume24h, 0);
    const totalFees24h = pools.reduce((sum, p) => sum + p.fees24h, 0);
    const avgAPY = pools.reduce((sum, p) => sum + p.apy, 0) / pools.length;

    return {
      totalTVL,
      totalVolume24h,
      totalFees24h,
      avgAPY,
      poolCount: pools.length,
    };
  }, [pools]);

  return { stats, isLoading, error };
}
