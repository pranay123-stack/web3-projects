'use client';

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'h-9 text-sm px-3',
  md: 'h-11 text-base px-4',
  lg: 'h-14 text-lg px-5',
};

const labelSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      fullWidth = true,
      className,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const variantStyles = {
      default: cn(
        'bg-dark-card/60 border-2',
        isFocused
          ? 'border-neon-green/50 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
          : error
          ? 'border-red-500/50'
          : 'border-white/10 hover:border-white/20',
        'focus:border-neon-green/50 focus:shadow-[0_0_20px_rgba(57,255,20,0.15)]'
      ),
      filled: cn(
        'bg-white/5 border-2 border-transparent',
        isFocused
          ? 'bg-white/10 border-neon-green/50'
          : error
          ? 'border-red-500/50'
          : 'hover:bg-white/10'
      ),
      ghost: cn(
        'bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 rounded-none',
        isFocused
          ? 'border-neon-green'
          : error
          ? 'border-red-500'
          : 'border-white/20 hover:border-white/40'
      ),
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <motion.label
            className={cn(
              'block mb-2 font-medium transition-colors duration-200',
              labelSizeStyles[inputSize],
              isFocused ? 'text-neon-green' : error ? 'text-red-400' : 'text-gray-400'
            )}
            animate={{
              color: isFocused ? '#39ff14' : error ? '#f87171' : '#9ca3af',
            }}
          >
            {label}
          </motion.label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200',
                isFocused && 'text-neon-green'
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'w-full rounded-xl outline-none transition-all duration-300',
              'text-white placeholder-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizeStyles[inputSize],
              variantStyles[variant],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200',
                isFocused && 'text-neon-green'
              )}
            >
              {rightIcon}
            </div>
          )}

          {/* Focus glow effect */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 rounded-xl bg-neon-green/5 blur-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-2 text-sm text-red-400 flex items-center gap-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hint text */}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              'block mb-2 text-sm font-medium transition-colors duration-200',
              isFocused ? 'text-neon-green' : error ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full min-h-[120px] px-4 py-3 rounded-xl outline-none transition-all duration-300',
            'bg-dark-card/60 border-2 text-white placeholder-gray-500',
            'resize-y',
            isFocused
              ? 'border-neon-green/50 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
              : error
              ? 'border-red-500/50'
              : 'border-white/10 hover:border-white/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
