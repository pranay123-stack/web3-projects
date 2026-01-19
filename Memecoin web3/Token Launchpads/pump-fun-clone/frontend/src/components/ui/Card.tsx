'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glow';
  hoverEffect?: boolean;
  glowColor?: 'green' | 'purple' | 'blue' | 'pink';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const glowColors = {
  green: 'hover:shadow-[0_0_40px_rgba(57,255,20,0.15)]',
  purple: 'hover:shadow-[0_0_40px_rgba(191,0,255,0.15)]',
  blue: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]',
  pink: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]',
};

const borderGlowColors = {
  green: 'before:bg-gradient-to-r before:from-neon-green/50 before:via-transparent before:to-neon-green/50',
  purple: 'before:bg-gradient-to-r before:from-neon-purple/50 before:via-transparent before:to-neon-purple/50',
  blue: 'before:bg-gradient-to-r before:from-blue-500/50 before:via-transparent before:to-blue-500/50',
  pink: 'before:bg-gradient-to-r before:from-pink-500/50 before:via-transparent before:to-pink-500/50',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverEffect = true,
  glowColor = 'green',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = cn(
    'relative rounded-2xl overflow-hidden',
    'backdrop-blur-xl',
    paddingStyles[padding]
  );

  const variantStyles = {
    default: cn(
      'bg-dark-card/80',
      'border border-white/5',
      hoverEffect && 'hover:border-white/10 transition-all duration-300',
      hoverEffect && glowColors[glowColor]
    ),
    elevated: cn(
      'bg-gradient-to-br from-dark-card/90 to-dark-card/70',
      'border border-white/10',
      'shadow-xl shadow-black/20',
      hoverEffect && 'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
      hoverEffect && glowColors[glowColor]
    ),
    bordered: cn(
      'bg-dark-card/60',
      'border-2 border-neon-green/20',
      hoverEffect && 'hover:border-neon-green/40 transition-all duration-300'
    ),
    glow: cn(
      'bg-dark-card/80',
      'border border-white/10',
      // Animated border glow
      'before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:p-[1px]',
      'before:animate-pulse',
      borderGlowColors[glowColor]
    ),
  };

  return (
    <motion.div
      className={cn(baseStyles, variantStyles[variant], className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverEffect ? { scale: 1.01 } : undefined}
      {...props}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Optional animated background particles */}
      {variant === 'glow' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-neon-green/5 blur-3xl"
            animate={{
              x: ['-50%', '150%'],
              y: ['-50%', '150%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-neon-purple/5 blur-3xl"
            animate={{
              x: ['50%', '-150%'],
              y: ['50%', '-150%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

// Card Header component
export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
);

// Card Title component
export const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <h3 className={cn('text-xl font-bold text-white', className)}>
    {children}
  </h3>
);

// Card Description component
export const CardDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <p className={cn('text-sm text-gray-400 mt-1', className)}>
    {children}
  </p>
);

// Card Content component
export const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('', className)}>
    {children}
  </div>
);

// Card Footer component
export const CardFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('mt-4 pt-4 border-t border-white/5', className)}>
    {children}
  </div>
);

export default Card;
