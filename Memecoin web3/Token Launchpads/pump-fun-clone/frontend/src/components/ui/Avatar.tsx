'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  border?: boolean;
  borderColor?: 'green' | 'purple' | 'gradient' | 'none';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: () => void;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const shapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-xl',
};

const borderStyles = {
  green: 'ring-2 ring-neon-green/50',
  purple: 'ring-2 ring-neon-purple/50',
  gradient: 'ring-2 ring-gradient-to-r from-neon-green to-neon-purple',
  none: '',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const statusDotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

// Generate a consistent color based on string
const getColorFromString = (str: string): string => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-pink-500',
    'from-violet-500 to-purple-500',
    'from-cyan-500 to-blue-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = 'User',
  size = 'md',
  shape = 'circle',
  border = false,
  borderColor = 'green',
  status,
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;
  const initials = getInitials(name);
  const gradientColor = getColorFromString(name);

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0',
        'overflow-hidden',
        sizeStyles[size],
        shapeStyles[shape],
        border && borderStyles[borderColor],
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {/* Image or Fallback */}
      {showFallback ? (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br flex items-center justify-center',
            'text-white font-bold',
            gradientColor
          )}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Status indicator */}
      {status && (
        <motion.span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-dark-bg',
            statusColors[status],
            statusDotSizes[size]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {status === 'online' && (
            <motion.span
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.span>
      )}
    </motion.div>
  );
};

// Avatar Group component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
          style={{ zIndex: displayAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            border
            borderColor="none"
            className="ring-2 ring-dark-bg"
          />
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: displayAvatars.length * 0.05 }}
          className={cn(
            'flex items-center justify-center',
            'bg-dark-card border-2 border-dark-bg',
            'text-gray-400 font-medium text-sm',
            sizeStyles[size],
            'rounded-full'
          )}
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  );
};

// Token Avatar with special styling
export const TokenAvatar: React.FC<
  Omit<AvatarProps, 'shape'> & { verified?: boolean }
> = ({ verified, ...props }) => (
  <div className="relative">
    <Avatar shape="rounded" {...props} />
    {verified && (
      <motion.div
        className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-green rounded-full flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>
    )}
  </div>
);

export default Avatar;
