'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Filter, Grid, List } from 'lucide-react';
import { Pool, TableColumn, FilterConfig } from '@/types';
import { Table, Badge } from '@/components/ui/Table';
import { Button, ButtonGroup, ToggleButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PoolCard, TokenPair } from './PoolCard';
import { formatCurrency, formatPercentage, formatFeeTier } from '@/lib/formatters';
import { FEE_TIERS } from '@/lib/constants';

interface PoolListProps {
  pools: Pool[];
  isLoading?: boolean;
  onPoolClick?: (pool: Pool) => void;
  showFilters?: boolean;
}

export function PoolList({
  pools,
  isLoading = false,
  onPoolClick,
  showFilters = true,
}: PoolListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filter, setFilter] = useState<FilterConfig>({
    search: '',
    feeTier: undefined,
  });

  // Filter pools
  const filteredPools = useMemo(() => {
    let result = [...pools];

    if (filter.search) {
      const query = filter.search.toLowerCase();
      result = result.filter(
        (pool) =>
          pool.token0.symbol.toLowerCase().includes(query) ||
          pool.token1.symbol.toLowerCase().includes(query)
      );
    }

    if (filter.feeTier !== undefined) {
      result = result.filter((pool) => pool.feeTier === filter.feeTier);
    }

    return result;
  }, [pools, filter]);

  // Table columns
  const columns: TableColumn<Pool>[] = [
    {
      key: 'pair',
      header: 'Pool',
      render: (pool) => (
        <div className="flex items-center gap-3">
          <TokenPair
            token0Symbol={pool.token0.symbol}
            token1Symbol={pool.token1.symbol}
          />
          <div>
            <p className="font-medium text-white">
              {pool.token0.symbol}/{pool.token1.symbol}
            </p>
            <Badge variant="default">{formatFeeTier(pool.feeTier)}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'tvl',
      header: 'TVL',
      sortable: true,
      render: (pool) => (
        <span className="font-medium text-white">{formatCurrency(pool.tvl)}</span>
      ),
    },
    {
      key: 'volume24h',
      header: '24h Volume',
      sortable: true,
      render: (pool) => (
        <span className="text-cypher-gray-200">
          {formatCurrency(pool.volume24h)}
        </span>
      ),
    },
    {
      key: 'fees24h',
      header: '24h Fees',
      sortable: true,
      render: (pool) => (
        <span className="text-cypher-gray-200">
          {formatCurrency(pool.fees24h)}
        </span>
      ),
    },
    {
      key: 'apy',
      header: 'APY',
      sortable: true,
      render: (pool) => (
        <span className="font-medium text-cypher-green">{pool.apy.toFixed(2)}%</span>
      ),
    },
    {
      key: 'priceChange24h',
      header: '24h Change',
      sortable: true,
      render: (pool) => {
        const isPositive = pool.priceChange24h >= 0;
        return (
          <div
            className={clsx(
              'flex items-center gap-1',
              isPositive ? 'text-cypher-green' : 'text-cypher-red'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatPercentage(pool.priceChange24h)}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters and View Toggle */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search pools..."
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full sm:w-64 px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white placeholder-cypher-gray-500 focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50 transition-all"
            />

            {/* Fee Tier Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cypher-gray-400" />
              <ButtonGroup>
                <ToggleButton
                  active={filter.feeTier === undefined}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, feeTier: undefined }))
                  }
                >
                  All
                </ToggleButton>
                <ToggleButton
                  active={filter.feeTier === FEE_TIERS.LOWEST}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, feeTier: FEE_TIERS.LOWEST }))
                  }
                >
                  0.01%
                </ToggleButton>
                <ToggleButton
                  active={filter.feeTier === FEE_TIERS.LOW}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, feeTier: FEE_TIERS.LOW }))
                  }
                >
                  0.05%
                </ToggleButton>
                <ToggleButton
                  active={filter.feeTier === FEE_TIERS.MEDIUM}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, feeTier: FEE_TIERS.MEDIUM }))
                  }
                >
                  0.30%
                </ToggleButton>
                <ToggleButton
                  active={filter.feeTier === FEE_TIERS.HIGH}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, feeTier: FEE_TIERS.HIGH }))
                  }
                >
                  1.00%
                </ToggleButton>
              </ButtonGroup>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              icon={<List className="w-4 h-4" />}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              icon={<Grid className="w-4 h-4" />}
            >
              Grid
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-cypher-gray-400">
        Showing {filteredPools.length} of {pools.length} pools
      </p>

      {/* Pool List */}
      {viewMode === 'table' ? (
        <Table
          data={filteredPools}
          columns={columns}
          loading={isLoading}
          onRowClick={onPoolClick}
          emptyMessage="No pools found matching your criteria"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-cypher-border/30 rounded-lg" />
              </Card>
            ))
          ) : filteredPools.length === 0 ? (
            <div className="col-span-full text-center py-12 text-cypher-gray-400">
              No pools found matching your criteria
            </div>
          ) : (
            filteredPools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onClick={() => onPoolClick?.(pool)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
