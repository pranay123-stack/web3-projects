'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, TrendingUp, Zap, Plus, Search } from 'lucide-react';
import Header from '@/components/layout/Header';

// Mock data for demo
const trendingTokens = [
  { name: 'PEPE2', symbol: 'PEPE2', price: 0.00001234, change: 156.7, marketCap: 45000, image: '🐸' },
  { name: 'DOGE MOON', symbol: 'DMOON', price: 0.00005678, change: 89.2, marketCap: 32000, image: '🌙' },
  { name: 'SOLCAT', symbol: 'SCAT', price: 0.00002345, change: 45.8, marketCap: 28000, image: '🐱' },
  { name: 'BONK2', symbol: 'BONK2', price: 0.00008901, change: 234.5, marketCap: 67000, image: '🐕' },
];

const newTokens = [
  { name: 'ROCKET', symbol: 'RKT', price: 0.00000123, change: 0, marketCap: 3000, image: '🚀', createdAt: '2 min ago' },
  { name: 'MOONSHOT', symbol: 'MOON', price: 0.00000456, change: 12.5, marketCap: 4500, image: '🌕', createdAt: '5 min ago' },
  { name: 'WAGMI', symbol: 'WAGMI', price: 0.00000789, change: 8.3, marketCap: 5200, image: '💎', createdAt: '8 min ago' },
  { name: 'HODL', symbol: 'HODL', price: 0.00000234, change: -2.1, marketCap: 2800, image: '💰', createdAt: '12 min ago' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Launch Your Token</span>
            <br />
            <span className="text-white">In Seconds</span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Create, trade, and discover the next big memecoin on Solana.
            No coding required. Fair launch guaranteed.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tokens by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-dark-800/50 border border-dark-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/50 transition-colors"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/create"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Token
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 px-8 py-4 bg-dark-700 text-white font-bold rounded-xl border border-dark-600 hover:border-neon-green/50 transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              Explore Tokens
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-4 py-8 border-y border-dark-700">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-neon-green">1,234</div>
            <div className="text-gray-500">Tokens Created</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon-purple">$2.5M</div>
            <div className="text-gray-500">Total Volume</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon-cyan">5,678</div>
            <div className="text-gray-500">Active Traders</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon-pink">89</div>
            <div className="text-gray-500">Graduated Tokens</div>
          </div>
        </div>
      </section>

      {/* Trending Tokens - King of the Hill */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-neon-green" />
            <h2 className="text-2xl font-bold">King of the Hill</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingTokens.map((token, index) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="group p-4 bg-dark-800/50 border border-dark-700 rounded-2xl hover:border-neon-green/50 transition-all hover:transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{token.image}</div>
                  <div>
                    <div className="font-bold text-white group-hover:text-neon-green transition-colors">
                      {token.name}
                    </div>
                    <div className="text-sm text-gray-500">${token.symbol}</div>
                  </div>
                  {index === 0 && (
                    <div className="ml-auto px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded-full">
                      👑 #1
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">MC: ${(token.marketCap / 1000).toFixed(1)}K</span>
                  <span className={token.change >= 0 ? 'text-neon-green' : 'text-red-500'}>
                    {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Tokens */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="w-6 h-6 text-neon-purple" />
            <h2 className="text-2xl font-bold">New Launches</h2>
            <div className="ml-2 px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded-full animate-pulse">
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newTokens.map((token) => (
              <Link
                key={token.symbol}
                href={`/token/${token.symbol.toLowerCase()}`}
                className="group p-4 bg-dark-800/50 border border-dark-700 rounded-2xl hover:border-neon-purple/50 transition-all hover:transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{token.image}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white group-hover:text-neon-purple transition-colors">
                      {token.name}
                    </div>
                    <div className="text-sm text-gray-500">${token.symbol}</div>
                  </div>
                  <div className="text-xs text-gray-500">{token.createdAt}</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">MC: ${(token.marketCap / 1000).toFixed(1)}K</span>
                  <span className={token.change >= 0 ? 'text-neon-green' : 'text-red-500'}>
                    {token.change >= 0 ? '+' : ''}{token.change.toFixed(1)}%
                  </span>
                </div>

                {/* Bonding curve progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Bonding Curve</span>
                    <span className="text-neon-green">{Math.floor(Math.random() * 30 + 5)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
                      style={{ width: `${Math.floor(Math.random() * 30 + 5)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 py-16 bg-dark-900/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-green/20 rounded-2xl flex items-center justify-center">
                <Plus className="w-8 h-8 text-neon-green" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Create Token</h3>
              <p className="text-gray-400">
                Pick a name, symbol, and image. Your token is created instantly with a fair bonding curve.
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-purple/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-neon-purple" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Trade & Grow</h3>
              <p className="text-gray-400">
                Buy and sell on the bonding curve. As more people buy, the price increases.
              </p>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-2xl flex items-center justify-center">
                <Rocket className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Graduate to DEX</h3>
              <p className="text-gray-400">
                Once the bonding curve fills, liquidity is automatically added to Raydium.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-dark-700">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="text-gray-500">
            © 2024 PumpFun Clone. Built on Solana.
          </div>
          <div className="flex gap-6 text-gray-500">
            <a href="#" className="hover:text-neon-green transition-colors">Twitter</a>
            <a href="#" className="hover:text-neon-green transition-colors">Telegram</a>
            <a href="#" className="hover:text-neon-green transition-colors">Discord</a>
            <a href="#" className="hover:text-neon-green transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
