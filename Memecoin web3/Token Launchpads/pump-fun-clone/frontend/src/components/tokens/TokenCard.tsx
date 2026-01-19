'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Avatar';
import { Badge, NewBadge, TrendingBadge, GraduatedBadge, HotBadge } from '../ui/Badge';
import { PriceChange } from '../common/PriceChange';

interface TokenCardProps {
  token: {
    id: string;
    name: string;
    symbol: string;
    image?: string;
    price: number;
    priceChange24h: number;
    marketCap: number;
    volume24h?: number;
    holders?: number;
    createdAt?: Date;
    creator?: {
      address: string;
      name?: string;
      avatar?: string;
    };
    status?: 'new' | 'trending' | 'hot' | 'graduated';
    bondingProgress?: number;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

// Mini sparkline chart component
const MiniChart: React.FC<{ data: number[]; positive: boolean }> = ({ data, positive }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${positive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={positive ? '#39ff14' : '#ef4444'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? '#39ff14' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#gradient-${positive ? 'up' : 'down'})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#39ff14' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Generate mock chart data based on price change
const generateChartData = (priceChange: number): number[] => {
  const baseValue = 100;
  const points = 20;
  const trend = priceChange > 0 ? 1 : -1;

  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const noise = (Math.random() - 0.5) * 10;
    return baseValue + (trend * progress * Math.abs(priceChange) * 2) + noise;
  });
};

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  variant = 'default',
  className,
}) => {
  const chartData = generateChartData(token.priceChange24h);
  const isPositive = token.priceChange24h >= 0;

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number): string => {
    if (price < 0.0001) return `$${price.toExponential(2)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const StatusBadge = () => {
    switch (token.status) {
      case 'new':
        return <NewBadge />;
      case 'trending':
        return <TrendingBadge />;
      case 'hot':
        return <HotBadge />;
      case 'graduated':
        return <GraduatedBadge />;
      default:
        return null;
    }
  };

  if (variant === 'compact') {
    return (
      <Link href={`/token/${token.id}`}>
        <motion.div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl',
            'bg-dark-card/60 border border-white/5',
            'hover:bg-dark-card/80 hover:border-neon-green/20',
            'transition-all duration-300 cursor-pointer',
            className
          )}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar src={token.image} name={token.name} size="sm" shape="rounded" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">{token.symbol}</div>
            <div className="text-xs text-gray-500">{formatPrice(token.price)}</div>
          </div>
          <PriceChange value={token.priceChange24h} size="sm" />
        </motion.div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/token/${token.id}`}>
        <motion.div
          className={cn(
            'relative group rounded-2xl overflow-hidden',
            'bg-gradient-to-br from-dark-card/90 to-dark-card/70',
            'border border-white/10',
            'hover:border-neon-green/30',
            'shadow-xl shadow-black/20',
            'transition-all duration-300',
            className
          )}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 via-transparent to-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar src={token.image} name={token.name} size="xl" shape="rounded" border />
                <div>
                  <h3 className="text-xl font-bold text-white">{token.name}</h3>
                  <p className="text-gray-400">${token.symbol}</p>
                </div>
              </div>
              <StatusBadge />
            </div>

            {/* Chart */}
            <div className="h-32 mb-4">
              <MiniChart data={chartData} positive={isPositive} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-lg font-bold text-white">{formatPrice(token.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">24h Change</p>
                <PriceChange value={token.priceChange24h} size="lg" showIcon />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                <p className="font-medium text-white">{formatNumber(token.marketCap)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Holders</p>
                <p className="font-medium text-white">{token.holders?.toLocaleString() || '0'}</p>
              </div>
            </div>

            {/* Creator */}
            {token.creator && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={token.creator.avatar} name={token.creator.name || 'Creator'} size="xs" />
                  <span className="text-xs text-gray-500">
                    {token.creator.name || `${token.creator.address.slice(0, 4)}...${token.creator.address.slice(-4)}`}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {token.createdAt && new Date(token.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/token/${token.id}`}>
      <motion.div
        className={cn(
          'relative group rounded-2xl overflow-hidden',
          'bg-dark-card/60 backdrop-blur-sm',
          'border border-white/5',
          'hover:border-neon-green/20',
          'hover:shadow-[0_0_30px_rgba(57,255,20,0.1)]',
          'transition-all duration-300',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={token.image} name={token.name} size="lg" shape="rounded" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white truncate">{token.name}</h3>
                <StatusBadge />
              </div>
              <p className="text-sm text-gray-500">${token.symbol}</p>
            </div>
          </div>

          {/* Mini chart */}
          <div className="h-16 mb-3 rounded-lg overflow-hidden bg-white/5">
            <MiniChart data={chartData} positive={isPositive} />
          </div>

          {/* Price and change */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Price</p>
              <p className="text-lg font-bold text-white">{formatPrice(token.price)}</p>
            </div>
            <PriceChange value={token.priceChange24h} showIcon />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-gray-500">MCap</p>
              <p className="font-medium text-gray-300">{formatNumber(token.marketCap)}</p>
            </div>
            {token.volume24h && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Volume</p>
                <p className="font-medium text-gray-300">{formatNumber(token.volume24h)}</p>
              </div>
            )}
          </div>

          {/* Bonding progress */}
          {token.bondingProgress !== undefined && token.bondingProgress < 100 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Bonding Progress</span>
                <span className="text-neon-green">{token.bondingProgress.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-green to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${token.bondingProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Creator */}
          {token.creator && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
              <Avatar src={token.creator.avatar} name={token.creator.name || 'Creator'} size="xs" />
              <span className="text-xs text-gray-500 truncate">
                by {token.creator.name || `${token.creator.address.slice(0, 6)}...`}
              </span>
            </div>
          )}
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </motion.div>
    </Link>
  );
};

export default TokenCard;
