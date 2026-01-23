'use client';

import React from 'react';
import { TimeRange } from '@/types';
import { usePoolHistory } from '@/hooks/usePoolData';
import { SimpleBarChart } from '@/components/ui/Chart';
import { formatCurrency } from '@/lib/formatters';
import { CHART_COLORS } from '@/lib/constants';

interface VolumeChartProps {
  poolId: string;
  timeRange?: TimeRange;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export function VolumeChart({
  poolId,
  timeRange = '30d',
  height = 300,
  showGrid = true,
  className,
}: VolumeChartProps) {
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
    volume: point.volume,
  }));

  return (
    <SimpleBarChart
      data={chartData}
      dataKey="volume"
      xAxisKey="date"
      height={height}
      color={CHART_COLORS.secondary}
      showGrid={showGrid}
      valueFormatter={(v) => formatCurrency(v)}
      className={className}
    />
  );
}

// Protocol-wide Volume Chart
interface ProtocolVolumeChartProps {
  timeRange?: TimeRange;
  height?: number;
  className?: string;
}

export function ProtocolVolumeChart({
  timeRange = '30d',
  height = 300,
  className,
}: ProtocolVolumeChartProps) {
  const [data, setData] = React.useState<Array<{ date: string; volume: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const generateData = () => {
      setIsLoading(true);

      const days = {
        '24h': 24, // Hourly for 24h
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 365,
      }[timeRange];

      const baseVolume = 250_000_000; // $250M daily average
      const mockData: Array<{ date: string; volume: number }> = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

        // Add some variance - weekends typically have lower volume
        const dayOfWeek = date.getDay();
        const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;
        const randomFactor = 0.5 + Math.random();

        mockData.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          volume: Math.round(baseVolume * weekendFactor * randomFactor),
        });
      }

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
    <SimpleBarChart
      data={data}
      dataKey="volume"
      xAxisKey="date"
      height={height}
      color={CHART_COLORS.secondary}
      showGrid
      valueFormatter={(v) => formatCurrency(v)}
      className={className}
    />
  );
}
