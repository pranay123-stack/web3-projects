import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, NotificationPreferences, ConnectedWallet } from '@/types';

interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  sessionExpiry: string | null;

  // Connected wallets
  connectedWallets: ConnectedWallet[];
  primaryWallet: string | null;

  // Notification preferences
  notificationPreferences: NotificationPreferences;

  // Modal states
  isConnectWalletModalOpen: boolean;
  isSignMessageModalOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (token: string, expiry: string) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;

  // Wallet actions
  addConnectedWallet: (wallet: ConnectedWallet) => void;
  removeConnectedWallet: (address: string) => void;
  setPrimaryWallet: (address: string) => void;

  // Notification actions
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;

  // Modal actions
  openConnectWalletModal: () => void;
  closeConnectWalletModal: () => void;
  openSignMessageModal: () => void;
  closeSignMessageModal: () => void;

  // Profile actions
  updateProfile: (updates: Partial<User>) => void;
  updateAvatar: (avatarUrl: string) => void;
  updateUsername: (username: string) => void;

  // Auth actions
  login: (user: User, token: string, expiry: string) => void;
  logout: () => void;
  checkSession: () => boolean;
}

const defaultNotificationPreferences: NotificationPreferences = {
  priceAlerts: true,
  tradeConfirmations: true,
  newFollowers: true,
  tokenGraduations: true,
  marketingEmails: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,
      sessionExpiry: null,
      connectedWallets: [],
      primaryWallet: null,
      notificationPreferences: defaultNotificationPreferences,
      isConnectWalletModalOpen: false,
      isSignMessageModalOpen: false,

      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setSession: (token, expiry) => set({
        sessionToken: token,
        sessionExpiry: expiry,
        isAuthenticated: true,
      }),

      clearSession: () => set({
        sessionToken: null,
        sessionExpiry: null,
        isAuthenticated: false,
        user: null,
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Wallet actions
      addConnectedWallet: (wallet) => set((state) => ({
        connectedWallets: [...state.connectedWallets.filter(w => w.address !== wallet.address), wallet],
        primaryWallet: state.primaryWallet || wallet.address,
      })),

      removeConnectedWallet: (address) => set((state) => ({
        connectedWallets: state.connectedWallets.filter(w => w.address !== address),
        primaryWallet: state.primaryWallet === address
          ? state.connectedWallets.find(w => w.address !== address)?.address || null
          : state.primaryWallet,
      })),

      setPrimaryWallet: (address) => set((state) => ({
        primaryWallet: address,
        connectedWallets: state.connectedWallets.map(w => ({
          ...w,
          isPrimary: w.address === address,
        })),
      })),

      // Notification actions
      updateNotificationPreferences: (preferences) => set((state) => ({
        notificationPreferences: { ...state.notificationPreferences, ...preferences },
      })),

      // Modal actions
      openConnectWalletModal: () => set({ isConnectWalletModalOpen: true }),
      closeConnectWalletModal: () => set({ isConnectWalletModalOpen: false }),
      openSignMessageModal: () => set({ isSignMessageModalOpen: true }),
      closeSignMessageModal: () => set({ isSignMessageModalOpen: false }),

      // Profile actions
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      updateAvatar: (avatarUrl) => set((state) => ({
        user: state.user ? { ...state.user, avatar: avatarUrl } : null,
      })),

      updateUsername: (username) => set((state) => ({
        user: state.user ? { ...state.user, username } : null,
      })),

      // Auth actions
      login: (user, token, expiry) => set({
        user,
        sessionToken: token,
        sessionExpiry: expiry,
        isAuthenticated: true,
        isLoading: false,
        isConnectWalletModalOpen: false,
        isSignMessageModalOpen: false,
      }),

      logout: () => set({
        user: null,
        sessionToken: null,
        sessionExpiry: null,
        isAuthenticated: false,
        connectedWallets: [],
        primaryWallet: null,
      }),

      checkSession: () => {
        const { sessionExpiry, sessionToken } = get();
        if (!sessionToken || !sessionExpiry) return false;

        const isValid = new Date(sessionExpiry) > new Date();
        if (!isValid) {
          get().clearSession();
        }
        return isValid;
      },
    }),
    {
      name: 'pump-fun-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        sessionExpiry: state.sessionExpiry,
        isAuthenticated: state.isAuthenticated,
        connectedWallets: state.connectedWallets,
        primaryWallet: state.primaryWallet,
        notificationPreferences: state.notificationPreferences,
      }),
    }
  )
);

export default useAuthStore;
