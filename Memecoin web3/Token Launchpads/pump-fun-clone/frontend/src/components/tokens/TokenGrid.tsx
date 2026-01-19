'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TokenCard } from './TokenCard';
import { TokenCardSkeleton } from '../ui/Skeleton';

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
  creator?: {
    address: string;
    name?: string;
    avatar?: string;
  };
  status?: 'new' | 'trending' | 'hot' | 'graduated';
  bondingProgress?: number;
}

interface TokenGridProps {
  tokens: Token[];
  isLoading?: boolean;
  loadingCount?: number;
  variant?: 'default' | 'compact' | 'featured';
  columns?: 2 | 3 | 4;
  className?: string;
  emptyMessage?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  isLoading = false,
  loadingCount = 8,
  variant = 'default',
  columns = 4,
  className,
  emptyMessage = 'No tokens found',
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('grid gap-4', columnClasses[columns], className)}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <TokenCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (tokens.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tokens Yet</h3>
        <p className="text-gray-500 max-w-sm">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn('grid gap-4', columnClasses[columns], className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {tokens.map((token) => (
        <motion.div key={token.id} variants={itemVariants}>
          <TokenCard token={token} variant={variant} />
        </motion.div>
      ))}
    </motion.div>
  );
};

// Featured tokens grid with special layout
export const FeaturedTokenGrid: React.FC<{
  tokens: Token[];
  isLoading?: boolean;
  className?: string;
}> = ({ tokens, isLoading, className }) => {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}>
        <div className="lg:col-span-2">
          <TokenCardSkeleton />
        </div>
        <div className="space-y-4">
          <TokenCardSkeleton />
          <TokenCardSkeleton />
        </div>
      </div>
    );
  }

  if (tokens.length === 0) return null;

  const [featured, ...rest] = tokens;
  const secondary = rest.slice(0, 2);

  return (
    <motion.div
      className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Featured (large) card */}
      <motion.div className="lg:col-span-2" variants={itemVariants}>
        <TokenCard token={featured} variant="featured" className="h-full" />
      </motion.div>

      {/* Secondary cards */}
      <div className="space-y-4">
        {secondary.map((token) => (
          <motion.div key={token.id} variants={itemVariants}>
            <TokenCard token={token} variant="default" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TokenGrid;
