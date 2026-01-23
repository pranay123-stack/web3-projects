/**
 * Format a number as USD currency
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`;
  }
  return `$${value.toFixed(decimals)}`;
}

/**
 * Format a number with compact notation
 */
export function formatCompact(value: number, decimals: number = 2): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a percentage value without sign
 */
export function formatPercentageUnsigned(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a token amount with appropriate decimals
 */
export function formatTokenAmount(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0';
  if (amount < 0.0001) return '<0.0001';
  if (amount < 1) return amount.toFixed(decimals);
  if (amount < 1000) return amount.toFixed(2);
  return formatCompact(amount, 2);
}

/**
 * Format an address with ellipsis
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format a timestamp to date string
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a timestamp to datetime string
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a fee tier to percentage string
 */
export function formatFeeTier(feeTier: number): string {
  return `${(feeTier / 100).toFixed(2)}%`;
}

/**
 * Format price with appropriate decimals based on magnitude
 */
export function formatPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.0001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  if (price < 10000) return price.toFixed(2);
  return formatCompact(price, 2);
}

/**
 * Format a transaction hash
 */
export function formatTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Parse a formatted number back to a number
 */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/[$,%+]/g, '');
  if (cleaned.endsWith('B')) return parseFloat(cleaned) * 1e9;
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1e6;
  if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1e3;
  return parseFloat(cleaned);
}

/**
 * Get color class based on value sign
 */
export function getValueColorClass(value: number): string {
  if (value > 0) return 'text-cypher-green';
  if (value < 0) return 'text-cypher-red';
  return 'text-cypher-gray-400';
}
