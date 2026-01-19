import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ENV, API_ENDPOINTS } from './constants';

// Types
export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  creator: string;
  createdAt: string;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  bondingCurveProgress: number;
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  realTokenReserves: number;
  isMigrated: boolean;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface Trade {
  id: string;
  tokenMint: string;
  trader: string;
  type: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  price: number;
  signature: string;
  timestamp: string;
}

export interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  totalTokensCreated: number;
  totalTrades: number;
  totalVolume: number;
  joinedAt: string;
}

export interface UserHolding {
  token: Token;
  balance: number;
  value: number;
  averageBuyPrice: number;
  pnl: number;
  pnlPercentage: number;
}

export interface PlatformStats {
  totalTokens: number;
  totalTrades: number;
  totalVolume: number;
  activeUsers24h: number;
  tokensCreated24h: number;
  volumeChange24h: number;
}

export interface CreateTokenInput {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  initialBuyAmount?: number;
}

export interface TradeInput {
  tokenMint: string;
  amount: number;
  slippage: number;
  isSol?: boolean; // For buy: true = SOL amount, false = token amount
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: ENV.API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add wallet address to headers if available
      if (typeof window !== 'undefined') {
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
          config.headers['X-Wallet-Address'] = walletAddress;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse<unknown>>) => {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      console.error('API Error:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

const apiClient = createApiClient();

// API Functions

// Tokens
export const api = {
  // Token endpoints
  tokens: {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      sort?: string;
      search?: string;
    }): Promise<PaginatedResponse<Token>> => {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Token>>>(
        API_ENDPOINTS.TOKENS,
        { params }
      );
      return response.data.data!;
    },

    getByMint: async (mint: string): Promise<Token> => {
      const response = await apiClient.get<ApiResponse<Token>>(
        API_ENDPOINTS.TOKEN_BY_MINT(mint)
      );
      return response.data.data!;
    },

    getTrending: async (limit = 10): Promise<Token[]> => {
      const response = await apiClient.get<ApiResponse<Token[]>>(
        API_ENDPOINTS.TRENDING_TOKENS,
        { params: { limit } }
      );
      return response.data.data!;
    },

    getNew: async (limit = 20): Promise<Token[]> => {
      const response = await apiClient.get<ApiResponse<Token[]>>(
        API_ENDPOINTS.NEW_TOKENS,
        { params: { limit } }
      );
      return response.data.data!;
    },

    search: async (query: string): Promise<Token[]> => {
      const response = await apiClient.get<ApiResponse<Token[]>>(
        API_ENDPOINTS.SEARCH_TOKENS,
        { params: { q: query } }
      );
      return response.data.data!;
    },

    create: async (input: CreateTokenInput): Promise<{ token: Token; signature: string }> => {
      const response = await apiClient.post<
        ApiResponse<{ token: Token; signature: string }>
      >(API_ENDPOINTS.CREATE_TOKEN, input);
      return response.data.data!;
    },

    getTrades: async (
      mint: string,
      params?: { page?: number; limit?: number }
    ): Promise<PaginatedResponse<Trade>> => {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Trade>>>(
        API_ENDPOINTS.TRADES(mint),
        { params }
      );
      return response.data.data!;
    },
  },

  // Trading endpoints
  trade: {
    buy: async (input: TradeInput): Promise<{ signature: string; tokenAmount: number }> => {
      const response = await apiClient.post<
        ApiResponse<{ signature: string; tokenAmount: number }>
      >(API_ENDPOINTS.BUY, input);
      return response.data.data!;
    },

    sell: async (input: TradeInput): Promise<{ signature: string; solAmount: number }> => {
      const response = await apiClient.post<
        ApiResponse<{ signature: string; solAmount: number }>
      >(API_ENDPOINTS.SELL, input);
      return response.data.data!;
    },

    getQuote: async (
      tokenMint: string,
      type: 'buy' | 'sell',
      amount: number,
      isSol = true
    ): Promise<{ outputAmount: number; priceImpact: number; fee: number }> => {
      const response = await apiClient.get<
        ApiResponse<{ outputAmount: number; priceImpact: number; fee: number }>
      >(`/api/trade/quote`, {
        params: { tokenMint, type, amount, isSol },
      });
      return response.data.data!;
    },
  },

  // User endpoints
  users: {
    getProfile: async (address: string): Promise<UserProfile> => {
      const response = await apiClient.get<ApiResponse<UserProfile>>(
        API_ENDPOINTS.USER_PROFILE(address)
      );
      return response.data.data!;
    },

    getHoldings: async (address: string): Promise<UserHolding[]> => {
      const response = await apiClient.get<ApiResponse<UserHolding[]>>(
        API_ENDPOINTS.USER_HOLDINGS(address)
      );
      return response.data.data!;
    },

    getCreatedTokens: async (address: string): Promise<Token[]> => {
      const response = await apiClient.get<ApiResponse<Token[]>>(
        API_ENDPOINTS.USER_CREATED(address)
      );
      return response.data.data!;
    },
  },

  // Upload endpoints
  upload: {
    image: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        API_ENDPOINTS.UPLOAD_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data!;
    },
  },

  // Stats endpoints
  stats: {
    getPlatform: async (): Promise<PlatformStats> => {
      const response = await apiClient.get<ApiResponse<PlatformStats>>(
        API_ENDPOINTS.PLATFORM_STATS
      );
      return response.data.data!;
    },
  },
};

// Helper function for custom requests
export const makeRequest = async <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data.data!;
};

export default api;
