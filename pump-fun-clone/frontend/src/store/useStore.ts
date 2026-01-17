import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Token,
  UserPreferences,
  FilterState,
  SortOption,
  TransactionStatus,
} from '@/types';

// Transaction state for tracking pending transactions
interface PendingTransaction {
  id: string;
  type: 'buy' | 'sell' | 'create';
  status: TransactionStatus;
  signature?: string;
  error?: string;
  tokenMint?: string;
  amount?: number;
  createdAt: number;
}

// Price alerts
interface PriceAlert {
  id: string;
  tokenMint: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  createdAt: number;
}

// Main store state
interface AppState {
  // User preferences
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;

  // Token filters and sorting
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;

  // Recently viewed tokens
  recentTokens: string[]; // Array of mint addresses
  addRecentToken: (mint: string) => void;
  clearRecentTokens: () => void;

  // Favorite tokens
  favoriteTokens: string[];
  addFavorite: (mint: string) => void;
  removeFavorite: (mint: string) => void;
  isFavorite: (mint: string) => boolean;

  // Pending transactions
  pendingTransactions: PendingTransaction[];
  addPendingTransaction: (tx: Omit<PendingTransaction, 'createdAt'>) => void;
  updateTransaction: (id: string, update: Partial<PendingTransaction>) => void;
  removeTransaction: (id: string) => void;
  clearCompletedTransactions: () => void;

  // Price alerts
  priceAlerts: PriceAlert[];
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'isTriggered' | 'createdAt'>) => void;
  removePriceAlert: (id: string) => void;
  triggerAlert: (id: string) => void;

  // UI state
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Trading state
  defaultSlippage: number;
  setDefaultSlippage: (slippage: number) => void;

  // Real-time price cache
  priceCache: Record<string, { price: number; updatedAt: number }>;
  updatePriceCache: (mint: string, price: number) => void;
  getPriceFromCache: (mint: string) => number | null;
}

// Default filter state
const defaultFilters: FilterState = {
  category: undefined,
  minMarketCap: undefined,
  maxMarketCap: undefined,
  minVolume: undefined,
  showMigrated: true,
  searchQuery: '',
};

// Default user preferences
const defaultPreferences: UserPreferences = {
  theme: 'dark',
  defaultSlippage: 1,
  showPriceInUsd: true,
  enableNotifications: true,
  enableSounds: false,
};

export const useStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // User preferences
      preferences: defaultPreferences,
      setPreferences: (newPreferences) =>
        set((state) => {
          state.preferences = { ...state.preferences, ...newPreferences };
        }),

      // Filters
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
        }),
      resetFilters: () =>
        set((state) => {
          state.filters = defaultFilters;
        }),
      sortBy: 'trending',
      setSortBy: (sort) =>
        set((state) => {
          state.sortBy = sort;
        }),

      // Recent tokens
      recentTokens: [],
      addRecentToken: (mint) =>
        set((state) => {
          // Remove if exists, add to front, limit to 10
          state.recentTokens = [
            mint,
            ...state.recentTokens.filter((m) => m !== mint),
          ].slice(0, 10);
        }),
      clearRecentTokens: () =>
        set((state) => {
          state.recentTokens = [];
        }),

      // Favorites
      favoriteTokens: [],
      addFavorite: (mint) =>
        set((state) => {
          if (!state.favoriteTokens.includes(mint)) {
            state.favoriteTokens.push(mint);
          }
        }),
      removeFavorite: (mint) =>
        set((state) => {
          state.favoriteTokens = state.favoriteTokens.filter((m) => m !== mint);
        }),
      isFavorite: (mint) => get().favoriteTokens.includes(mint),

      // Transactions
      pendingTransactions: [],
      addPendingTransaction: (tx) =>
        set((state) => {
          state.pendingTransactions.push({
            ...tx,
            createdAt: Date.now(),
          });
        }),
      updateTransaction: (id, update) =>
        set((state) => {
          const idx = state.pendingTransactions.findIndex((t) => t.id === id);
          if (idx !== -1) {
            state.pendingTransactions[idx] = {
              ...state.pendingTransactions[idx],
              ...update,
            };
          }
        }),
      removeTransaction: (id) =>
        set((state) => {
          state.pendingTransactions = state.pendingTransactions.filter(
            (t) => t.id !== id
          );
        }),
      clearCompletedTransactions: () =>
        set((state) => {
          state.pendingTransactions = state.pendingTransactions.filter(
            (t) => t.status === 'pending' || t.status === 'confirming'
          );
        }),

      // Price alerts
      priceAlerts: [],
      addPriceAlert: (alert) =>
        set((state) => {
          state.priceAlerts.push({
            ...alert,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isTriggered: false,
            createdAt: Date.now(),
          });
        }),
      removePriceAlert: (id) =>
        set((state) => {
          state.priceAlerts = state.priceAlerts.filter((a) => a.id !== id);
        }),
      triggerAlert: (id) =>
        set((state) => {
          const idx = state.priceAlerts.findIndex((a) => a.id === id);
          if (idx !== -1) {
            state.priceAlerts[idx].isTriggered = true;
          }
        }),

      // UI state
      isSearchOpen: false,
      setSearchOpen: (open) =>
        set((state) => {
          state.isSearchOpen = open;
        }),
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) =>
        set((state) => {
          state.isMobileMenuOpen = open;
        }),

      // Trading
      defaultSlippage: 1,
      setDefaultSlippage: (slippage) =>
        set((state) => {
          state.defaultSlippage = slippage;
        }),

      // Price cache
      priceCache: {},
      updatePriceCache: (mint, price) =>
        set((state) => {
          state.priceCache[mint] = { price, updatedAt: Date.now() };
        }),
      getPriceFromCache: (mint) => {
        const cached = get().priceCache[mint];
        if (!cached) return null;
        // Cache expires after 30 seconds
        if (Date.now() - cached.updatedAt > 30000) return null;
        return cached.price;
      },
    })),
    {
      name: 'pump-fun-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        favoriteTokens: state.favoriteTokens,
        recentTokens: state.recentTokens,
        defaultSlippage: state.defaultSlippage,
        priceAlerts: state.priceAlerts,
      }),
    }
  )
);

// Selector hooks for common state slices
export const usePreferences = () => useStore((state) => state.preferences);
export const useFilters = () => useStore((state) => state.filters);
export const useFavorites = () => useStore((state) => state.favoriteTokens);
export const usePendingTransactions = () =>
  useStore((state) => state.pendingTransactions);
