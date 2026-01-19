'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Coins,
  History,
  Award,
  Calendar,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';

// Mock user data
const mockUser = {
  address: '7xKXt9mPqR3nL5kW2jM8vY1bN4cZ6dF0hG',
  username: 'whale_master',
  avatar: '🐋',
  bio: 'Full-time degen. Part-time winner.',
  joinedAt: '2024-01-01T00:00:00Z',
  twitter: 'whale_master',
  stats: {
    totalTrades: 234,
    winRate: 78,
    totalPnL: 45230,
    tokensCreated: 5,
    graduated: 2,
    totalVolume: 156000,
  },
};

const mockHoldings = [
  { name: 'PEPE2', symbol: 'PEPE2', amount: 1250000, value: 15.43, pnl: 23.5, image: '🐸' },
  { name: 'BONK2', symbol: 'BONK2', amount: 500000, value: 44.51, pnl: 18.7, image: '🐕' },
  { name: 'SOLCAT', symbol: 'SCAT', amount: 2000000, value: 46.90, pnl: -6.2, image: '🐱' },
  { name: 'ROCKET', symbol: 'RKT', amount: 750000, value: 25.92, pnl: 72.8, image: '🚀' },
];

const mockTrades = [
  { type: 'buy', token: 'PEPE2', amount: 500000, sol: 0.5, time: '2 hours ago', image: '🐸' },
  { type: 'sell', token: 'DOGE', amount: 1000000, sol: 56.78, time: '5 hours ago', image: '🐕' },
  { type: 'buy', token: 'BONK2', amount: 500000, sol: 37.50, time: '1 day ago', image: '🐕' },
  { type: 'buy', token: 'ROCKET', amount: 750000, sol: 15.00, time: '2 days ago', image: '🚀' },
  { type: 'sell', token: 'MOON', amount: 2000000, sol: 89.00, time: '3 days ago', image: '🌕' },
];

const mockCreated = [
  { name: 'My Coin', symbol: 'MYCN', marketCap: 12500, holders: 45, progress: 18, graduated: false, image: '💫' },
  { name: 'Whale Token', symbol: 'WHALE', marketCap: 89000, holders: 234, progress: 100, graduated: true, image: '🐋' },
  { name: 'Test Token', symbol: 'TEST', marketCap: 3200, holders: 12, progress: 5, graduated: false, image: '🧪' },
];

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [activeTab, setActiveTab] = useState<'holdings' | 'trades' | 'created'>('holdings');
  const [copied, setCopied] = useState(false);

  const user = mockUser; // In real app, fetch by address

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>

        {/* Profile Header */}
        <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center text-5xl">
              {user.avatar}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user.username}</h1>
                {user.stats.graduated > 0 && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {user.stats.graduated}x Graduate
                  </span>
                )}
              </div>

              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
              >
                <span className="font-mono text-sm">{user.address.slice(0, 8)}...{user.address.slice(-8)}</span>
                <Copy className="w-4 h-4" />
                {copied && <span className="text-neon-green text-xs">Copied!</span>}
              </button>

              <p className="text-gray-400 mb-3">{user.bio}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </div>
                {user.twitter && (
                  <a
                    href={`https://twitter.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-neon-cyan transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    @{user.twitter}
                  </a>
                )}
                <a
                  href={`https://solscan.io/account/${user.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-neon-cyan transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Solscan
                </a>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-dark-700">
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold text-neon-green">+${user.stats.totalPnL.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total P&L</div>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold">{user.stats.totalTrades}</div>
              <div className="text-sm text-gray-400">Trades</div>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold text-neon-green">{user.stats.winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold">${(user.stats.totalVolume / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-400">Volume</div>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold">{user.stats.tokensCreated}</div>
              <div className="text-sm text-gray-400">Created</div>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <div className="text-2xl font-bold text-yellow-400">{user.stats.graduated}</div>
              <div className="text-sm text-gray-400">Graduated</div>
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
            <Coins className="w-4 h-4" />
            Holdings ({mockHoldings.length})
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
            Created Tokens ({mockCreated.length})
          </button>
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <div className="space-y-3">
            {mockHoldings.map((holding) => (
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
                  <div className="font-bold">${holding.value.toFixed(2)}</div>
                  <div className={`text-sm flex items-center gap-1 ${holding.pnl >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                    {holding.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {holding.pnl >= 0 ? '+' : ''}{holding.pnl.toFixed(1)}%
                  </div>
                </div>
              </Link>
            ))}
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
                    <TrendingUp className="w-5 h-5 text-neon-green" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
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
                  <div className="text-sm text-gray-500">{trade.sol.toFixed(2)} SOL</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Created Tokens Tab */}
        {activeTab === 'created' && (
          <div className="space-y-3">
            {mockCreated.map((token) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="flex items-center gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-neon-green/50 transition-all"
              >
                <div className="text-3xl">{token.image}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{token.name}</span>
                    {token.graduated && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Graduated
                      </span>
                    )}
                  </div>
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
                    <span className={token.graduated ? 'text-yellow-400' : 'text-neon-green'}>
                      {token.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        token.graduated
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                          : 'bg-gradient-to-r from-neon-green to-neon-cyan'
                      }`}
                      style={{ width: `${Math.min(token.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
