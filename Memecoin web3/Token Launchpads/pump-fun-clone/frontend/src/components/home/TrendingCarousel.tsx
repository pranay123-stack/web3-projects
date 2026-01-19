'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  ExternalLink,
} from 'lucide-react';
import { useTrendingTokens, Token } from '@/hooks/useTrendingTokens';
import { formatNumber, formatPrice, getPercentageColor, formatPercentage, cn } from '@/lib/utils';

interface TrendingCarouselProps {
  className?: string;
}

const TokenCard: React.FC<{ token: Token; index: number }> = ({ token, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex-shrink-0 w-[280px]"
    >
      <Link href={`/token/${token.address}`}>
        <motion.div
          className="relative bg-dark-card rounded-2xl border border-gray-800 overflow-hidden group"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={false}
          />

          {/* Rank badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold',
              index === 0
                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                : index === 1
                ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                : index === 2
                ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30'
                : 'bg-dark-bg/80 text-gray-400 border border-gray-700'
            )}>
              {index < 3 && <Flame className="w-3 h-3" />}
              #{index + 1}
            </div>
          </div>

          {/* Token header */}
          <div className="p-4 pb-0">
            <div className="flex items-center gap-3">
              {/* Token image */}
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-700 group-hover:ring-neon-green/50 transition-all">
                  <Image
                    src={token.image}
                    alt={token.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Bonding progress ring */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-dark-bg rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 transform -rotate-90">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={`${token.bondingCurveProgress * 0.5} 50`}
                      strokeLinecap="round"
                      className="text-neon-green"
                    />
                  </svg>
                </div>
              </div>

              {/* Token info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white truncate">{token.name}</h3>
                  {token.isGraduated && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neon-green/20 text-neon-green rounded">
                      Grad
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">${token.symbol}</p>
              </div>

              {/* External link indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="text-gray-400"
              >
                <ExternalLink className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Market Cap */}
              <div className="bg-dark-bg/50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-0.5">Market Cap</div>
                <div className="text-sm font-semibold text-white">
                  ${formatNumber(token.marketCap)}
                </div>
              </div>

              {/* 24h Change */}
              <div className="bg-dark-bg/50 rounded-lg p-2">
                <div className="text-xs text-gray-500 mb-0.5">24h</div>
                <div className={cn(
                  'text-sm font-semibold',
                  getPercentageColor(token.priceChange24h)
                )}>
                  {formatPercentage(token.priceChange24h)}
                </div>
              </div>
            </div>

            {/* Price and volume row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
              <div>
                <div className="text-xs text-gray-500">Price</div>
                <div className="text-sm font-semibold text-white">
                  ${formatPrice(token.price)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Volume</div>
                <div className="text-sm font-semibold text-gray-300">
                  ${formatNumber(token.volume24h)}
                </div>
              </div>
            </div>

            {/* Bonding progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Bonding Progress</span>
                <span className="text-neon-green">
                  {token.bondingCurveProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(token.bondingCurveProgress, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex gap-4 overflow-hidden">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 w-[280px] bg-dark-card rounded-2xl border border-gray-800 p-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gray-700/50 rounded-xl animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-gray-700/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="h-12 bg-gray-700/30 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-700/30 rounded-lg animate-pulse" />
        </div>
        <div className="h-2 bg-gray-700/50 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ className }) => {
  const { data, isLoading } = useTrendingTokens(12);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const x = useMotionValue(0);
  const controls = useAnimation();

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [data]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={cn('py-12', className)}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              <TrendingUp className="w-6 h-6 text-neon-green" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Trending Now</h2>
            <span className="px-2 py-1 text-xs bg-neon-green/10 text-neon-green rounded-full border border-neon-green/30">
              Live
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'p-2 rounded-lg border transition-colors',
                canScrollLeft
                  ? 'bg-dark-card border-gray-700 hover:border-neon-green/50 text-white'
                  : 'bg-dark-card/50 border-gray-800 text-gray-600 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'p-2 rounded-lg border transition-colors',
                canScrollRight
                  ? 'bg-dark-card border-gray-700 hover:border-neon-green/50 text-white'
                  : 'bg-dark-card/50 border-gray-800 text-gray-600 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <Link
              href="/explore?sort=trending"
              className="ml-2 text-sm text-neon-green hover:underline"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Gradient fade left */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />

          {/* Gradient fade right */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />

          {/* Scrollable container */}
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              data?.tokens.map((token, index) => (
                <TokenCard key={token.id} token={token} index={index} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingCarousel;
