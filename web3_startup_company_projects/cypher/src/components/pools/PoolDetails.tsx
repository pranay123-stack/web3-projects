'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  X,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  Droplets,
  Clock,
  BarChart2,
} from 'lucide-react';
import { Pool, TimeRange } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button, ButtonGroup, ToggleButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Table';
import { TokenPair } from './PoolCard';
import { TVLChart } from '@/components/charts/TVLChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { FeeAPYChart } from '@/components/charts/FeeAPYChart';
import {
  formatCurrency,
  formatPercentage,
  formatFeeTier,
  formatAddress,
  formatPrice,
} from '@/lib/formatters';

interface PoolDetailsProps {
  pool: Pool;
  onClose?: () => void;
  isModal?: boolean;
}

export function PoolDetails({ pool, onClose, isModal = false }: PoolDetailsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeChart, setActiveChart] = useState<'tvl' | 'volume' | 'fees'>('tvl');
  const [copied, setCopied] = useState(false);

  const isPositive = pool.priceChange24h >= 0;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(pool.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <TokenPair
            token0Symbol={pool.token0.symbol}
            token1Symbol={pool.token1.symbol}
            size="lg"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">
              {pool.token0.symbol}/{pool.token1.symbol}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{formatFeeTier(pool.feeTier)} fee</Badge>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1 text-sm text-cypher-gray-400 hover:text-white transition-colors"
              >
                {formatAddress(pool.address)}
                <Copy className="w-3 h-3" />
              </button>
              {copied && (
                <span className="text-xs text-cypher-green">Copied!</span>
              )}
            </div>
          </div>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Price Info */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-cypher-gray-400">Current Price</p>
          <p className="text-xl font-semibold text-white">
            {formatPrice(pool.currentPrice)} {pool.token1.symbol}/{pool.token0.symbol}
          </p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg',
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
          <span className="font-medium">{formatPercentage(pool.priceChange24h)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-xs text-cypher-gray-400 mb-1">TVL</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.tvl)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-cypher-gray-400 mb-1">24h Volume</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.volume24h)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-cypher-gray-400 mb-1">24h Fees</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(pool.fees24h)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-cypher-gray-400 mb-1">APY</p>
          <p className="text-lg font-semibold text-cypher-green">
            {pool.apy.toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader
          action={
            <ButtonGroup>
              <ToggleButton
                active={timeRange === '24h'}
                onClick={() => setTimeRange('24h')}
              >
                24H
              </ToggleButton>
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
          <div className="flex items-center gap-2">
            <ButtonGroup>
              <ToggleButton
                active={activeChart === 'tvl'}
                onClick={() => setActiveChart('tvl')}
              >
                <Droplets className="w-4 h-4 mr-1" />
                TVL
              </ToggleButton>
              <ToggleButton
                active={activeChart === 'volume'}
                onClick={() => setActiveChart('volume')}
              >
                <BarChart2 className="w-4 h-4 mr-1" />
                Volume
              </ToggleButton>
              <ToggleButton
                active={activeChart === 'fees'}
                onClick={() => setActiveChart('fees')}
              >
                <Clock className="w-4 h-4 mr-1" />
                Fees
              </ToggleButton>
            </ButtonGroup>
          </div>
        </CardHeader>
        <CardContent>
          {activeChart === 'tvl' && (
            <TVLChart poolId={pool.id} timeRange={timeRange} height={300} />
          )}
          {activeChart === 'volume' && (
            <VolumeChart poolId={pool.id} timeRange={timeRange} height={300} />
          )}
          {activeChart === 'fees' && (
            <FeeAPYChart poolId={pool.id} timeRange={timeRange} height={300} />
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pool Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-cypher-gray-400">Fee Tier</span>
              <span className="text-white">{formatFeeTier(pool.feeTier)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cypher-gray-400">Tick Spacing</span>
              <span className="text-white">{pool.tickSpacing}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cypher-gray-400">Current Tick</span>
              <span className="text-white">{pool.currentTick}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cypher-gray-400">7d Volume</span>
              <span className="text-white">{formatCurrency(pool.volume7d)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cypher-gray-400">7d Fees</span>
              <span className="text-white">{formatCurrency(pool.fees7d)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-cypher-darker rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cypher-yellow/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-cypher-yellow">
                    {pool.token0.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{pool.token0.symbol}</p>
                  <p className="text-xs text-cypher-gray-400">{pool.token0.name}</p>
                </div>
              </div>
              <a
                href={`https://etherscan.io/token/${pool.token0.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cypher-gray-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-cypher-darker rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cypher-blue/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-cypher-blue">
                    {pool.token1.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{pool.token1.symbol}</p>
                  <p className="text-xs text-cypher-gray-400">{pool.token1.name}</p>
                </div>
              </div>
              <a
                href={`https://etherscan.io/token/${pool.token1.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cypher-gray-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1">Add Liquidity</Button>
        <Button variant="secondary" className="flex-1">
          Swap
        </Button>
        <Button
          variant="ghost"
          icon={<ExternalLink className="w-4 h-4" />}
          onClick={() =>
            window.open(`https://etherscan.io/address/${pool.address}`, '_blank')
          }
        >
          View on Etherscan
        </Button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-cypher-dark border border-cypher-border rounded-2xl p-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
