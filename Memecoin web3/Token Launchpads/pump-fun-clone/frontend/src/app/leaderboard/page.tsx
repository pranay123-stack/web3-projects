'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, Users, Coins, Crown, Medal } from 'lucide-react';
import Header from '@/components/layout/Header';

const mockTopTraders = [
  { rank: 1, address: '7xKXt...9mPq', username: 'whale_master', pnl: 45230, trades: 234, winRate: 78, avatar: '🐋' },
  { rank: 2, address: '3mNpQ...7kLw', username: 'degen_king', pnl: 32100, trades: 189, winRate: 72, avatar: '👑' },
  { rank: 3, address: '9pRtY...2nXz', username: 'sol_trader', pnl: 28750, trades: 156, winRate: 69, avatar: '⚡' },
  { rank: 4, address: '5kMnB...8vCx', username: 'moon_hunter', pnl: 21400, trades: 198, winRate: 65, avatar: '🌙' },
  { rank: 5, address: '2wQpL...4jHy', username: 'pump_it_up', pnl: 18900, trades: 145, winRate: 71, avatar: '🚀' },
  { rank: 6, address: '8nKrT...6mWz', username: 'diamond_hands', pnl: 15600, trades: 112, winRate: 68, avatar: '💎' },
  { rank: 7, address: '4vBnM...1pQs', username: 'crypto_ape', pnl: 12300, trades: 167, winRate: 62, avatar: '🦍' },
  { rank: 8, address: '6tYuI...3oLk', username: 'sol_maxi', pnl: 9800, trades: 89, winRate: 74, avatar: '☀️' },
  { rank: 9, address: '1xCvB...5nMj', username: 'fomo_buyer', pnl: 7500, trades: 234, winRate: 55, avatar: '🎰' },
  { rank: 10, address: '0zAsD...9fGh', username: 'paper_hands', pnl: 5200, trades: 78, winRate: 59, avatar: '📄' },
];

const mockTopCreators = [
  { rank: 1, address: '7xKXt...9mPq', username: 'token_king', tokensCreated: 12, totalVolume: 125000, graduated: 3, avatar: '🏆' },
  { rank: 2, address: '3mNpQ...7kLw', username: 'meme_lord', tokensCreated: 8, totalVolume: 89000, graduated: 2, avatar: '🎭' },
  { rank: 3, address: '9pRtY...2nXz', username: 'launch_pad', tokensCreated: 15, totalVolume: 67000, graduated: 1, avatar: '🚀' },
  { rank: 4, address: '5kMnB...8vCx', username: 'sol_builder', tokensCreated: 6, totalVolume: 54000, graduated: 2, avatar: '🔨' },
  { rank: 5, address: '2wQpL...4jHy', username: 'token_factory', tokensCreated: 20, totalVolume: 45000, graduated: 0, avatar: '🏭' },
];

