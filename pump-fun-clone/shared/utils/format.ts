/**
 * Formatting utilities for the pump.fun clone
 * Provides consistent formatting for SOL amounts, tokens, addresses, and dates
 */

import { TOKEN_DECIMALS, LAMPORTS_PER_SOL } from '../constants';

/**
 * Formats lamports (smallest SOL unit) to a human-readable SOL string
 * @param lamports - Amount in lamports (1 SOL = 1e9 lamports)
 * @param options - Formatting options
 * @returns Formatted SOL string (e.g., "1.234 SOL")
 * @example
 * formatSOL(1_500_000_000n) // "1.5 SOL"
 * formatSOL(123_456_789n, { decimals: 4 }) // "0.1235 SOL"
 */
export function formatSOL(
  lamports: bigint | number,
  options: {
    /** Number of decimal places to display (default: 4) */
    decimals?: number;
    /** Whether to include "SOL" suffix (default: true) */
    includeSuffix?: boolean;
    /** Whether to use compact notation for large numbers (default: false) */
    compact?: boolean;
  } = {}
): string {
  const { decimals = 4, includeSuffix = true, compact = false } = options;

  const lamportsNum = typeof lamports === 'bigint' ? Number(lamports) : lamports;
  const sol = lamportsNum / LAMPORTS_PER_SOL;

  let formatted: string;

  if (compact && sol >= 1000) {
    formatted = formatCompactNumber(sol);
  } else {
    formatted = sol.toFixed(decimals);
    // Remove trailing zeros after decimal point
    formatted = formatted.replace(/\.?0+$/, '');
    // Ensure at least one decimal place for small numbers
    if (!formatted.includes('.') && sol > 0 && sol < 1) {
      formatted = sol.toFixed(Math.min(decimals, 6));
    }
  }

  return includeSuffix ? `${formatted} SOL` : formatted;
}

/**
 * Formats a token amount with the specified decimals
 * @param amount - Raw token amount (smallest unit)
 * @param decimals - Token decimals (default: 6)
 * @param options - Formatting options
 * @returns Formatted token amount string
 * @example
 * formatTokenAmount(1_000_000n, 6) // "1"
 * formatTokenAmount(1_234_567n, 6, { maxDecimals: 2 }) // "1.23"
 */
export function formatTokenAmount(
  amount: bigint | number,
  decimals: number = TOKEN_DECIMALS,
  options: {
    /** Maximum decimal places to display */
    maxDecimals?: number;
    /** Whether to use compact notation for large numbers */
    compact?: boolean;
    /** Token symbol to append */
    symbol?: string;
  } = {}
): string {
  const { maxDecimals = 4, compact = false, symbol } = options;

  const amountNum = typeof amount === 'bigint' ? Number(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const tokenAmount = amountNum / divisor;

  let formatted: string;

  if (compact && tokenAmount >= 1000) {
    formatted = formatCompactNumber(tokenAmount);
  } else {
    formatted = tokenAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
  }

  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Formats a market cap value in SOL with appropriate suffix
 * @param value - Market cap in SOL
 * @returns Formatted market cap string (e.g., "$1.23M")
 * @example
 * formatMarketCap(1500) // "1.5K SOL"
 * formatMarketCap(2500000) // "2.5M SOL"
 */
export function formatMarketCap(
  value: number,
  options: {
    /** Currency symbol to use (default: "SOL") */
    currency?: string;
    /** Number of decimal places (default: 2) */
    decimals?: number;
  } = {}
): string {
  const { currency = 'SOL', decimals = 2 } = options;

  const formatted = formatCompactNumber(value, decimals);
  return `${formatted} ${currency}`;
}

/**
 * Formats a number in compact notation (K, M, B, T)
 * @param value - Number to format
 * @param decimals - Decimal places to show (default: 2)
 * @returns Compact formatted string
 */
function formatCompactNumber(value: number, decimals: number = 2): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000_000).toFixed(decimals)}T`;
  }
  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(decimals)}K`;
  }
  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Formats a percentage value
 * @param value - Percentage value (e.g., 0.15 for 15%, or 15 for 15%)
 * @param options - Formatting options
 * @returns Formatted percentage string
 * @example
 * formatPercentage(0.1567) // "+15.67%"
 * formatPercentage(-0.05, { decimals: 1 }) // "-5.0%"
 */
export function formatPercentage(
  value: number,
  options: {
    /** Number of decimal places (default: 2) */
    decimals?: number;
    /** Whether to show + sign for positive values (default: true) */
    showSign?: boolean;
    /** Whether value is already in percentage form (default: false) */
    isPercentage?: boolean;
  } = {}
): string {
  const { decimals = 2, showSign = true, isPercentage = false } = options;

  const percentage = isPercentage ? value : value * 100;
  const sign = showSign && percentage > 0 ? '+' : '';

  return `${sign}${percentage.toFixed(decimals)}%`;
}

/**
 * Shortens a Solana address for display
 * @param address - Full base58 encoded address
 * @param options - Shortening options
 * @returns Shortened address (e.g., "7xKX...3rPd")
 * @example
 * shortenAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU") // "7xKX...AsU"
 */
export function shortenAddress(
  address: string,
  options: {
    /** Characters to show at start (default: 4) */
    startChars?: number;
    /** Characters to show at end (default: 4) */
    endChars?: number;
    /** Separator between parts (default: "...") */
    separator?: string;
  } = {}
): string {
  const { startChars = 4, endChars = 4, separator = '...' } = options;

  if (!address) return '';
  if (address.length <= startChars + endChars + separator.length) {
    return address;
  }

  const start = address.slice(0, startChars);
  const end = address.slice(-endChars);

  return `${start}${separator}${end}`;
}

/**
 * Formats a date as a relative time string (e.g., "5 minutes ago")
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Relative time string
 * @example
 * formatTimeAgo(new Date(Date.now() - 60000)) // "1 minute ago"
 * formatTimeAgo("2024-01-15T10:30:00Z") // "2 hours ago"
 */
export function formatTimeAgo(date: Date | string | number): string {
  const now = Date.now();
  const timestamp = date instanceof Date
    ? date.getTime()
    : typeof date === 'string'
      ? new Date(date).getTime()
      : date;

  const seconds = Math.floor((now - timestamp) / 1000);

  // Handle future dates
  if (seconds < 0) {
    return 'just now';
  }

  // Time intervals in seconds
  const intervals: { label: string; seconds: number }[] = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      const plural = count === 1 ? '' : 's';
      return `${count} ${interval.label}${plural} ago`;
    }
  }

  return 'just now';
}

/**
 * Formats a date to a localized string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const dateObj = date instanceof Date
    ? date
    : typeof date === 'string'
      ? new Date(date)
      : new Date(date);

  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Formats a price with appropriate precision based on magnitude
 * @param price - Price in SOL
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (price === 0) return '0';

  if (price < 0.000001) {
    return price.toExponential(2);
  }
  if (price < 0.0001) {
    return price.toFixed(8);
  }
  if (price < 0.01) {
    return price.toFixed(6);
  }
  if (price < 1) {
    return price.toFixed(4);
  }
  if (price < 1000) {
    return price.toFixed(2);
  }
  return formatCompactNumber(price);
}
