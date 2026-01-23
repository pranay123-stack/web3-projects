'use client';

import React from 'react';
import { TimeRange } from '@/types';
import { usePoolHistory } from '@/hooks/usePoolData';
import { MultiLineChart, SimpleLineChart } from '@/components/ui/Chart';
import { formatCurrency, formatPercentageUnsigned } from '@/lib/formatters';
import { CHART_COLORS } from '@/lib/constants';

interface FeeAPYChartProps {
  poolId: string;
  timeRange?: TimeRange;
  height?: number;
  showGrid?: boolean;
  className?: string;
  showFees?: boolean;
  showAPY?: boolean;
}

export function FeeAPYChart({
  poolId,
  timeRange = '30d',
  height = 300,
  showGrid = true,
  className,
  showFees = true,
  showAPY = true,
}: FeeAPYChartProps) {
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

  // If only showing one metric, use single line chart
  if (showFees && !showAPY) {
    const chartData = data.map((point) => ({
      date: point.date,
      fees: point.fees,
    }));

    return (
      <SimpleLineChart
        data={chartData}
        dataKey="fees"
        xAxisKey="date"
        height={height}
        color={CHART_COLORS.green}
        showGrid={showGrid}
        valueFormatter={(v) => formatCurrency(v)}
        className={className}
        gradientFill
      />
    );
  }

  if (showAPY && !showFees) {
    const chartData = data.map((point) => ({
      date: point.date,
      apy: point.apy,
    }));

    return (
      <SimpleLineChart
        data={chartData}
        dataKey="apy"
        xAxisKey="date"
        height={height}
        color={CHART_COLORS.purple}
        showGrid={showGrid}
        valueFormatter={(v) => `${v.toFixed(2)}%`}
        className={className}
        gradientFill
      />
    );
  }

  // Show both metrics
  const chartData = data.map((point) => ({
    date: point.date,
    fees: point.fees,
    apy: point.apy,
  }));

  const lines = [
    { dataKey: 'fees', name: 'Daily Fees', color: CHART_COLORS.green },
    { dataKey: 'apy', name: 'APY', color: CHART_COLORS.purple },
  ];

  return (
    <MultiLineChart
      data={chartData}
      lines={lines}
      xAxisKey="date"
      height={height}
      showGrid={showGrid}
      showLegend
      valueFormatter={(v) => (v > 100 ? formatCurrency(v) : `${v.toFixed(2)}%`)}
      className={className}
    />
  );
}

// APY Only Chart for simplicity
interface APYChartProps {
  poolId: string;
  timeRange?: TimeRange;
  height?: number;
  className?: string;
}

export function APYChart({
  poolId,
  timeRange = '30d',
  height = 200,
  className,
}: APYChartProps) {
  return (
    <FeeAPYChart
      poolId={poolId}
      timeRange={timeRange}
      height={height}
      showFees={false}
      showAPY
      className={className}
    />
  );
}

// Protocol-wide Fee Chart
interface ProtocolFeeChartProps {
  timeRange?: TimeRange;
  height?: number;
  className?: string;
}

export function ProtocolFeeChart({
  timeRange = '30d',
  height = 300,
  className,
}: ProtocolFeeChartProps) {
  const [data, setData] = React.useState<Array<{ date: string; fees: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const generateData = () => {
      setIsLoading(true);

      const days = {
        '24h': 24,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 365,
      }[timeRange];

      const baseFees = 500_000; // $500K daily average
      const mockData: Array<{ date: string; fees: number }> = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const randomFactor = 0.6 + Math.random() * 0.8;

        mockData.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          fees: Math.round(baseFees * randomFactor),
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
    <SimpleLineChart
      data={data}
      dataKey="fees"
      xAxisKey="date"
      height={height}
      color={CHART_COLORS.green}
      showGrid
      valueFormatter={(v) => formatCurrency(v)}
      className={className}
      gradientFill
    />
  );
}
