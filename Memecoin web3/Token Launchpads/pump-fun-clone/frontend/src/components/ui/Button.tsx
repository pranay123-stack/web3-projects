'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-neon-green via-emerald-500 to-neon-green
    bg-[length:200%_100%] hover:bg-[position:100%_0]
    text-black font-bold
    shadow-[0_0_20px_rgba(57,255,20,0.3)]
    hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]
    border border-neon-green/50
  `,
  secondary: `
    bg-gradient-to-r from-neon-purple via-purple-500 to-neon-purple
    bg-[length:200%_100%] hover:bg-[position:100%_0]
    text-white font-bold
    shadow-[0_0_20px_rgba(191,0,255,0.3)]
    hover:shadow-[0_0_30px_rgba(191,0,255,0.5)]
    border border-neon-purple/50
  `,
  danger: `
    bg-gradient-to-r from-red-600 via-red-500 to-red-600
    bg-[length:200%_100%] hover:bg-[position:100%_0]
    text-white font-bold
    shadow-[0_0_20px_rgba(239,68,68,0.3)]
    hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]
    border border-red-500/50
  `,
  ghost: `
    bg-transparent hover:bg-white/5
    text-gray-300 hover:text-white
    border border-transparent
  `,
  outline: `
    bg-transparent
    text-neon-green hover:text-white
    border border-neon-green/50 hover:border-neon-green
    hover:bg-neon-green/10
    hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-xl',
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  fullWidth = false,
  glow = true,
  className,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'font-semibold transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        glow && variant !== 'ghost' && 'hover:brightness-110',
        className
      )}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* Animated glow effect */}
      {glow && variant === 'primary' && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-neon-green/20 blur-xl"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </span>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        initial={false}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          whileHover={{
            translateX: '200%',
            transition: { duration: 0.6, ease: 'easeInOut' },
          }}
        />
      </motion.div>
    </motion.button>
  );
};

export default Button;
