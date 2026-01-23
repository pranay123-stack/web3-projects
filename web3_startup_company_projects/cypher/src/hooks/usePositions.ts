'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Position } from '@/types';
import { MOCK_POSITIONS } from '@/lib/mockData';
import { useWallet } from './useWallet';

interface UsePositionsReturn {
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePositions(): UsePositionsReturn {
  const { address, isConnected } = useWallet();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!isConnected || !address) {
      setPositions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return mock positions - in production, filter by owner
      setPositions(MOCK_POSITIONS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    isLoading,
    error,
    refetch: fetchPositions,
  };
}

// Hook for a single position
export function usePosition(positionId: string) {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosition = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        const foundPosition = MOCK_POSITIONS.find((p) => p.id === positionId);
        if (!foundPosition) {
          throw new Error('Position not found');
        }

        setPosition(foundPosition);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch position');
      } finally {
        setIsLoading(false);
      }
    };

    if (positionId) {
      fetchPosition();
    }
  }, [positionId]);

  return { position, isLoading, error };
}

// Hook for portfolio summary
export function usePortfolioSummary() {
  const { positions, isLoading, error } = usePositions();

  const summary = useMemo(() => {
    if (positions.length === 0) {
      return {
        totalValue: 0,
        totalFeesEarned: 0,
        totalImpermanentLoss: 0,
        totalPnL: 0,
        positionCount: 0,
        inRangeCount: 0,
        outOfRangeCount: 0,
      };
    }

    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    const totalFeesEarned = positions.reduce((sum, p) => sum + p.feesEarnedUSD, 0);
    const totalImpermanentLoss = positions.reduce(
      (sum, p) => sum + p.impermanentLossUSD,
      0
    );
    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
    const inRangeCount = positions.filter((p) => p.inRange).length;

    return {
      totalValue,
      totalFeesEarned,
      totalImpermanentLoss,
      totalPnL,
      positionCount: positions.length,
      inRangeCount,
      outOfRangeCount: positions.length - inRangeCount,
    };
  }, [positions]);

  return { summary, isLoading, error };
}

// Hook for positions by pool
export function usePositionsByPool(poolId: string) {
  const { positions, isLoading, error } = usePositions();

  const poolPositions = useMemo(() => {
    return positions.filter((p) => p.poolId === poolId);
  }, [positions, poolId]);

  return { positions: poolPositions, isLoading, error };
}

// Hook for position performance metrics
export function usePositionPerformance(positionId: string) {
  const { position, isLoading, error } = usePosition(positionId);

  const performance = useMemo(() => {
    if (!position) {
      return null;
    }

    const holdValue =
      position.token0Amount * position.currentPrice + position.token1Amount;
    const lpValue = position.valueUSD;
    const feeValue = position.feesEarnedUSD;
    const ilValue = position.impermanentLossUSD;

    // Time-weighted calculations
    const daysSinceCreation = Math.max(
      1,
      (Date.now() - position.createdAt) / (24 * 60 * 60 * 1000)
    );
    const annualizedAPY =
      ((feeValue / position.valueUSD) * 365) / daysSinceCreation * 100;

    return {
      holdValue,
      lpValue,
      feeValue,
      ilValue,
      netPnL: lpValue + feeValue - holdValue,
      netPnLPercentage: ((lpValue + feeValue - holdValue) / holdValue) * 100,
      annualizedAPY,
      daysSinceCreation: Math.round(daysSinceCreation),
    };
  }, [position]);

  return { performance, position, isLoading, error };
}
