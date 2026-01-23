'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';
import { clsx } from 'clsx';
import { CHART_COLORS } from '@/lib/constants';
import { formatCurrency, formatCompact, formatDate } from '@/lib/formatters';

// Custom Tooltip Component
interface CustomTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => formatCurrency(v),
  labelFormatter = (l) => l,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-cypher-darker border border-cypher-border rounded-lg p-3 shadow-lg">
      <p className="text-sm text-cypher-gray-400 mb-2">{labelFormatter(label)}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-cypher-gray-300">{entry.name}:</span>
          <span className="text-sm font-medium text-white">
            {valueFormatter(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Base Chart Container
interface ChartContainerProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export function ChartContainer({
  children,
  height = 300,
  className,
}: ChartContainerProps) {
  return (
    <div className={clsx('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

// Line Chart Component
interface LineChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
  gradientFill?: boolean;
}

export function SimpleLineChart({
  data,
  dataKey,
  xAxisKey = 'date',
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  valueFormatter = (v) => formatCurrency(v),
  className,
  gradientFill = true,
}: LineChartProps) {
  const gradientId = `gradient-${dataKey}`;

  return (
    <ChartContainer height={height} className={className}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e1e2e"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          tickFormatter={(value) =>
            typeof value === 'number' ? formatDate(value) : value
          }
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          tickFormatter={(value) => formatCompact(value)}
          width={60}
        />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip valueFormatter={valueFormatter} />}
            cursor={{ stroke: '#1e1e2e' }}
          />
        )}
        {showLegend && <Legend />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={gradientFill ? `url(#${gradientId})` : 'transparent'}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// Multi-Line Chart Component
interface MultiLineChartProps {
  data: Array<Record<string, unknown>>;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function MultiLineChart({
  data,
  lines,
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  valueFormatter = (v) => formatCurrency(v),
  className,
}: MultiLineChartProps) {
  return (
    <ChartContainer height={height} className={className}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e1e2e"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          tickFormatter={(value) => formatCompact(value)}
          width={60}
        />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip valueFormatter={valueFormatter} />}
            cursor={{ stroke: '#1e1e2e' }}
          />
        )}
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: line.color, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function SimpleBarChart({
  data,
  dataKey,
  xAxisKey = 'date',
  height = 300,
  color = CHART_COLORS.primary,
  showGrid = true,
  showTooltip = true,
  valueFormatter = (v) => formatCurrency(v),
  className,
}: BarChartProps) {
  return (
    <ChartContainer height={height} className={className}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e1e2e"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          tickFormatter={(value) => formatCompact(value)}
          width={60}
        />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip valueFormatter={valueFormatter} />}
            cursor={{ fill: 'rgba(247, 201, 72, 0.1)' }}
          />
        )}
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ChartContainer>
  );
}

// Mini Sparkline Chart
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = CHART_COLORS.primary,
  className,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = color || (isPositive ? CHART_COLORS.green : CHART_COLORS.red);

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
