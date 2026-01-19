/**
 * API-related types for the pump.fun clone
 * These types define the structure of API requests and responses
 */

/**
 * Standard API response wrapper
 * All API responses follow this structure
 * @template T - The type of data contained in the response
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** The response data (present when success is true) */
  data?: T;
  /** Error information (present when success is false) */
  error?: ErrorDetails;
  /** Additional metadata about the response */
  meta?: ResponseMeta;
}

/**
 * Paginated API response for list endpoints
 * @template T - The type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Error information (present when success is false) */
  error?: ErrorDetails;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
  /** Cursor for next page (for cursor-based pagination) */
  nextCursor?: string;
  /** Cursor for previous page (for cursor-based pagination) */
  prevCursor?: string;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Request ID for tracking/debugging */
  requestId: string;
  /** ISO timestamp of the response */
  timestamp: string;
  /** API version */
  version: string;
  /** Response time in milliseconds */
  responseTime?: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details */
  error: ErrorDetails;
  /** Response metadata */
  meta?: ResponseMeta;
}

/**
 * Detailed error information
 */
export interface ErrorDetails {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Field-specific validation errors */
  validationErrors?: ValidationError[];
  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * Field-level validation error
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** The invalid value (sanitized) */
  value?: unknown;
  /** Validation rule that failed */
  rule?: string;
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Business logic errors
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  TOKEN_ALREADY_GRADUATED = 'TOKEN_ALREADY_GRADUATED',
  TRADE_FAILED = 'TRADE_FAILED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
}

/**
 * HTTP status code mapping for error codes
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INSUFFICIENT_FUNDS]: 400,
  [ErrorCode.INVALID_SIGNATURE]: 400,
  [ErrorCode.SLIPPAGE_EXCEEDED]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.BLOCKCHAIN_ERROR]: 502,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.TOKEN_NOT_FOUND]: 404,
  [ErrorCode.TOKEN_ALREADY_GRADUATED]: 400,
  [ErrorCode.TRADE_FAILED]: 400,
  [ErrorCode.WALLET_NOT_CONNECTED]: 401,
};

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Cursor for cursor-based pagination */
  cursor?: string;
}

/**
 * Sort parameters
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListQueryParams extends PaginationParams, SortParams {
  /** Search query string */
  search?: string;
  /** Filter parameters */
  filters?: Record<string, unknown>;
}
