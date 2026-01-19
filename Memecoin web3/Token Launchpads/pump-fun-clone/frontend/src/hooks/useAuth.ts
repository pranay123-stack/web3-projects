'use client';

import { useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import toast from 'react-hot-toast';

export function useAuth() {
  const wallet = useWallet();
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionToken,
    setLoading,
    login,
    logout: logoutStore,
    checkSession,
    openConnectWalletModal,
    closeConnectWalletModal,
    openSignMessageModal,
    closeSignMessageModal,
    isConnectWalletModalOpen,
    isSignMessageModalOpen,
    addConnectedWallet,
  } = useAuthStore();

  // Check session validity on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle wallet connection changes
  useEffect(() => {
    if (wallet.connected && wallet.publicKey && !isAuthenticated) {
      // Wallet connected but not authenticated - prompt sign message
      openSignMessageModal();
    }
  }, [wallet.connected, wallet.publicKey, isAuthenticated, openSignMessageModal]);

  // Handle wallet disconnection
  useEffect(() => {
    if (!wallet.connected && isAuthenticated) {
      // Wallet disconnected - log out
      handleLogout();
    }
  }, [wallet.connected, isAuthenticated]);

  /**
   * Initiate login flow
   */
  const initiateLogin = useCallback(() => {
    if (!wallet.connected) {
      openConnectWalletModal();
    } else if (wallet.publicKey) {
      openSignMessageModal();
    }
  }, [wallet.connected, wallet.publicKey, openConnectWalletModal, openSignMessageModal]);

  /**
   * Sign message and authenticate
   */
  const signAndAuthenticate = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      toast.error('Wallet does not support message signing');
      return false;
    }

    setLoading(true);
    try {
      const result = await authService.authenticate(
        wallet.publicKey.toString(),
        wallet.signMessage
      );

      if (result.success && result.data) {
        const { user, token, expiresAt } = result.data;

        // Add connected wallet
        addConnectedWallet({
          address: wallet.publicKey.toString(),
          name: wallet.wallet?.adapter.name || 'Unknown Wallet',
          isPrimary: true,
          connectedAt: new Date().toISOString(),
        });

        // Login to store
        login(user, token, expiresAt);
        closeSignMessageModal();

        toast.success('Successfully authenticated!');
        return true;
      } else {
        toast.error(result.error || 'Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [wallet, setLoading, addConnectedWallet, login, closeSignMessageModal]);

  /**
   * Logout
   */
  const handleLogout = useCallback(async () => {
    try {
      if (sessionToken) {
        await authService.logout(sessionToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      if (wallet.connected) {
        await wallet.disconnect();
      }
      toast.success('Logged out successfully');
    }
  }, [sessionToken, logoutStore, wallet]);

  /**
   * Check if current user is owner of an address
   */
  const isOwner = useCallback(
    (address: string) => {
      return isAuthenticated && user?.address === address;
    },
    [isAuthenticated, user]
  );

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!user?.address) return;

    try {
      const result = await authService.fetchUserProfile(user.address);
      if (result.success && result.data) {
        useAuthStore.getState().setUser(result.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [user?.address]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    sessionToken,
    wallet,
    isConnectWalletModalOpen,
    isSignMessageModalOpen,

    // Actions
    initiateLogin,
    signAndAuthenticate,
    logout: handleLogout,
    isOwner,
    refreshUser,

    // Modal controls
    openConnectWalletModal,
    closeConnectWalletModal,
    openSignMessageModal,
    closeSignMessageModal,
  };
}

export default useAuth;
