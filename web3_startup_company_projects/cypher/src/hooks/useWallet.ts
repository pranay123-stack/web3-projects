'use client';

import { useState, useCallback, useEffect } from 'react';
import { WalletState } from '@/types';

// Mock wallet hook - in production this would use wagmi/viem
// Structure is similar to wagmi's useAccount + useConnect hooks

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

// Mock wallet address for demo
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
  });
  const [error, setError] = useState<string | null>(null);

  // Check for persisted wallet state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWallet = localStorage.getItem('cypher_wallet');
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet);
          setState(parsed);
        } catch {
          localStorage.removeItem('cypher_wallet');
        }
      }
    }
  }, []);

  // Save wallet state to localStorage
  const persistState = useCallback((newState: WalletState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cypher_wallet', JSON.stringify(newState));
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production, this would:
      // 1. Check if a wallet extension is available
      // 2. Request account access
      // 3. Get the connected account and chain

      const newState: WalletState = {
        address: MOCK_ADDRESS,
        isConnected: true,
        isConnecting: false,
        chainId: 1, // Ethereum mainnet
      };

      setState(newState);
      persistState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, [persistState]);

  const disconnect = useCallback(() => {
    const newState: WalletState = {
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
    };

    setState(newState);
    setError(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('cypher_wallet');
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    error,
  };
}

// Hook to get wallet balance (mock)
export function useWalletBalance(address: string | null) {
  const [balance, setBalance] = useState<{
    eth: number;
    isLoading: boolean;
    error: string | null;
  }>({
    eth: 0,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!address) {
      setBalance({ eth: 0, isLoading: false, error: null });
      return;
    }

    setBalance((prev) => ({ ...prev, isLoading: true }));

    // Simulate fetching balance
    const timeout = setTimeout(() => {
      setBalance({
        eth: 12.4567, // Mock balance
        isLoading: false,
        error: null,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [address]);

  return balance;
}

// Hook to check if an address is the connected wallet
export function useIsOwner(address: string | undefined) {
  const { address: walletAddress, isConnected } = useWallet();

  if (!isConnected || !walletAddress || !address) {
    return false;
  }

  return walletAddress.toLowerCase() === address.toLowerCase();
}
