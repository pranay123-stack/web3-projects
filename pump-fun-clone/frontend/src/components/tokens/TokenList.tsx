'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar } from '../ui/Avatar';
import { Badge, NewBadge, TrendingBadge, HotBadge, GraduatedBadge } from '../ui/Badge';
import { PriceChange } from '../common/PriceChange';
import { TokenListItemSkeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';

interface Token {
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
  status?: 'new' | 'trending' | 'hot' | 'graduated';
}

interface TokenListProps {
  tokens: Token[];
  isLoading?: boolean;
  loadingCount?: number;
  className?: string;
  showRank?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
  onTokenClick?: (token: Token) => void;
}

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

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  switch (status) {
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

const TokenListItem: React.FC<{
  token: Token;
  rank?: number;
  showActions?: boolean;
  onClick?: () => void;
}> = ({ token, rank, showActions, onClick }) => {
  return (
    <motion.div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl',
        'bg-dark-card/40 border border-white/5',
        'hover:bg-dark-card/60 hover:border-neon-green/20',
        'transition-all duration-300 cursor-pointer'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 5 }}
      layout
    >
      {/* Rank */}
      {rank !== undefined && (
        <div className="w-8 text-center">
          <span
            className={cn(
              'text-lg font-bold',
              rank === 1 && 'text-yellow-400',
              rank === 2 && 'text-gray-300',
              rank === 3 && 'text-amber-600',
              rank > 3 && 'text-gray-500'
            )}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Token info */}
      <Link href={`/token/${token.id}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={onClick}>
        <Avatar src={token.image} name={token.name} size="md" shape="rounded" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{token.name}</span>
            <StatusBadge status={token.status} />
          </div>
          <span className="text-sm text-gray-500">${token.symbol}</span>
        </div>
      </Link>

      {/* Price */}
      <div className="hidden sm:block text-right min-w-[100px]">
        <div className="font-medium text-white">{formatPrice(token.price)}</div>
        <PriceChange value={token.priceChange24h} size="sm" />
      </div>

      {/* Market Cap */}
      <div className="hidden md:block text-right min-w-[100px]">
        <div className="text-xs text-gray-500 mb-0.5">MCap</div>
        <div className="font-medium text-gray-300">{formatNumber(token.marketCap)}</div>
      </div>

      {/* Volume */}
      {token.volume24h && (
        <div className="hidden lg:block text-right min-w-[100px]">
          <div className="text-xs text-gray-500 mb-0.5">24h Vol</div>
          <div className="font-medium text-gray-300">{formatNumber(token.volume24h)}</div>
        </div>
      )}

      {/* Holders */}
      {token.holders && (
        <div className="hidden xl:block text-right min-w-[80px]">
          <div className="text-xs text-gray-500 mb-0.5">Holders</div>
          <div className="font-medium text-gray-300">{token.holders.toLocaleString()}</div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle trade
            }}
          >
            Trade
          </Button>
        </div>
      )}

      {/* Mobile price */}
      <div className="sm:hidden text-right">
        <div className="font-medium text-white text-sm">{formatPrice(token.price)}</div>
        <PriceChange value={token.priceChange24h} size="sm" />
      </div>

      {/* Hover indicator */}
      <svg
        className="w-5 h-5 text-gray-600 group-hover:text-neon-green transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.div>
  );
};

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading = false,
  loadingCount = 5,
  className,
  showRank = false,
  showActions = false,
  emptyMessage = 'No tokens found',
  onTokenClick,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <TokenListItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (tokens.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 mb-4 rounded-xl bg-white/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
        {showRank && <div className="w-8 text-center">#</div>}
        <div className="flex-1">Token</div>
        <div className="hidden sm:block text-right min-w-[100px]">Price</div>
        <div className="hidden md:block text-right min-w-[100px]">Market Cap</div>
        <div className="hidden lg:block text-right min-w-[100px]">24h Volume</div>
        <div className="hidden xl:block text-right min-w-[80px]">Holders</div>
        {showActions && <div className="w-20" />}
        <div className="w-5" />
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {tokens.map((token, index) => (
          <TokenListItem
            key={token.id}
            token={token}
            rank={showRank ? index + 1 : undefined}
            showActions={showActions}
            onClick={() => onTokenClick?.(token)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TokenList;
