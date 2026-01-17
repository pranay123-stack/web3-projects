'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, TrendingUp, TrendingDown, History, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

const mockHoldings = [
  { name: 'PEPE2', symbol: 'PEPE2', amount: 1250000, avgBuy: 0.00000890, currentPrice: 0.00001234, image: '🐸' },
  { name: 'BONK2', symbol: 'BONK2', amount: 500000, avgBuy: 0.00007500, currentPrice: 0.00008901, image: '🐕' },
  { name: 'SOLCAT', symbol: 'SCAT', amount: 2000000, avgBuy: 0.00002500, currentPrice: 0.00002345, image: '🐱' },
  { name: 'ROCKET', symbol: 'RKT', amount: 750000, avgBuy: 0.00002000, currentPrice: 0.00003456, image: '🚀' },
];

const mockTrades = [
  { type: 'buy', token: 'PEPE2', amount: 500000, price: 0.00000890, total: 4.45, time: '2 hours ago', image: '🐸' },
  { type: 'sell', token: 'DOGE', amount: 1000000, price: 0.00005678, total: 56.78, time: '5 hours ago', image: '🐕' },
  { type: 'buy', token: 'BONK2', amount: 500000, price: 0.00007500, total: 37.50, time: '1 day ago', image: '🐕' },
  { type: 'buy', token: 'ROCKET', amount: 750000, price: 0.00002000, total: 15.00, time: '2 days ago', image: '🚀' },
];

const mockCreatedTokens = [
  { name: 'My Coin', symbol: 'MYCN', marketCap: 12500, holders: 45, progress: 18, image: '💫' },
  { name: 'Test Token', symbol: 'TEST', marketCap: 3200, holders: 12, progress: 5, image: '🧪' },
];

export default function PortfolioPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [activeTab, setActiveTab] = useState<'holdings' | 'trades' | 'created'>('holdings');

  // Calculate portfolio stats
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.amount * h.currentPrice, 0);
  const totalCost = mockHoldings.reduce((sum, h) => sum + h.amount * h.avgBuy, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = ((totalValue - totalCost) / totalCost) * 100;

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-6xl mb-6">👛</div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Connect your wallet to view your portfolio, holdings, and trading history.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">
            <span className="gradient-text">Your Portfolio</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="p-6 bg-dark-800/50 border border-dark-700 rounded-2xl">
              <div className="text-gray-400 text-sm mb-1">Total Value</div>
              <div className="text-3xl font-bold">${totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-500">SOL</div>
            </div>

            {/* Total P&L */}
            <div className="p-6 bg-dark-800/50 border border-dark-700 rounded-2xl">
              <div className="text-gray-400 text-sm mb-1">Total P&L</div>
              <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </div>
              <div className={`text-sm ${totalPnL >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </div>
            </div>

            {/* Holdings Count */}
            <div className="p-6 bg-dark-800/50 border border-dark-700 rounded-2xl">
              <div className="text-gray-400 text-sm mb-1">Holdings</div>
              <div className="text-3xl font-bold">{mockHoldings.length}</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>

            {/* Created Tokens */}
            <div className="p-6 bg-dark-800/50 border border-dark-700 rounded-2xl">
              <div className="text-gray-400 text-sm mb-1">Created</div>
              <div className="text-3xl font-bold">{mockCreatedTokens.length}</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-dark-700 pb-4">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'holdings'
                ? 'bg-neon-green/20 text-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Holdings
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'trades'
                ? 'bg-neon-green/20 text-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Trade History
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'created'
                ? 'bg-neon-green/20 text-neon-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Created Tokens
          </button>
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <div className="space-y-3">
            {mockHoldings.map((holding) => {
              const value = holding.amount * holding.currentPrice;
              const cost = holding.amount * holding.avgBuy;
              const pnl = value - cost;
              const pnlPercent = ((value - cost) / cost) * 100;

              return (
                <Link
                  key={holding.symbol}
                  href={`/token/${holding.symbol.toLowerCase()}`}
                  className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-neon-green/50 transition-all"
                >
                  <div className="text-3xl">{holding.image}</div>
                  <div className="flex-1">
                    <div className="font-bold">{holding.name}</div>
                    <div className="text-sm text-gray-500">{holding.amount.toLocaleString()} ${holding.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${value.toFixed(2)}</div>
                    <div className={`text-sm ${pnl >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="space-y-3">
            {mockTrades.map((trade, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl"
              >
                <div className={`p-2 rounded-xl ${trade.type === 'buy' ? 'bg-neon-green/20' : 'bg-red-500/20'}`}>
                  {trade.type === 'buy' ? (
                    <ArrowUpRight className={`w-5 h-5 text-neon-green`} />
                  ) : (
                    <ArrowDownRight className={`w-5 h-5 text-red-500`} />
                  )}
                </div>
                <div className="text-2xl">{trade.image}</div>
                <div className="flex-1">
                  <div className="font-bold">
                    {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.token}
                  </div>
                  <div className="text-sm text-gray-500">{trade.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{trade.amount.toLocaleString()} tokens</div>
                  <div className="text-sm text-gray-500">{trade.total.toFixed(2)} SOL</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Created Tokens Tab */}
        {activeTab === 'created' && (
          <div className="space-y-3">
            {mockCreatedTokens.map((token) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-neon-green/50 transition-all"
              >
                <div className="text-3xl">{token.image}</div>
                <div className="flex-1">
                  <div className="font-bold">{token.name}</div>
                  <div className="text-sm text-gray-500">${token.symbol}</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">${(token.marketCap / 1000).toFixed(1)}K</div>
                  <div className="text-sm text-gray-500">Market Cap</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{token.holders}</div>
                  <div className="text-sm text-gray-500">Holders</div>
                </div>
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-neon-green">{token.progress}%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                      style={{ width: `${token.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}

            {mockCreatedTokens.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">No tokens created yet</h3>
                <p className="text-gray-400 mb-6">Create your first token and start trading!</p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Create Token
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
