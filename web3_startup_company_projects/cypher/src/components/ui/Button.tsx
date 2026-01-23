'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses = {
  primary: 'bg-cypher-yellow text-cypher-dark hover:bg-cypher-yellow-dark active:scale-95',
  secondary: 'bg-cypher-card border border-cypher-border text-white hover:border-cypher-yellow/50 hover:bg-cypher-card/80',
  ghost: 'bg-transparent text-cypher-gray-400 hover:text-white hover:bg-cypher-card',
  danger: 'bg-cypher-red/20 text-cypher-red border border-cypher-red/30 hover:bg-cypher-red/30',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
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
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}

// Icon Button
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

const iconSizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        iconSizeClasses[size],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

// Button Group
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div
      className={clsx(
        'inline-flex rounded-lg overflow-hidden border border-cypher-border',
        '[&>button]:rounded-none [&>button]:border-0 [&>button]:border-r [&>button]:border-cypher-border',
        '[&>button:last-child]:border-r-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Toggle Button for group
interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export function ToggleButton({
  active = false,
  children,
  className,
  ...props
}: ToggleButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-cypher-yellow text-cypher-dark'
          : 'bg-cypher-card text-cypher-gray-400 hover:text-white hover:bg-cypher-card/80',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
