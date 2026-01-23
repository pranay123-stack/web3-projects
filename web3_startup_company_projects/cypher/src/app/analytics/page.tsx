'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
} from 'lucide-react';
import { TimeRange, SwapEvent } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Button, ButtonGroup, ToggleButton } from '@/components/ui/Button';
import { Table, Badge } from '@/components/ui/Table';
import { SubHeader } from '@/components/layout/Header';
import { ProtocolTVLChart } from '@/components/charts/TVLChart';
import { ProtocolVolumeChart } from '@/components/charts/VolumeChart';
import { ProtocolFeeChart } from '@/components/charts/FeeAPYChart';
import { TokenPair } from '@/components/pools/PoolCard';
import { useTopPools } from '@/hooks/usePoolData';
import {
  formatCurrency,
  formatAddress,
  formatRelativeTime,
  formatFeeTier,
  formatPercentageUnsigned,
} from '@/lib/formatters';
import {
  MOCK_PROTOCOL_STATS,
  MOCK_FEE_DISTRIBUTION,
  generateMockSwaps,
} from '@/lib/mockData';
import { clsx } from 'clsx';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { pools: topPoolsByTVL } = useTopPools('tvl', 10);
  const { pools: topPoolsByAPY } = useTopPools('apy', 5);

  // Generate mock swaps
  const recentSwaps = useMemo(() => generateMockSwaps(15), []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <SubHeader
        title="Analytics"
        description="Deep dive into Cypher Protocol metrics and performance"
        action={
          <ButtonGroup>
            <ToggleButton
              active={timeRange === '7d'}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </ToggleButton>
            <ToggleButton
              active={timeRange === '30d'}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </ToggleButton>
            <ToggleButton
              active={timeRange === '90d'}
              onClick={() => setTimeRange('90d')}
            >
              90D
            </ToggleButton>
            <ToggleButton
              active={timeRange === '1y'}
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </ToggleButton>
          </ButtonGroup>
        }
      />

      {/* Protocol Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Value Locked"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalTVL)}
          change="+5.23%"
          changeType="positive"
          icon={<Droplets className="w-5 h-5" />}
        />
        <StatCard
          title="7d Volume"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalVolume7d)}
          change="+18.7%"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="7d Fees"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalFees7d)}
          change="+15.2%"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Total Positions"
          value={MOCK_PROTOCOL_STATS.totalPositions.toLocaleString()}
          change="+234 this week"
          changeType="positive"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>TVL Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolTVLChart timeRange={timeRange} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-cypher-yellow" />
              Fee Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_FEE_DISTRIBUTION.map((tier) => (
                <div key={tier.feeTier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cypher-gray-400">
                      {formatFeeTier(tier.feeTier)} ({tier.poolCount} pools)
                    </span>
                    <span className="text-white">
                      {formatPercentageUnsigned(tier.percentage)}
                    </span>
                  </div>
                  <div className="h-2 bg-cypher-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cypher-yellow rounded-full transition-all"
                      style={{ width: `${tier.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-cypher-gray-500 mt-1">
                    TVL: {formatCurrency(tier.tvl)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume and Fees Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Trading Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolVolumeChart timeRange={timeRange} height={250} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Fees Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolFeeChart timeRange={timeRange} height={250} />
          </CardContent>
        </Card>
      </div>

      {/* Top Pools and Recent Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pools by TVL */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pools by TVL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cypher-border">
                    <th className="text-left text-xs text-cypher-gray-400 py-2">
                      Pool
                    </th>
                    <th className="text-right text-xs text-cypher-gray-400 py-2">
                      TVL
                    </th>
                    <th className="text-right text-xs text-cypher-gray-400 py-2">
                      24h Volume
                    </th>
                    <th className="text-right text-xs text-cypher-gray-400 py-2">
                      APY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topPoolsByTVL.slice(0, 8).map((pool, index) => (
                    <tr
                      key={pool.id}
                      className="border-b border-cypher-border/50 hover:bg-cypher-card/50 cursor-pointer"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-cypher-gray-500 w-4">
                            {index + 1}
                          </span>
                          <TokenPair
                            token0Symbol={pool.token0.symbol}
                            token1Symbol={pool.token1.symbol}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {pool.token0.symbol}/{pool.token1.symbol}
                            </p>
                            <Badge variant="default" className="text-[10px]">
                              {formatFeeTier(pool.feeTier)}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-sm text-white">
                        {formatCurrency(pool.tvl)}
                      </td>
                      <td className="text-right text-sm text-cypher-gray-300">
                        {formatCurrency(pool.volume24h)}
                      </td>
                      <td className="text-right text-sm text-cypher-green">
                        {pool.apy.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Large Swaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cypher-yellow" />
              Recent Large Swaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentSwaps.slice(0, 10).map((swap) => (
                <SwapRow key={swap.id} swap={swap} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pools by APY */}
      <Card>
        <CardHeader>
          <CardTitle>Highest Yielding Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topPoolsByAPY.map((pool, index) => (
              <Card
                key={pool.id}
                padding="sm"
                hover
                className="relative overflow-hidden"
              >
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={index === 0 ? 'warning' : 'default'}
                    className="text-xs"
                  >
                    #{index + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <TokenPair
                    token0Symbol={pool.token0.symbol}
                    token1Symbol={pool.token1.symbol}
                    size="sm"
                  />
                  <p className="text-sm font-medium text-white">
                    {pool.token0.symbol}/{pool.token1.symbol}
                  </p>
                </div>
                <p className="text-2xl font-bold text-cypher-green mb-1">
                  {pool.apy.toFixed(2)}%
                </p>
                <p className="text-xs text-cypher-gray-400">APY</p>
                <div className="mt-3 pt-3 border-t border-cypher-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-cypher-gray-400">TVL</span>
                    <span className="text-white">{formatCurrency(pool.tvl)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Swap Row Component
function SwapRow({ swap }: { swap: SwapEvent }) {
  const isBuy = swap.amount0 < 0;

  return (
    <div className="flex items-center justify-between p-3 bg-cypher-darker rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isBuy ? 'bg-cypher-green/10' : 'bg-cypher-red/10'
          )}
        >
          {isBuy ? (
            <ArrowUpRight className="w-4 h-4 text-cypher-green" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-cypher-red" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">
              {isBuy ? 'Buy' : 'Sell'} {swap.pool.token0.symbol}
            </p>
            <Badge variant="default" className="text-[10px]">
              {swap.pool.token0.symbol}/{swap.pool.token1.symbol}
            </Badge>
          </div>
          <p className="text-xs text-cypher-gray-400">
            {formatAddress(swap.sender)} - {formatRelativeTime(swap.timestamp)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white">
          {formatCurrency(swap.amountUSD)}
        </p>
      </div>
    </div>
  );
}
