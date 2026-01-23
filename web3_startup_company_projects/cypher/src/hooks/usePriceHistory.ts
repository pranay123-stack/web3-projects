'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChartDataPoint, TimeRange } from '@/types';
import { generateHistoricalData } from '@/lib/calculations';

interface UsePriceHistoryReturn {
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  currentPrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

// Token price data (mock)
const TOKEN_PRICES: Record<string, number> = {
  ETH: 2456.78,
  WETH: 2456.78,
  USDC: 1.0,
  USDT: 1.0,
  WBTC: 42345.67,
  DAI: 1.0,
  LINK: 15.23,
  UNI: 8.76,
  AAVE: 101.23,
  CRV: 0.58,
  MKR: 1502.34,
};

export function usePriceHistory(
  tokenSymbol: string,
  timeRange: TimeRange = '30d'
): UsePriceHistoryReturn {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        const currentPrice = TOKEN_PRICES[tokenSymbol] || 1;
        const days = {
          '24h': 1,
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
          'all': 365,
        }[timeRange];

        // Generate mock historical data
        const volatility = tokenSymbol === 'USDC' || tokenSymbol === 'USDT' || tokenSymbol === 'DAI'
          ? 0.001
          : 0.03;
        const rawData = generateHistoricalData(currentPrice * 0.9, days, volatility, 0.002);

        const chartData: ChartDataPoint[] = rawData.map((point) => ({
          timestamp: point.timestamp,
          date: new Date(point.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          value: point.value,
        }));

        // Ensure last point is current price
        if (chartData.length > 0) {
          chartData[chartData.length - 1].value = currentPrice;
        }

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price history');
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenSymbol) {
      fetchPriceHistory();
    }
  }, [tokenSymbol, timeRange]);

  const { currentPrice, priceChange, priceChangePercentage } = useMemo(() => {
    if (data.length < 2) {
      return { currentPrice: 0, priceChange: 0, priceChangePercentage: 0 };
    }

    const current = data[data.length - 1].value;
    const previous = data[0].value;
    const change = current - previous;
    const changePercentage = (change / previous) * 100;

    return {
      currentPrice: current,
      priceChange: change,
      priceChangePercentage: changePercentage,
    };
  }, [data]);

  return {
    data,
    isLoading,
    error,
    currentPrice,
    priceChange,
    priceChangePercentage,
  };
}

// Hook for getting current token price
export function useTokenPrice(tokenSymbol: string) {
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setPrice(TOKEN_PRICES[tokenSymbol] || 0);
      setIsLoading(false);
    };

    fetchPrice();
  }, [tokenSymbol]);

  return { price, isLoading };
}

// Hook for multiple token prices
export function useTokenPrices(tokenSymbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const priceMap: Record<string, number> = {};
      tokenSymbols.forEach((symbol) => {
        priceMap[symbol] = TOKEN_PRICES[symbol] || 0;
      });

      setPrices(priceMap);
      setIsLoading(false);
    };

    if (tokenSymbols.length > 0) {
      fetchPrices();
    }
  }, [tokenSymbols.join(',')]);

  return { prices, isLoading };
}

// Hook for exchange rate between two tokens
export function useExchangeRate(token0Symbol: string, token1Symbol: string) {
  const { prices, isLoading } = useTokenPrices([token0Symbol, token1Symbol]);

  const rate = useMemo(() => {
    const price0 = prices[token0Symbol] || 1;
    const price1 = prices[token1Symbol] || 1;
    return price0 / price1;
  }, [prices, token0Symbol, token1Symbol]);

  return { rate, isLoading };
}
