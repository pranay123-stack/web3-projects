'use client';

import React from 'react';
import { clsx } from 'clsx';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Position } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { TokenPair } from '@/components/pools/PoolCard';
import {
  formatCurrency,
  formatPercentage,
  formatFeeTier,
  formatTokenAmount,
  formatRelativeTime,
} from '@/lib/formatters';
import { tickToPrice } from '@/lib/calculations';

interface PositionCardProps {
  position: Position;
  onClick?: () => void;
  expanded?: boolean;
}

export function PositionCard({
  position,
  onClick,
  expanded = false,
}: PositionCardProps) {
  const isPnLPositive = position.pnl >= 0;
  const lowerPrice = tickToPrice(position.tickLower);
  const upperPrice = tickToPrice(position.tickUpper);

  // Calculate position in range percentage
  const rangeWidth = upperPrice - lowerPrice;
  const currentPricePosition =
    ((position.currentPrice - lowerPrice) / rangeWidth) * 100;
  const clampedPosition = Math.max(0, Math.min(100, currentPricePosition));

  return (
    <Card hover={!expanded} onClick={!expanded ? onClick : undefined} className="group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <TokenPair
            token0Symbol={position.pool.token0.symbol}
            token1Symbol={position.pool.token1.symbol}
          />
          <div>
            <p className="font-semibold text-white">
              {position.pool.token0.symbol}/{position.pool.token1.symbol}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">
                {formatFeeTier(position.pool.feeTier)}
              </Badge>
              <Badge variant={position.inRange ? 'success' : 'warning'}>
                {position.inRange ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    In Range
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Out of Range
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-white">
            {formatCurrency(position.valueUSD)}
          </p>
          <p
            className={clsx(
              'flex items-center justify-end gap-1 text-sm',
              isPnLPositive ? 'text-cypher-green' : 'text-cypher-red'
            )}
          >
            {isPnLPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatPercentage(position.pnlPercentage)}
          </p>
        </div>
      </div>

      {/* Price Range Visualization */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-cypher-gray-400 mb-2">
          <span>Min: {formatTokenAmount(lowerPrice)}</span>
          <span>Current: {formatTokenAmount(position.currentPrice)}</span>
          <span>Max: {formatTokenAmount(upperPrice)}</span>
        </div>
        <div className="relative h-2 bg-cypher-darker rounded-full overflow-hidden">
          <div
            className={clsx(
              'absolute top-0 bottom-0 rounded-full transition-all',
              position.inRange ? 'bg-cypher-green/30' : 'bg-cypher-yellow/30'
            )}
            style={{
              left: '0%',
              right: '0%',
            }}
          />
          <div
            className={clsx(
              'absolute top-0 bottom-0 w-1 rounded-full transition-all',
              position.inRange ? 'bg-cypher-green' : 'bg-cypher-yellow'
            )}
            style={{
              left: `${clampedPosition}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-cypher-gray-400">Token Amounts</p>
          <p className="text-sm text-white">
            {formatTokenAmount(position.token0Amount)} {position.pool.token0.symbol}
          </p>
          <p className="text-sm text-white">
            {formatTokenAmount(position.token1Amount)} {position.pool.token1.symbol}
          </p>
        </div>
        <div>
          <p className="text-xs text-cypher-gray-400">Fees Earned</p>
          <p className="text-sm text-cypher-green">
            {formatCurrency(position.feesEarnedUSD)}
          </p>
        </div>
      </div>

      {expanded && (
        <>
          {/* Additional Details */}
          <div className="border-t border-cypher-border pt-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-cypher-gray-400 mb-1">Entry Price</p>
                <p className="text-sm text-white">
                  {formatTokenAmount(position.entryPrice)} {position.pool.token1.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-cypher-gray-400 mb-1">Current Price</p>
                <p className="text-sm text-white">
                  {formatTokenAmount(position.currentPrice)} {position.pool.token1.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-cypher-gray-400 mb-1">Impermanent Loss</p>
                <p className="text-sm text-cypher-red">
                  {formatCurrency(Math.abs(position.impermanentLossUSD))} ({formatPercentage(position.impermanentLoss)})
                </p>
              </div>
              <div>
                <p className="text-xs text-cypher-gray-400 mb-1">Net P&L</p>
                <p
                  className={clsx(
                    'text-sm',
                    position.pnl >= 0 ? 'text-cypher-green' : 'text-cypher-red'
                  )}
                >
                  {formatCurrency(position.pnl)} ({formatPercentage(position.pnlPercentage)})
                </p>
              </div>
              <div>
                <p className="text-xs text-cypher-gray-400 mb-1">Opened</p>
                <p className="text-sm text-white">
                  {formatRelativeTime(position.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Add Liquidity
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              Remove
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {!expanded && (
        <div className="flex items-center justify-between pt-3 border-t border-cypher-border">
          <span className="text-xs text-cypher-gray-400">
            Opened {formatRelativeTime(position.createdAt)}
          </span>
          <span className="text-xs text-cypher-yellow opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
          </span>
        </div>
      )}
    </Card>
  );
}

// Compact position row for tables
interface PositionRowProps {
  position: Position;
  onClick?: () => void;
}

export function PositionRow({ position, onClick }: PositionRowProps) {
  const isPnLPositive = position.pnl >= 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-cypher-card border border-cypher-border rounded-lg hover:border-cypher-yellow/30 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3">
        <TokenPair
          token0Symbol={position.pool.token0.symbol}
          token1Symbol={position.pool.token1.symbol}
          size="sm"
        />
        <div>
          <p className="font-medium text-white text-sm">
            {position.pool.token0.symbol}/{position.pool.token1.symbol}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant={position.inRange ? 'success' : 'warning'}
              className="text-[10px]"
            >
              {position.inRange ? 'In Range' : 'Out of Range'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium text-white text-sm">
          {formatCurrency(position.valueUSD)}
        </p>
        <p
          className={clsx(
            'text-xs',
            isPnLPositive ? 'text-cypher-green' : 'text-cypher-red'
          )}
        >
          {formatPercentage(position.pnlPercentage)}
        </p>
      </div>
    </div>
  );
}
