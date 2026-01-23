'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Droplets,
  DollarSign,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Pool, TimeRange } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui/Card';
import { Button, ButtonGroup, ToggleButton } from '@/components/ui/Button';
import { PoolList } from '@/components/pools/PoolList';
import { PoolDetails } from '@/components/pools/PoolDetails';
import { PoolCard } from '@/components/pools/PoolCard';
import { ProtocolTVLChart } from '@/components/charts/TVLChart';
import { ProtocolVolumeChart } from '@/components/charts/VolumeChart';
import { usePoolData, useTopPools, usePoolStats } from '@/hooks/usePoolData';
import { formatCurrency, formatCompact } from '@/lib/formatters';
import { MOCK_PROTOCOL_STATS } from '@/lib/mockData';

export default function DashboardPage() {
  const { pools, isLoading } = usePoolData();
  const { pools: topPoolsByTVL } = useTopPools('tvl', 5);
  const { pools: topPoolsByVolume } = useTopPools('volume24h', 5);
  const { stats } = usePoolStats();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-cypher-gray-400">
          Overview of Cypher Protocol metrics and liquidity pools
        </p>
      </div>

      {/* Protocol Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Value Locked"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalTVL)}
          change="+5.23% (24h)"
          changeType="positive"
          icon={<Droplets className="w-5 h-5" />}
        />
        <StatCard
          title="24h Volume"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalVolume24h)}
          change="+12.4% vs yesterday"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="24h Fees"
          value={formatCurrency(MOCK_PROTOCOL_STATS.totalFees24h)}
          change="Earned by LPs"
          changeType="neutral"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Active Traders"
          value={formatCompact(MOCK_PROTOCOL_STATS.uniqueTraders24h)}
          change="Last 24 hours"
          changeType="neutral"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader
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
              </ButtonGroup>
            }
          >
            <CardTitle>Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolTVLChart timeRange={timeRange} height={280} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
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
              </ButtonGroup>
            }
          >
            <CardTitle>Trading Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolVolumeChart timeRange={timeRange} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* Top Pools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                View All
              </Button>
            }
          >
            <CardTitle>Top Pools by TVL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPoolsByTVL.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                compact
                onClick={() => setSelectedPool(pool)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                View All
              </Button>
            }
          >
            <CardTitle>Top Pools by Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPoolsByVolume.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                compact
                onClick={() => setSelectedPool(pool)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* All Pools */}
      <Card>
        <CardHeader>
          <CardTitle>All Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <PoolList
            pools={pools}
            isLoading={isLoading}
            onPoolClick={(pool) => setSelectedPool(pool)}
          />
        </CardContent>
      </Card>

      {/* Pool Details Modal */}
      {selectedPool && (
        <PoolDetails
          pool={selectedPool}
          isModal
          onClose={() => setSelectedPool(null)}
        />
      )}
    </div>
  );
}
