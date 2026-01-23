'use client';

import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Droplets } from 'lucide-react';
import { Pool } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Table';
import { Sparkline } from '@/components/ui/Chart';
import { formatCurrency, formatPercentage, formatFeeTier } from '@/lib/formatters';

interface PoolCardProps {
  pool: Pool;
  onClick?: () => void;
  compact?: boolean;
}

export function PoolCard({ pool, onClick, compact = false }: PoolCardProps) {
  const isPositive = pool.priceChange24h >= 0;

  // Generate mock sparkline data
  const sparklineData = Array.from({ length: 20 }, (_, i) => {
    const base = pool.tvl * 0.95;
    const variation = pool.tvl * 0.1 * Math.sin((i / 20) * Math.PI * 2);
    return base + variation + Math.random() * pool.tvl * 0.02;
  });

  if (compact) {
    return (
      <Card
        hover
        onClick={onClick}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-cypher-yellow/20 rounded-full flex items-center justify-center border-2 border-cypher-card z-10">
              <span className="text-xs font-bold text-cypher-yellow">
                {pool.token0.symbol.slice(0, 2)}
              </span>
            </div>
            <div className="w-8 h-8 bg-cypher-blue/20 rounded-full flex items-center justify-center border-2 border-cypher-card">
              <span className="text-xs font-bold text-cypher-blue">
                {pool.token1.symbol.slice(0, 2)}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium text-white">
              {pool.token0.symbol}/{pool.token1.symbol}
            </p>
            <p className="text-xs text-cypher-gray-400">
              {formatFeeTier(pool.feeTier)} fee
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-white">{formatCurrency(pool.tvl)}</p>
          <p
            className={clsx(
              'text-xs',
              isPositive ? 'text-cypher-green' : 'text-cypher-red'
            )}
          >
            {formatPercentage(pool.priceChange24h)}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card hover onClick={onClick} className="group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 bg-cypher-yellow/20 rounded-full flex items-center justify-center border-2 border-cypher-card z-10">
              <span className="text-sm font-bold text-cypher-yellow">
                {pool.token0.symbol.slice(0, 2)}
              </span>
            </div>
            <div className="w-10 h-10 bg-cypher-blue/20 rounded-full flex items-center justify-center border-2 border-cypher-card">
              <span className="text-sm font-bold text-cypher-blue">
                {pool.token1.symbol.slice(0, 2)}
              </span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white text-lg">
              {pool.token0.symbol}/{pool.token1.symbol}
            </p>
            <Badge variant="default">{formatFeeTier(pool.feeTier)}</Badge>
          </div>
        </div>
        <div
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm',
            isPositive
              ? 'bg-cypher-green/10 text-cypher-green'
              : 'bg-cypher-red/10 text-cypher-red'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {formatPercentage(pool.priceChange24h)}
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <Sparkline
          data={sparklineData}
          height={40}
          color={isPositive ? '#22c55e' : '#ef4444'}
          className="w-full"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-cypher-gray-400 mb-1">TVL</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.tvl)}
          </p>
        </div>
        <div>
          <p className="text-xs text-cypher-gray-400 mb-1">24h Volume</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.volume24h)}
          </p>
        </div>
        <div>
          <p className="text-xs text-cypher-gray-400 mb-1">24h Fees</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.fees24h)}
          </p>
        </div>
        <div>
          <p className="text-xs text-cypher-gray-400 mb-1">APY</p>
          <p className="text-lg font-semibold text-cypher-green">
            {pool.apy.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-cypher-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-cypher-gray-400">
          <Droplets className="w-4 h-4" />
          <span className="text-sm">Concentrated Liquidity</span>
        </div>
        <span className="text-sm text-cypher-yellow opacity-0 group-hover:opacity-100 transition-opacity">
          View Details
        </span>
      </div>
    </Card>
  );
}

// Pool token pair display component
interface TokenPairProps {
  token0Symbol: string;
  token1Symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TokenPair({ token0Symbol, token1Symbol, size = 'md' }: TokenPairProps) {
  const sizes = {
    sm: { container: 'w-6 h-6', text: 'text-[8px]' },
    md: { container: 'w-8 h-8', text: 'text-xs' },
    lg: { container: 'w-10 h-10', text: 'text-sm' },
  };

  return (
    <div className="flex -space-x-2">
      <div
        className={clsx(
          sizes[size].container,
          'bg-cypher-yellow/20 rounded-full flex items-center justify-center border-2 border-cypher-card z-10'
        )}
      >
        <span className={clsx(sizes[size].text, 'font-bold text-cypher-yellow')}>
          {token0Symbol.slice(0, 2)}
        </span>
      </div>
      <div
        className={clsx(
          sizes[size].container,
          'bg-cypher-blue/20 rounded-full flex items-center justify-center border-2 border-cypher-card'
        )}
      >
        <span className={clsx(sizes[size].text, 'font-bold text-cypher-blue')}>
          {token1Symbol.slice(0, 2)}
        </span>
      </div>
    </div>
  );
}
