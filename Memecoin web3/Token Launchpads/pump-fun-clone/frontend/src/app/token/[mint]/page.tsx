'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Share2,
  Twitter,
  MessageCircle,
  Globe,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Mock token data
const mockToken = {
  mint: 'PEPE2abc123xyz',
  name: 'PEPE 2.0',
  symbol: 'PEPE2',
  description: 'The next evolution of PEPE. Built on Solana for maximum speed and minimum fees. Join the revolution!',
  image: 'https://via.placeholder.com/200',
  creator: '7xKXt...9mPq',
  createdAt: '2024-01-15T10:30:00Z',
  marketCap: 125000,
  price: 0.00001234,
  priceChange24h: 45.67,
  volume24h: 89000,
  holders: 1234,
  bondingProgress: 68,
  virtualSolReserves: 45.5,
  virtualTokenReserves: 650000000,
  totalSupply: 1000000000,
  twitter: 'https://twitter.com/pepe2sol',
  telegram: 'https://t.me/pepe2sol',
  website: 'https://pepe2.sol',
};

const mockTrades = [
  { type: 'buy', address: '7xKX...9mPq', amount: 5000000, sol: 0.5, time: '2 min ago' },
  { type: 'sell', address: '3mNp...7kLw', amount: 2500000, sol: 0.28, time: '5 min ago' },
  { type: 'buy', address: '9pRt...2nXz', amount: 10000000, sol: 1.1, time: '8 min ago' },
  { type: 'buy', address: '5kMn...8vCx', amount: 3000000, sol: 0.32, time: '12 min ago' },
  { type: 'sell', address: '2wQp...4jHy', amount: 1500000, sol: 0.15, time: '15 min ago' },
  { type: 'buy', address: '8nKr...6mWz', amount: 8000000, sol: 0.85, time: '20 min ago' },
];

const mockHolders = [
  { address: '7xKXt...9mPq', amount: 150000000, percentage: 15 },
  { address: '3mNpQ...7kLw', amount: 89000000, percentage: 8.9 },
  { address: '9pRtY...2nXz', amount: 75000000, percentage: 7.5 },
  { address: '5kMnB...8vCx', amount: 52000000, percentage: 5.2 },
  { address: '2wQpL...4jHy', amount: 43000000, percentage: 4.3 },
];

