'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}) => {
  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const baseStyles = cn(
    'bg-white/5 relative overflow-hidden',
    variantStyles[variant],
    variant === 'text' && !height && 'h-4',
    variant === 'circular' && !width && !height && 'w-10 h-10',
    className
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div className={baseStyles} style={style}>
      {animation === 'pulse' && (
        <motion.div
          className="absolute inset-0 bg-white/5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {animation === 'shimmer' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          animate={{ translateX: ['−100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

// Token Card Skeleton
export const TokenCardSkeleton: React.FC = () => (
  <div className="bg-dark-card/60 rounded-2xl p-4 border border-white/5">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={20} className="mb-2" />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
    <Skeleton variant="rounded" width="100%" height={80} className="mb-4" />
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton variant="text" width="50%" height={12} className="mb-1" />
        <Skeleton variant="text" width="70%" height={16} />
      </div>
      <div>
        <Skeleton variant="text" width="50%" height={12} className="mb-1" />
        <Skeleton variant="text" width="70%" height={16} />
      </div>
    </div>
  </div>
);

// Token List Item Skeleton
export const TokenListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-dark-card/40 rounded-xl border border-white/5">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 min-w-0">
      <Skeleton variant="text" width={120} height={18} className="mb-1" />
      <Skeleton variant="text" width={80} height={14} />
    </div>
    <div className="text-right">
      <Skeleton variant="text" width={80} height={18} className="mb-1 ml-auto" />
      <Skeleton variant="text" width={60} height={14} className="ml-auto" />
    </div>
    <Skeleton variant="rounded" width={100} height={40} />
  </div>
);

// Trade History Skeleton
export const TradeHistorySkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <Skeleton variant="circular" width={32} height={32} />
    <div className="flex-1">
      <Skeleton variant="text" width={100} height={14} className="mb-1" />
      <Skeleton variant="text" width={60} height={12} />
    </div>
    <Skeleton variant="text" width={70} height={16} />
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-dark-card/60 rounded-xl p-4 border border-white/5">
    <Skeleton variant="text" width={60} height={14} className="mb-2" />
    <Skeleton variant="text" width={100} height={28} className="mb-1" />
    <Skeleton variant="text" width={80} height={12} />
  </div>
);

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="flex items-center gap-4">
    <Skeleton variant="circular" width={64} height={64} />
    <div>
      <Skeleton variant="text" width={150} height={24} className="mb-2" />
      <Skeleton variant="text" width={200} height={14} />
    </div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="relative w-full rounded-xl overflow-hidden" style={{ height }}>
    <Skeleton variant="rectangular" width="100%" height="100%" />
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="w-8 h-8 border-2 border-neon-green/30 border-t-neon-green rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <div className="flex items-center gap-4 p-4 border-b border-white/5">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === 0 ? 150 : i === columns - 1 ? 80 : 100}
        height={16}
        className={i === 0 ? '' : 'flex-1'}
      />
    ))}
  </div>
);

// Form Field Skeleton
export const FormFieldSkeleton: React.FC = () => (
  <div className="space-y-2">
    <Skeleton variant="text" width={80} height={14} />
    <Skeleton variant="rounded" width="100%" height={44} />
  </div>
);

export default Skeleton;
