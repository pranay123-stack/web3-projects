'use client';

import React, { useState } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Pool } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubHeader } from '@/components/layout/Header';
import { PoolList } from '@/components/pools/PoolList';
import { PoolDetails } from '@/components/pools/PoolDetails';
import { usePoolData, usePoolStats } from '@/hooks/usePoolData';
import { formatCurrency, formatCompact } from '@/lib/formatters';

export default function PoolsPage() {
  const { pools, isLoading, error, refetch } = usePoolData();
  const { stats } = usePoolStats();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <SubHeader
        title="Liquidity Pools"
        description="Explore and manage liquidity pools on Cypher Protocol"
        action={
          <Button icon={<Plus className="w-4 h-4" />}>
            Create Pool
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cypher-yellow/10 rounded-lg">
              <Droplets className="w-5 h-5 text-cypher-yellow" />
            </div>
            <div>
              <p className="text-xs text-cypher-gray-400">Total Pools</p>
              <p className="text-lg font-semibold text-white">{stats.poolCount}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-cypher-gray-400">Total TVL</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(stats.totalTVL)}
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-cypher-gray-400">24h Volume</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(stats.totalVolume24h)}
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-cypher-gray-400">Avg APY</p>
            <p className="text-lg font-semibold text-cypher-green">
              {stats.avgAPY.toFixed(2)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-cypher-red/30">
          <div className="text-center py-8">
            <p className="text-cypher-red mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </Card>
      )}

      {/* Pool List */}
      <Card>
        <CardContent>
          <PoolList
            pools={pools}
            isLoading={isLoading}
            onPoolClick={(pool) => setSelectedPool(pool)}
            showFilters
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