export default function TokenPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<'trades' | 'holders' | 'about'>('trades');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [copied, setCopied] = useState(false);

  const token = mockToken; // In real app, fetch by mint

  const copyAddress = () => {
    navigator.clipboard.writeText(token.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateOutput = () => {
    if (!amount || isNaN(parseFloat(amount))) return '0';
    const inputAmount = parseFloat(amount);
    if (tradeType === 'buy') {
      // Calculate tokens received for SOL input
      const tokensOut = (inputAmount / token.price).toFixed(0);
      return parseInt(tokensOut).toLocaleString();
    } else {
      // Calculate SOL received for token input
      const solOut = (inputAmount * token.price).toFixed(6);
      return solOut;
    }
  };

  const handleTrade = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    // Execute trade logic here
    console.log(`${tradeType} ${amount} ${tradeType === 'buy' ? 'SOL' : 'tokens'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Info & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Header */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-cyan/20 flex items-center justify-center text-4xl">
                  {token.image.startsWith('http') ? (
                    <img src={token.image} alt={token.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    token.symbol.slice(0, 2)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{token.name}</h1>
                    <span className="text-gray-400">${token.symbol}</span>
                    {token.bondingProgress >= 100 ? (
                      <span className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded-full">Graduated</span>
                    ) : (
                      <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">Bonding</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span className="font-mono">{token.mint.slice(0, 8)}...{token.mint.slice(-4)}</span>
                      <Copy className="w-3 h-3" />
                      {copied && <span className="text-neon-green text-xs">Copied!</span>}
                    </button>
                    <a
                      href={`https://solscan.io/token/${token.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Solscan
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  {token.twitter && (
                    <a
                      href={token.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {token.telegram && (
                    <a
                      href={token.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  )}
                  {token.website && (
                    <a
                      href={token.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  <button className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Price</div>
                  <div className="text-xl font-bold">${token.price.toFixed(8)}</div>
                  <div className={`text-sm ${token.priceChange24h >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </div>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Market Cap</div>
                  <div className="text-xl font-bold">${(token.marketCap / 1000).toFixed(1)}K</div>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">24h Volume</div>
                  <div className="text-xl font-bold">${(token.volume24h / 1000).toFixed(1)}K</div>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Holders</div>
                  <div className="text-xl font-bold">{token.holders.toLocaleString()}</div>
                </div>
              </div>

              {/* Bonding Curve Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Bonding Curve Progress</span>
                  <span className="text-neon-green font-bold">{token.bondingProgress}%</span>
                </div>
                <div className="h-4 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-500"
                    style={{ width: `${token.bondingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{token.virtualSolReserves.toFixed(2)} SOL raised</span>
                  <span>69 SOL to graduate</span>
                </div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Price Chart</h2>
                <div className="flex gap-2">
                  {['5m', '15m', '1h', '4h', '1d'].map((tf) => (
                    <button
                      key={tf}
                      className="px-3 py-1 text-sm bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80 bg-dark-700/50 rounded-xl flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Price chart will be integrated here</p>
                  <p className="text-sm">TradingView / Lightweight Charts</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl overflow-hidden">
              <div className="flex border-b border-dark-700">
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'trades'
                      ? 'bg-dark-700/50 text-neon-green'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Recent Trades
                </button>
                <button
                  onClick={() => setActiveTab('holders')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'holders'
                      ? 'bg-dark-700/50 text-neon-green'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top Holders
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`flex-1 px-6 py-4 font-medium transition-colors ${
                    activeTab === 'about'
                      ? 'bg-dark-700/50 text-neon-green'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  About
                </button>
              </div>

              <div className="p-6">
                {/* Trades Tab */}
                {activeTab === 'trades' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4 text-sm text-gray-500 pb-2 border-b border-dark-700">
                      <div>Type</div>
                      <div>Address</div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">SOL</div>
                      <div className="text-right">Time</div>
                    </div>
                    {mockTrades.map((trade, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 py-3 text-sm border-b border-dark-700/50">
                        <div className={trade.type === 'buy' ? 'text-neon-green' : 'text-red-500'}>
                          {trade.type === 'buy' ? 'Buy' : 'Sell'}
                        </div>
                        <div className="font-mono text-gray-400">{trade.address}</div>
                        <div className="text-right">{(trade.amount / 1000000).toFixed(2)}M</div>
                        <div className="text-right">{trade.sol.toFixed(4)}</div>
                        <div className="text-right text-gray-500">{trade.time}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Holders Tab */}
                {activeTab === 'holders' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-500 pb-2 border-b border-dark-700">
                      <div>Rank</div>
                      <div>Address</div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">%</div>
                    </div>
                    {mockHolders.map((holder, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 py-3 text-sm border-b border-dark-700/50">
                        <div className="font-bold">#{index + 1}</div>
                        <div className="font-mono text-gray-400">{holder.address}</div>
                        <div className="text-right">{(holder.amount / 1000000).toFixed(2)}M</div>
                        <div className="text-right text-neon-green">{holder.percentage}%</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Description</h3>
                      <p className="text-gray-400">{token.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-bold mb-2">Creator</h3>
                        <Link
                          href={`/profile/${token.creator}`}
                          className="text-neon-green hover:underline font-mono"
                        >
                          {token.creator}
                        </Link>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Created</h3>
                        <p className="text-gray-400">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Total Supply</h3>
                        <p className="text-gray-400">{(token.totalSupply / 1000000000).toFixed(2)}B</p>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">Token Address</h3>
                        <p className="text-gray-400 font-mono text-sm break-all">{token.mint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="space-y-6">
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Trade {token.symbol}</h2>

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    tradeType === 'buy'
                      ? 'bg-neon-green text-dark-950'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    tradeType === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {tradeType === 'buy' ? 'Amount (SOL)' : 'Amount (Tokens)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-lg focus:outline-none focus:border-neon-green"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {tradeType === 'buy' ? 'SOL' : token.symbol}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mb-4">
                {tradeType === 'buy' ? (
                  <>
                    <button
                      onClick={() => setAmount('0.1')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      0.1 SOL
                    </button>
                    <button
                      onClick={() => setAmount('0.5')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      0.5 SOL
                    </button>
                    <button
                      onClick={() => setAmount('1')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      1 SOL
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setAmount('25')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setAmount('50')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setAmount('100')}
                      className="flex-1 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 transition-colors"
                    >
                      100%
                    </button>
                  </>
                )}
              </div>

              {/* Slippage */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Slippage Tolerance</label>
                <div className="flex gap-2">
                  {[0.5, 1, 2, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                        slippage === s
                          ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                          : 'bg-dark-700 hover:bg-dark-600'
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Estimate */}
              <div className="p-4 bg-dark-700/50 rounded-xl mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">You will receive</span>
                </div>
                <div className="text-2xl font-bold">
                  {calculateOutput()} {tradeType === 'buy' ? token.symbol : 'SOL'}
                </div>
              </div>

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  tradeType === 'buy'
                    ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 hover:opacity-90'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {connected ? `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}` : 'Connect Wallet'}
              </button>

              {/* Warning for new tokens */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Trading meme coins is risky. Only invest what you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
