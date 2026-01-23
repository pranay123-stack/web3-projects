'use client';

import React from 'react';
import { clsx } from 'clsx';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  PieChart,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { usePortfolioSummary, usePositions } from '@/hooks/usePositions';
import { formatCurrency, formatPercentage, formatPercentageUnsigned } from '@/lib/formatters';

export function PortfolioSummary() {
  const { summary, isLoading, error } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 bg-cypher-border/30 rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-cypher-red">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load portfolio summary</p>
        </div>
      </Card>
    );
  }

  const isPnLPositive = summary.totalPnL >= 0;
  const pnlPercentage = summary.totalValue > 0
    ? (summary.totalPnL / summary.totalValue) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value"
          value={formatCurrency(summary.totalValue)}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Fees Earned"
          value={formatCurrency(summary.totalFeesEarned)}
          change={summary.totalFeesEarned > 0 ? 'Lifetime' : undefined}
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Impermanent Loss"
          value={formatCurrency(Math.abs(summary.totalImpermanentLoss))}
          changeType="negative"
          icon={<Percent className="w-5 h-5" />}
        />
        <StatCard
          title="Net P&L"
          value={formatCurrency(summary.totalPnL)}
          change={formatPercentage(pnlPercentage)}
          changeType={isPnLPositive ? 'positive' : 'negative'}
          icon={
            isPnLPositive ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
        />
      </div>

      {/* Position Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cypher-yellow" />
            Position Overview
          </h3>
          <span className="text-sm text-cypher-gray-400">
            {summary.positionCount} positions
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-cypher-darker rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-cypher-green" />
              <span className="text-sm text-cypher-gray-400">In Range</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.inRangeCount}</p>
            <p className="text-xs text-cypher-gray-400">
              {summary.positionCount > 0
                ? formatPercentageUnsigned((summary.inRangeCount / summary.positionCount) * 100)
                : '0%'}{' '}
              of positions
            </p>
          </div>

          <div className="bg-cypher-darker rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-cypher-yellow" />
              <span className="text-sm text-cypher-gray-400">Out of Range</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.outOfRangeCount}</p>
            <p className="text-xs text-cypher-gray-400">
              {summary.positionCount > 0
                ? formatPercentageUnsigned((summary.outOfRangeCount / summary.positionCount) * 100)
                : '0%'}{' '}
              of positions
            </p>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-cypher-gray-400 mb-2">
            <span>Position Health</span>
            <span>
              {summary.inRangeCount}/{summary.positionCount} in range
            </span>
          </div>
          <div className="h-2 bg-cypher-darker rounded-full overflow-hidden flex">
            <div
              className="h-full bg-cypher-green transition-all"
              style={{
                width:
                  summary.positionCount > 0
                    ? `${(summary.inRangeCount / summary.positionCount) * 100}%`
                    : '0%',
              }}
            />
            <div
              className="h-full bg-cypher-yellow transition-all"
              style={{
                width:
                  summary.positionCount > 0
                    ? `${(summary.outOfRangeCount / summary.positionCount) * 100}%`
                    : '0%',
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Compact summary for sidebar or header
export function PortfolioMiniSummary() {
  const { summary, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-cypher-border/30 rounded w-24 mb-1" />
        <div className="h-6 bg-cypher-border/30 rounded w-32" />
      </div>
    );
  }

  const isPnLPositive = summary.totalPnL >= 0;

  return (
    <div>
      <p className="text-xs text-cypher-gray-400">Portfolio Value</p>
      <p className="text-lg font-semibold text-white">
        {formatCurrency(summary.totalValue)}
      </p>
      <p
        className={clsx(
          'text-xs flex items-center gap-1',
          isPnLPositive ? 'text-cypher-green' : 'text-cypher-red'
        )}
      >
        {isPnLPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {formatCurrency(summary.totalPnL)} P&L
      </p>
    </div>
  );
}
