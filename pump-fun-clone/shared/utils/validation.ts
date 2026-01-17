/**
 * Validation utilities for the pump.fun clone
 * Provides input validation for addresses, token names, and other user inputs
 */

import {
  TOKEN_NAME_MIN_LENGTH,
  TOKEN_NAME_MAX_LENGTH,
  TOKEN_SYMBOL_MIN_LENGTH,
  TOKEN_SYMBOL_MAX_LENGTH,
  TOKEN_DESCRIPTION_MAX_LENGTH,
} from '../constants';

/**
 * Validates a Solana address (base58 encoded public key)
 * @param address - The address to validate
 * @returns True if the address is valid, false otherwise
 * @example
 * isValidSolanaAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU") // true
 * isValidSolanaAddress("invalid") // false
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Solana addresses are 32-44 characters long (base58 encoding of 32 bytes)
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  // Base58 character set (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    return false;
  }

  return true;
}

/**
 * Validates a token name
 * @param name - The token name to validate
 * @returns Validation result with error message if invalid
 * @example
 * isValidTokenName("Doge Coin") // { valid: true }
 * isValidTokenName("") // { valid: false, error: "Token name is required" }
 */
export function isValidTokenName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Token name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < TOKEN_NAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Token name must be at least ${TOKEN_NAME_MIN_LENGTH} character(s)`,
    };
  }

  if (trimmedName.length > TOKEN_NAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Token name must be at most ${TOKEN_NAME_MAX_LENGTH} characters`,
    };
  }

  // Only allow alphanumeric, spaces, and common punctuation
  const validNameRegex = /^[a-zA-Z0-9\s\-_.!?']+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      valid: false,
      error: 'Token name contains invalid characters',
    };
  }

  // Must start with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(trimmedName)) {
    return {
      valid: false,
      error: 'Token name must start with a letter or number',
    };
  }

  return { valid: true };
}

/**
 * Validates a token symbol
 * @param symbol - The token symbol to validate
 * @returns Validation result with error message if invalid
 * @example
 * isValidTokenSymbol("DOGE") // { valid: true }
 * isValidTokenSymbol("doge") // { valid: true } (will be uppercased)
 * isValidTokenSymbol("TOOLONGSYMBOL") // { valid: false, error: "..." }
 */
export function isValidTokenSymbol(symbol: string): ValidationResult {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, error: 'Token symbol is required' };
  }

  const trimmedSymbol = symbol.trim().toUpperCase();

  if (trimmedSymbol.length < TOKEN_SYMBOL_MIN_LENGTH) {
    return {
      valid: false,
      error: `Token symbol must be at least ${TOKEN_SYMBOL_MIN_LENGTH} character(s)`,
    };
  }

  if (trimmedSymbol.length > TOKEN_SYMBOL_MAX_LENGTH) {
    return {
      valid: false,
      error: `Token symbol must be at most ${TOKEN_SYMBOL_MAX_LENGTH} characters`,
    };
  }

  // Only allow uppercase letters and numbers
  const validSymbolRegex = /^[A-Z0-9]+$/;
  if (!validSymbolRegex.test(trimmedSymbol)) {
    return {
      valid: false,
      error: 'Token symbol must only contain letters and numbers',
    };
  }

  // Must start with a letter
  if (!/^[A-Z]/.test(trimmedSymbol)) {
    return {
      valid: false,
      error: 'Token symbol must start with a letter',
    };
  }

  return { valid: true };
}

/**
 * Validates a token description
 * @param description - The description to validate
 * @returns Validation result
 */
