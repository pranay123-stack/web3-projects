'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, Clock, Flame, Filter, Grid, List } from 'lucide-react';
import Header from '@/components/layout/Header';

const mockTokens = [
  { name: 'PEPE2', symbol: 'PEPE2', price: 0.00001234, change: 156.7, marketCap: 45000, volume: 12500, holders: 234, image: '🐸', progress: 67 },
  { name: 'DOGE MOON', symbol: 'DMOON', price: 0.00005678, change: 89.2, marketCap: 32000, volume: 8900, holders: 189, image: '🌙', progress: 45 },
  { name: 'SOLCAT', symbol: 'SCAT', price: 0.00002345, change: 45.8, marketCap: 28000, volume: 6700, holders: 156, image: '🐱', progress: 38 },
  { name: 'BONK2', symbol: 'BONK2', price: 0.00008901, change: 234.5, marketCap: 67000, volume: 23400, holders: 456, image: '🐕', progress: 82 },
  { name: 'WAGMI', symbol: 'WAGMI', price: 0.00000789, change: -12.3, marketCap: 15000, volume: 3400, holders: 89, image: '💎', progress: 23 },
  { name: 'HODL', symbol: 'HODL', price: 0.00000234, change: -5.6, marketCap: 8000, volume: 1200, holders: 67, image: '💰', progress: 12 },
  { name: 'ROCKET', symbol: 'RKT', price: 0.00003456, change: 78.9, marketCap: 52000, volume: 15600, holders: 312, image: '🚀', progress: 61 },
  { name: 'MOON', symbol: 'MOON', price: 0.00001111, change: 23.4, marketCap: 21000, volume: 4500, holders: 134, image: '🌕', progress: 29 },
];

const sortOptions = [
  { label: 'Trending', value: 'trending', icon: Flame },
  { label: 'Newest', value: 'newest', icon: Clock },
  { label: 'Market Cap', value: 'marketCap', icon: TrendingUp },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTokens = mockTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Explore Tokens</span>
          </h1>
          <p className="text-gray-400">Discover the hottest tokens on the platform</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
            />
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  sortBy === option.value
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                    : 'bg-dark-800 text-gray-400 border border-dark-700 hover:border-dark-600'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-dark-700 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-dark-700 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tokens Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTokens.map((token) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="group p-4 bg-dark-800/50 border border-dark-700 rounded-2xl hover:border-neon-green/50 transition-all hover:transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{token.image}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white group-hover:text-neon-green transition-colors">
                      {token.name}
                    </div>
                    <div className="text-sm text-gray-500">${token.symbol}</div>
                  </div>
                  <div className={`text-sm font-bold ${token.change >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                    {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">Market Cap</div>
                    <div className="font-medium">${(token.marketCap / 1000).toFixed(1)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Volume 24h</div>
                    <div className="font-medium">${(token.volume / 1000).toFixed(1)}K</div>
                  </div>
                </div>

                {/* Bonding Curve Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Bonding Curve</span>
                    <span className="text-neon-green">{token.progress}%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all"
                      style={{ width: `${token.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* List Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-500">
              <div className="col-span-4">Token</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">24h Change</div>
              <div className="col-span-2 text-right">Market Cap</div>
              <div className="col-span-2 text-right">Progress</div>
            </div>

            {filteredTokens.map((token) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="grid grid-cols-12 gap-4 p-4 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-neon-green/50 transition-all items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="text-2xl">{token.image}</div>
                  <div>
                    <div className="font-bold text-white">{token.name}</div>
                    <div className="text-sm text-gray-500">${token.symbol}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono">
                  ${token.price.toFixed(8)}
                </div>
                <div className={`col-span-2 text-right font-bold ${token.change >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                  {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
                </div>
                <div className="col-span-2 text-right">
                  ${(token.marketCap / 1000).toFixed(1)}K
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                        style={{ width: `${token.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-neon-green w-10 text-right">{token.progress}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredTokens.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No tokens found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
