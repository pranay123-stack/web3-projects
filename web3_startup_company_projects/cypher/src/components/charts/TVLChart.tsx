'use client';

import React from 'react';
import { TimeRange } from '@/types';
import { usePoolHistory } from '@/hooks/usePoolData';
import { SimpleLineChart } from '@/components/ui/Chart';
import { formatCurrency } from '@/lib/formatters';
import { CHART_COLORS } from '@/lib/constants';

interface TVLChartProps {
  poolId: string;
  timeRange?: TimeRange;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export function TVLChart({
  poolId,
  timeRange = '30d',
  height = 300,
  showGrid = true,
  className,
}: TVLChartProps) {
  const { data, isLoading, error } = usePoolHistory(poolId, timeRange);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-cypher-darker/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-cypher-gray-400">
          <div className="w-5 h-5 border-2 border-cypher-yellow/30 border-t-cypher-yellow rounded-full animate-spin" />
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-cypher-darker/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-cypher-red">Failed to load chart data</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: point.date,
    tvl: point.tvl,
  }));

  return (
    <SimpleLineChart
      data={chartData}
      dataKey="tvl"
      xAxisKey="date"
      height={height}
      color={CHART_COLORS.primary}
      showGrid={showGrid}
      valueFormatter={(v) => formatCurrency(v)}
      className={className}
      gradientFill
    />
  );
}

// Protocol-wide TVL Chart
interface ProtocolTVLChartProps {
  timeRange?: TimeRange;
  height?: number;
  className?: string;
}

export function ProtocolTVLChart({
  timeRange = '30d',
  height = 300,
  className,
}: ProtocolTVLChartProps) {
  // Generate mock protocol-wide TVL data
  const [data, setData] = React.useState<Array<{ date: string; tvl: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const generateData = () => {
      setIsLoading(true);

      const days = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 365,
      }[timeRange];

      const baseValue = 800_000_000; // $800M
      const mockData: Array<{ date: string; tvl: number }> = [];
      let currentValue = baseValue * 0.85;

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const randomChange = (Math.random() - 0.45) * 0.03;
        currentValue = currentValue * (1 + randomChange);

        mockData.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          tvl: Math.round(currentValue),
        });
      }

      // Ensure last point is close to target
      mockData[mockData.length - 1].tvl = baseValue;

      setData(mockData);
      setIsLoading(false);
    };

    const timeout = setTimeout(generateData, 300);
    return () => clearTimeout(timeout);
  }, [timeRange]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-cypher-darker/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-cypher-gray-400">
          <div className="w-5 h-5 border-2 border-cypher-yellow/30 border-t-cypher-yellow rounded-full animate-spin" />
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  return (
    <SimpleLineChart
      data={data}
      dataKey="tvl"
      xAxisKey="date"
      height={height}
      color={CHART_COLORS.primary}
      showGrid
      valueFormatter={(v) => formatCurrency(v)}
      className={className}
      gradientFill
    />
  );
}