export function isValidTokenDescription(description: string): ValidationResult {
  if (!description || typeof description !== 'string') {
    return { valid: true }; // Description is optional
  }

  const trimmedDescription = description.trim();

  if (trimmedDescription.length > TOKEN_DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Description must be at most ${TOKEN_DESCRIPTION_MAX_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validates a URL
 * @param url - The URL to validate
 * @returns Validation result
 */
export function isValidUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: true }; // URL is optional
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl === '') {
    return { valid: true };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validates a Twitter/X handle
 * @param handle - The Twitter handle to validate (with or without @)
 * @returns Validation result
 */
export function isValidTwitterHandle(handle: string): ValidationResult {
  if (!handle || typeof handle !== 'string') {
    return { valid: true }; // Optional field
  }

  const trimmedHandle = handle.trim().replace(/^@/, '');

  if (trimmedHandle === '') {
    return { valid: true };
  }

  // Twitter handles: 1-15 characters, alphanumeric and underscores
  const twitterRegex = /^[a-zA-Z0-9_]{1,15}$/;
  if (!twitterRegex.test(trimmedHandle)) {
    return {
      valid: false,
      error: 'Invalid Twitter handle (1-15 characters, letters, numbers, underscores only)',
    };
  }

  return { valid: true };
}

/**
 * Validates a Telegram username
 * @param username - The Telegram username to validate
 * @returns Validation result
 */
export function isValidTelegramUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: true }; // Optional field
  }

  const trimmedUsername = username.trim().replace(/^@/, '');

  if (trimmedUsername === '') {
    return { valid: true };
  }

  // Telegram usernames: 5-32 characters, alphanumeric and underscores
  const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
  if (!telegramRegex.test(trimmedUsername)) {
    return {
      valid: false,
      error: 'Invalid Telegram username (5-32 characters, must start with a letter)',
    };
  }

  return { valid: true };
}

/**
 * Validates a trade amount
 * @param amount - The amount to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function isValidTradeAmount(
  amount: number | bigint,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): ValidationResult {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, allowZero = false } = options;

  const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;

  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (!allowZero && numAmount === 0) {
    return { valid: false, error: 'Amount cannot be zero' };
  }

  if (numAmount < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  if (numAmount > max) {
    return { valid: false, error: `Amount cannot exceed ${max}` };
  }

  if (numAmount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  return { valid: true };
}

/**
 * Validates slippage tolerance
 * @param slippage - Slippage percentage (e.g., 1 = 1%)
 * @returns Validation result
 */
export function isValidSlippage(slippage: number): ValidationResult {
  if (typeof slippage !== 'number' || isNaN(slippage)) {
    return { valid: false, error: 'Invalid slippage value' };
  }

  if (slippage < 0.1) {
    return { valid: false, error: 'Slippage must be at least 0.1%' };
  }

  if (slippage > 50) {
    return { valid: false, error: 'Slippage cannot exceed 50%' };
  }

  return { valid: true };
}

/**
 * Validates a transaction signature
 * @param signature - The transaction signature to validate
 * @returns True if valid, false otherwise
 */
export function isValidTransactionSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  // Transaction signatures are 88 characters (base58 encoding of 64 bytes)
  if (signature.length !== 88) {
    return false;
  }

  // Base58 character set
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(signature);
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the value is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Validates all token creation inputs at once
 * @param input - Token creation input
 * @returns Object with validation results for each field
 */
export function validateTokenCreate(input: {
  name: string;
  symbol: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nameResult = isValidTokenName(input.name);
  if (!nameResult.valid && nameResult.error) {
    errors.name = nameResult.error;
  }

  const symbolResult = isValidTokenSymbol(input.symbol);
  if (!symbolResult.valid && symbolResult.error) {
    errors.symbol = symbolResult.error;
  }

  if (input.description) {
    const descResult = isValidTokenDescription(input.description);
    if (!descResult.valid && descResult.error) {
      errors.description = descResult.error;
    }
  }

  if (input.twitter) {
    const twitterResult = isValidTwitterHandle(input.twitter);
    if (!twitterResult.valid && twitterResult.error) {
      errors.twitter = twitterResult.error;
    }
  }

  if (input.telegram) {
    const telegramResult = isValidTelegramUsername(input.telegram);
    if (!telegramResult.valid && telegramResult.error) {
      errors.telegram = telegramResult.error;
    }
  }

  if (input.website) {
    const websiteResult = isValidUrl(input.website);
    if (!websiteResult.valid && websiteResult.error) {
      errors.website = websiteResult.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