const mockTopTokens = [
  { rank: 1, name: 'BONK2', symbol: 'BONK2', volume24h: 234000, holders: 1234, change: 456.7, image: '🐕' },
  { rank: 2, name: 'PEPE2', symbol: 'PEPE2', volume24h: 189000, holders: 987, change: 234.5, image: '🐸' },
  { rank: 3, name: 'SOLCAT', symbol: 'SCAT', volume24h: 156000, holders: 756, change: 156.8, image: '🐱' },
  { rank: 4, name: 'ROCKET', symbol: 'RKT', volume24h: 123000, holders: 543, change: 123.4, image: '🚀' },
  { rank: 5, name: 'MOON', symbol: 'MOON', volume24h: 98000, holders: 432, change: 89.2, image: '🌕' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'traders' | 'creators' | 'tokens'>('traders');

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full mb-4">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">Leaderboard</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Top Performers</span>
          </h1>
          <p className="text-gray-400">The best traders, creators, and tokens on the platform</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('traders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'traders'
                ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950'
                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Top Traders
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'creators'
                ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950'
                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Top Creators
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'tokens'
                ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950'
                : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700'
            }`}
          >
            <Coins className="w-5 h-5" />
            Top Tokens
          </button>
        </div>

        {/* Top Traders */}
        {activeTab === 'traders' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-sm text-gray-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Trader</div>
              <div className="col-span-2 text-right">P&L</div>
              <div className="col-span-2 text-right">Trades</div>
              <div className="col-span-3 text-right">Win Rate</div>
            </div>

            {mockTopTraders.map((trader) => (
              <Link
                key={trader.rank}
                href={`/profile/${trader.address}`}
                className={`grid grid-cols-12 gap-4 p-4 md:p-6 rounded-2xl transition-all hover:scale-[1.01] ${
                  trader.rank <= 3
                    ? 'bg-gradient-to-r from-dark-800/80 to-dark-700/50 border border-yellow-500/20'
                    : 'bg-dark-800/50 border border-dark-700 hover:border-neon-green/30'
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {getRankBadge(trader.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="text-3xl">{trader.avatar}</div>
                  <div>
                    <div className="font-bold">{trader.username}</div>
                    <div className="text-sm text-gray-500 font-mono">{trader.address}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-neon-green font-bold">+${trader.pnl.toLocaleString()}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end text-gray-300">
                  {trader.trades}
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-green rounded-full"
                        style={{ width: `${trader.winRate}%` }}
                      />
                    </div>
                    <span className="text-neon-green font-bold w-12 text-right">{trader.winRate}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Top Creators */}
        {activeTab === 'creators' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-sm text-gray-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Creator</div>
              <div className="col-span-2 text-right">Tokens</div>
              <div className="col-span-3 text-right">Total Volume</div>
              <div className="col-span-2 text-right">Graduated</div>
            </div>

            {mockTopCreators.map((creator) => (
              <Link
                key={creator.rank}
                href={`/profile/${creator.address}`}
                className={`grid grid-cols-12 gap-4 p-4 md:p-6 rounded-2xl transition-all hover:scale-[1.01] ${
                  creator.rank <= 3
                    ? 'bg-gradient-to-r from-dark-800/80 to-dark-700/50 border border-purple-500/20'
                    : 'bg-dark-800/50 border border-dark-700 hover:border-neon-purple/30'
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {getRankBadge(creator.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="text-3xl">{creator.avatar}</div>
                  <div>
                    <div className="font-bold">{creator.username}</div>
                    <div className="text-sm text-gray-500 font-mono">{creator.address}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end font-bold">
                  {creator.tokensCreated}
                </div>
                <div className="col-span-3 flex items-center justify-end text-neon-purple font-bold">
                  ${(creator.totalVolume / 1000).toFixed(1)}K
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="px-2 py-1 bg-neon-green/20 text-neon-green rounded-full text-sm font-bold">
                    🎓 {creator.graduated}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Top Tokens */}
        {activeTab === 'tokens' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-sm text-gray-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Token</div>
              <div className="col-span-2 text-right">24h Volume</div>
              <div className="col-span-2 text-right">Holders</div>
              <div className="col-span-3 text-right">24h Change</div>
            </div>

            {mockTopTokens.map((token) => (
              <Link
                key={token.rank}
                href={`/token/${token.symbol.toLowerCase()}`}
                className={`grid grid-cols-12 gap-4 p-4 md:p-6 rounded-2xl transition-all hover:scale-[1.01] ${
                  token.rank <= 3
                    ? 'bg-gradient-to-r from-dark-800/80 to-dark-700/50 border border-cyan-500/20'
                    : 'bg-dark-800/50 border border-dark-700 hover:border-neon-cyan/30'
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {getRankBadge(token.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="text-3xl">{token.image}</div>
                  <div>
                    <div className="font-bold">{token.name}</div>
                    <div className="text-sm text-gray-500">${token.symbol}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end font-bold">
                  ${(token.volume24h / 1000).toFixed(1)}K
                </div>
                <div className="col-span-2 flex items-center justify-end text-gray-300">
                  {token.holders.toLocaleString()}
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <span className="text-neon-green font-bold">+{token.change.toFixed(1)}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
