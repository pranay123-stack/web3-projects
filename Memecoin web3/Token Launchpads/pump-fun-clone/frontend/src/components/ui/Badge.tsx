'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type BadgeVariant = 'new' | 'trending' | 'graduated' | 'hot' | 'live' | 'default' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  new: cn(
    'bg-gradient-to-r from-neon-green/20 to-emerald-500/20',
    'text-neon-green',
    'border border-neon-green/30',
    'shadow-[0_0_10px_rgba(57,255,20,0.2)]'
  ),
  trending: cn(
    'bg-gradient-to-r from-orange-500/20 to-amber-500/20',
    'text-orange-400',
    'border border-orange-500/30',
    'shadow-[0_0_10px_rgba(249,115,22,0.2)]'
  ),
  graduated: cn(
    'bg-gradient-to-r from-neon-purple/20 to-purple-500/20',
    'text-neon-purple',
    'border border-neon-purple/30',
    'shadow-[0_0_10px_rgba(191,0,255,0.2)]'
  ),
  hot: cn(
    'bg-gradient-to-r from-red-500/20 to-pink-500/20',
    'text-red-400',
    'border border-red-500/30',
    'shadow-[0_0_10px_rgba(239,68,68,0.2)]'
  ),
  live: cn(
    'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
    'text-green-400',
    'border border-green-500/30'
  ),
  default: cn(
    'bg-white/5',
    'text-gray-400',
    'border border-white/10'
  ),
  success: cn(
    'bg-green-500/20',
    'text-green-400',
    'border border-green-500/30'
  ),
  warning: cn(
    'bg-yellow-500/20',
    'text-yellow-400',
    'border border-yellow-500/30'
  ),
  danger: cn(
    'bg-red-500/20',
    'text-red-400',
    'border border-red-500/30'
  ),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const pulseVariants: Record<BadgeVariant, string> = {
  new: 'before:bg-neon-green',
  trending: 'before:bg-orange-500',
  graduated: 'before:bg-neon-purple',
  hot: 'before:bg-red-500',
  live: 'before:bg-green-500',
  default: 'before:bg-gray-400',
  success: 'before:bg-green-500',
  warning: 'before:bg-yellow-500',
  danger: 'before:bg-red-500',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  pulse = false,
  icon,
}) => {
  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        pulse && [
          'relative',
          'before:absolute before:w-2 before:h-2 before:rounded-full',
          'before:-left-0.5 before:top-1/2 before:-translate-y-1/2',
          'before:animate-pulse',
          pulseVariants[variant],
        ],
        pulse && 'pl-4',
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.span>
  );
};

// Preset badges with icons
export const NewBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="new"
    size="sm"
    className={className}
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
      </svg>
    }
  >
    NEW
  </Badge>
);

export const TrendingBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="trending"
    size="sm"
    className={className}
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    }
  >
    TRENDING
  </Badge>
);

export const GraduatedBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="graduated"
    size="sm"
    className={className}
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    }
  >
    GRADUATED
  </Badge>
);

export const HotBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="hot"
    size="sm"
    className={className}
    pulse
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    }
  >
    HOT
  </Badge>
);

export const LiveBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Badge
    variant="live"
    size="sm"
    className={className}
    pulse
  >
    LIVE
  </Badge>
);

export default Badge;
