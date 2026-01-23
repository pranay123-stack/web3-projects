'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { ILCalculatorInput, ILCalculatorResult } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { calculateConcentratedIL } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

export function ImpermanentLossCalc() {
  const [input, setInput] = useState<ILCalculatorInput>({
    entryPrice: 2300,
    currentPrice: 2456.78,
    lowerRangePrice: 2000,
    upperRangePrice: 2800,
    initialInvestment: 10000,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const result = useMemo<ILCalculatorResult>(() => {
    return calculateConcentratedIL(input);
  }, [input]);

  const handleInputChange = (field: keyof ILCalculatorInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInput((prev) => ({ ...prev, [field]: numValue }));
  };

  const priceChange = ((input.currentPrice - input.entryPrice) / input.entryPrice) * 100;
  const isProfit = result.currentPositionValue > input.initialInvestment;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cypher-yellow" />
          Impermanent Loss Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-cypher-gray-400 mb-2">
              Entry Price (USD)
            </label>
            <input
              type="number"
              value={input.entryPrice}
              onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              className="w-full px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50"
              placeholder="2300"
            />
          </div>

          <div>
            <label className="block text-sm text-cypher-gray-400 mb-2">
              Current Price (USD)
            </label>
            <input
              type="number"
              value={input.currentPrice}
              onChange={(e) => handleInputChange('currentPrice', e.target.value)}
              className="w-full px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50"
              placeholder="2456.78"
            />
          </div>

          <div>
            <label className="block text-sm text-cypher-gray-400 mb-2">
              Lower Range Price
            </label>
            <input
              type="number"
              value={input.lowerRangePrice}
              onChange={(e) => handleInputChange('lowerRangePrice', e.target.value)}
              className="w-full px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50"
              placeholder="2000"
            />
          </div>

          <div>
            <label className="block text-sm text-cypher-gray-400 mb-2">
              Upper Range Price
            </label>
            <input
              type="number"
              value={input.upperRangePrice}
              onChange={(e) => handleInputChange('upperRangePrice', e.target.value)}
              className="w-full px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50"
              placeholder="2800"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-cypher-gray-400 mb-2">
              Initial Investment (USD)
            </label>
            <input
              type="number"
              value={input.initialInvestment}
              onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
              className="w-full px-4 py-2 bg-cypher-darker border border-cypher-border rounded-lg text-white focus:border-cypher-yellow focus:ring-1 focus:ring-cypher-yellow/50"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Price Range Visualization */}
        <div className="bg-cypher-darker rounded-lg p-4">
          <div className="flex justify-between text-xs text-cypher-gray-400 mb-2">
            <span>${input.lowerRangePrice.toLocaleString()}</span>
            <span>Current: ${input.currentPrice.toLocaleString()}</span>
            <span>${input.upperRangePrice.toLocaleString()}</span>
          </div>
          <div className="relative h-4 bg-cypher-border rounded-full overflow-hidden">
            {/* Active range */}
            <div
              className={clsx(
                'absolute top-0 bottom-0 rounded-full',
                result.inRange ? 'bg-cypher-green/30' : 'bg-cypher-yellow/30'
              )}
              style={{ left: '0%', right: '0%' }}
            />
            {/* Current price marker */}
            <div
              className={clsx(
                'absolute top-0 bottom-0 w-1 rounded-full',
                result.inRange ? 'bg-cypher-green' : 'bg-cypher-yellow'
              )}
              style={{
                left: `${Math.min(100, Math.max(0, ((input.currentPrice - input.lowerRangePrice) / (input.upperRangePrice - input.lowerRangePrice)) * 100))}%`,
                transform: 'translateX(-50%)',
              }}
            />
            {/* Entry price marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cypher-gray-500 opacity-50"
              style={{
                left: `${Math.min(100, Math.max(0, ((input.entryPrice - input.lowerRangePrice) / (input.upperRangePrice - input.lowerRangePrice)) * 100))}%`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-cypher-gray-500 rounded-full" />
              <span className="text-cypher-gray-400">Entry Price</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={clsx('w-2 h-2 rounded-full', result.inRange ? 'bg-cypher-green' : 'bg-cypher-yellow')} />
              <span className="text-cypher-gray-400">Current Price</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cypher-darker rounded-lg p-4">
            <p className="text-xs text-cypher-gray-400 mb-1">Position Value</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(result.currentPositionValue)}
            </p>
          </div>

          <div className="bg-cypher-darker rounded-lg p-4">
            <p className="text-xs text-cypher-gray-400 mb-1">HODL Value</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(result.hodlValue)}
            </p>
          </div>

          <div className="bg-cypher-darker rounded-lg p-4">
            <p className="text-xs text-cypher-gray-400 mb-1">Impermanent Loss</p>
            <p
              className={clsx(
                'text-lg font-semibold',
                result.impermanentLossUSD < 0 ? 'text-cypher-red' : 'text-cypher-green'
              )}
            >
              {formatCurrency(Math.abs(result.impermanentLossUSD))}
            </p>
            <p className="text-xs text-cypher-gray-400">
              ({formatPercentage(result.impermanentLossPercentage)})
            </p>
          </div>

          <div className="bg-cypher-darker rounded-lg p-4">
            <p className="text-xs text-cypher-gray-400 mb-1">Price Change</p>
            <p
              className={clsx(
                'text-lg font-semibold flex items-center gap-1',
                priceChange >= 0 ? 'text-cypher-green' : 'text-cypher-red'
              )}
            >
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {formatPercentage(priceChange)}
            </p>
          </div>
        </div>

        {/* Range Status */}
        <div
          className={clsx(
            'flex items-center gap-3 p-4 rounded-lg',
            result.inRange ? 'bg-cypher-green/10' : 'bg-cypher-yellow/10'
          )}
        >
          {result.inRange ? (
            <>
              <div className="w-10 h-10 bg-cypher-green/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cypher-green" />
              </div>
              <div>
                <p className="font-medium text-white">Position is In Range</p>
                <p className="text-sm text-cypher-gray-400">
                  Your position is actively earning fees
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-cypher-yellow/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-cypher-yellow" />
              </div>
              <div>
                <p className="font-medium text-white">Position is Out of Range</p>
                <p className="text-sm text-cypher-gray-400">
                  Your position is not earning fees. Consider rebalancing.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Comparison Chart */}
        <div className="bg-cypher-darker rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-4">LP vs HODL Comparison</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cypher-gray-400">LP Position</span>
                <span className="text-white">{formatCurrency(result.currentPositionValue)}</span>
              </div>
              <div className="h-2 bg-cypher-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-cypher-yellow rounded-full"
                  style={{
                    width: `${Math.min(100, (result.currentPositionValue / Math.max(result.currentPositionValue, result.hodlValue)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cypher-gray-400">HODL Strategy</span>
                <span className="text-white">{formatCurrency(result.hodlValue)}</span>
              </div>
              <div className="h-2 bg-cypher-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-cypher-blue rounded-full"
                  style={{
                    width: `${Math.min(100, (result.hodlValue / Math.max(result.currentPositionValue, result.hodlValue)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-cypher-blue/10 rounded-lg">
          <Info className="w-4 h-4 text-cypher-blue mt-0.5 flex-shrink-0" />
          <p className="text-xs text-cypher-gray-300">
            Impermanent loss occurs when the price ratio of your deposited assets changes
            compared to when you deposited them. In concentrated liquidity, IL can be
            amplified within your selected price range. This calculator provides an estimate
            and does not account for fees earned.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
