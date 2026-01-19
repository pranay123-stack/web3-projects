import { create } from 'zustand';
import { BrowserProvider, formatEther } from 'ethers';
import type { WalletState } from '@/types';

interface WalletStore extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const SUPPORTED_CHAINS = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  56: 'BSC',
  11155111: 'Sepolia Testnet',
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
  isConnecting: false,
  error: null,

  connect: async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      set({ error: 'MetaMask is not installed. Please install it to continue.' });
      return;
    }

    set({ isConnecting: true, error: null });

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      const network = await provider.getNetwork();

      set({
        isConnected: true,
        address: accounts[0],
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        isConnecting: false,
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts: unknown) => {
        const accs = newAccounts as string[];
        if (accs.length === 0) {
          get().disconnect();
        } else {
          set({ address: accs[0] });
          get().updateBalance();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (newChainId: unknown) => {
        set({ chainId: Number(newChainId as string) });
        get().updateBalance();
      });
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      error: null,
    });
  },

  updateBalance: async () => {
    const { address } = get();
    if (!address || !window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      set({ balance: formatEther(balance) });
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  },

  switchNetwork: async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      set({ error: 'Failed to switch network' });
    }
  },
}));

export { SUPPORTED_CHAINS };
