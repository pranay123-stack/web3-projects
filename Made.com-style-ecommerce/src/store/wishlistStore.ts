import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const items = get().items;
        if (!items.find((item) => item._id === product._id)) {
          set({ items: [...items, product] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((item) => item._id !== productId) });
      },

      isInWishlist: (productId: string) => {
        return get().items.some((item) => item._id === productId);
      },

      toggleItem: (product: Product) => {
        if (get().isInWishlist(product._id)) {
          get().removeItem(product._id);
        } else {
          get().addItem(product);
        }
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'made-wishlist-storage',
    }
  )
);
