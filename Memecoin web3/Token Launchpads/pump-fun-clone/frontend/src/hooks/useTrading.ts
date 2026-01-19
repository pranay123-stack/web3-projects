'use client';

import { useState, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  calculateBuyAmount,
  calculateSellAmount,
  executeBuy,
  executeSell,
  getTokenBalance,
  fetchBondingCurveState,
  getBondingCurvePda,
  estimatePriorityFee,
} from '@/services/trading';
import type {
  BondingCurve,
  PriceEstimate,
  TransactionState,
  TradingParams,
} from '@/types';

const DEFAULT_SLIPPAGE_BPS = 100; // 1%

interface UseTradingOptions {
  onSuccess?: (signature: string, type: 'buy' | 'sell') => void;
  onError?: (error: Error, type: 'buy' | 'sell') => void;
}

interface UseTradingReturn {
  // State
  isLoading: boolean;
  transactionState: TransactionState;
  bondingCurve: BondingCurve | null;
  tokenBalance: number;
  solBalance: number;
  estimatedPriorityFee: number;

  // Trading params
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  priorityFee: number;
  setPriorityFee: (fee: number) => void;

  // Price estimates
  getBuyEstimate: (solAmount: number) => PriceEstimate | null;
  getSellEstimate: (tokenAmount: number) => PriceEstimate | null;

  // Actions
  buy: (solAmount: number) => Promise<string | null>;
  sell: (tokenAmount: number) => Promise<string | null>;
  refreshBalances: () => Promise<void>;
  refreshBondingCurve: () => Promise<void>;
}

/**
 * Hook for executing buy/sell transactions on Solana
 */
export function useTrading(
  tokenMint: string,
  options: UseTradingOptions = {}
): UseTradingReturn {
  const { onSuccess, onError } = options;
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: 'idle',
  });
  const [bondingCurve, setBondingCurve] = useState<BondingCurve | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [estimatedPriorityFee, setEstimatedPriorityFee] = useState(0);

  // Trading params
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [priorityFee, setPriorityFee] = useState(0);

  // Memoized trading params
  const tradingParams = useMemo<TradingParams>(
    () => ({
      slippageBps,
      priorityFee,
    }),
    [slippageBps, priorityFee]
  );

  /**
   * Refresh user's SOL and token balances
   */
  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey || !tokenMint) return;

    try {
      // Get SOL balance
      const sol = await connection.getBalance(wallet.publicKey);
      setSolBalance(sol / LAMPORTS_PER_SOL);

      // Get token balance
      const mint = new PublicKey(tokenMint);
      const tokens = await getTokenBalance(connection, wallet.publicKey, mint);
      setTokenBalance(tokens);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [connection, wallet.publicKey, tokenMint]);

  /**
   * Refresh bonding curve state
   */
  const refreshBondingCurve = useCallback(async () => {
    if (!tokenMint) return;

    try {
      const mint = new PublicKey(tokenMint);
      const pda = getBondingCurvePda(mint);
      const state = await fetchBondingCurveState(connection, pda);
      setBondingCurve(state);
    } catch (error) {
      console.error('Failed to fetch bonding curve:', error);
    }
  }, [connection, tokenMint]);

  /**
   * Estimate priority fee
   */
  const updatePriorityFee = useCallback(async () => {
    try {
      const fee = await estimatePriorityFee(connection);
      setEstimatedPriorityFee(fee);
    } catch (error) {
      console.error('Failed to estimate priority fee:', error);
    }
  }, [connection]);

  /**
   * Get buy price estimate
   */
  const getBuyEstimate = useCallback(
    (solAmount: number): PriceEstimate | null => {
      if (!bondingCurve || solAmount <= 0) return null;
      return calculateBuyAmount(solAmount, bondingCurve);
    },
    [bondingCurve]
  );

  /**
   * Get sell price estimate
   */
  const getSellEstimate = useCallback(
    (tokenAmount: number): PriceEstimate | null => {
      if (!bondingCurve || tokenAmount <= 0) return null;
      return calculateSellAmount(tokenAmount, bondingCurve);
    },
    [bondingCurve]
  );

  /**
   * Execute buy transaction
   */
  const buy = useCallback(
    async (solAmount: number): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        toast.error('Please connect your wallet');
        return null;
      }

      if (solAmount <= 0) {
        toast.error('Invalid amount');
        return null;
      }

      if (solAmount > solBalance) {
        toast.error('Insufficient SOL balance');
        return null;
      }

      setIsLoading(true);
      setTransactionState({ status: 'pending' });

      const toastId = toast.loading('Preparing transaction...');

      try {
        // Update toast to confirming
        toast.loading('Confirming transaction...', { id: toastId });
        setTransactionState({ status: 'confirming' });

        const signature = await executeBuy(
          connection,
          {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
          },
          tokenMint,
          solAmount,
          tradingParams
        );

        setTransactionState({ status: 'success', signature });
        toast.success(
          <div>
            <p className="font-semibold">Buy successful!</p>
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-green underline text-sm"
            >
              View transaction
            </a>
          </div>,
          { id: toastId, duration: 5000 }
        );

        // Refresh data
        await refreshBalances();
        await refreshBondingCurve();

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['token', tokenMint] });
        queryClient.invalidateQueries({ queryKey: ['trades', tokenMint] });

        onSuccess?.(signature, 'buy');
        return signature;
      } catch (error) {
        const err = error as Error;
        setTransactionState({ status: 'error', error: err.message });
        toast.error(
          <div>
            <p className="font-semibold">Transaction failed</p>
            <p className="text-sm text-gray-400">{err.message}</p>
          </div>,
          { id: toastId, duration: 5000 }
        );
        onError?.(err, 'buy');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      wallet,
      connection,
      tokenMint,
      solBalance,
      tradingParams,
      refreshBalances,
      refreshBondingCurve,
      queryClient,
      onSuccess,
      onError,
    ]
  );

  /**
   * Execute sell transaction
   */
  const sell = useCallback(
    async (tokenAmount: number): Promise<string | null> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        toast.error('Please connect your wallet');
        return null;
      }

      if (tokenAmount <= 0) {
        toast.error('Invalid amount');
        return null;
      }

      if (tokenAmount > tokenBalance) {
        toast.error('Insufficient token balance');
        return null;
      }

      setIsLoading(true);
      setTransactionState({ status: 'pending' });

      const toastId = toast.loading('Preparing transaction...');

      try {
        toast.loading('Confirming transaction...', { id: toastId });
        setTransactionState({ status: 'confirming' });

        const signature = await executeSell(
          connection,
          {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
          },
          tokenMint,
          tokenAmount,
          tradingParams
        );

        setTransactionState({ status: 'success', signature });
        toast.success(
          <div>
            <p className="font-semibold">Sell successful!</p>
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-green underline text-sm"
            >
              View transaction
            </a>
          </div>,
          { id: toastId, duration: 5000 }
        );

        // Refresh data
        await refreshBalances();
        await refreshBondingCurve();

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['token', tokenMint] });
        queryClient.invalidateQueries({ queryKey: ['trades', tokenMint] });

        onSuccess?.(signature, 'sell');
        return signature;
      } catch (error) {
        const err = error as Error;
        setTransactionState({ status: 'error', error: err.message });
        toast.error(
          <div>
            <p className="font-semibold">Transaction failed</p>
            <p className="text-sm text-gray-400">{err.message}</p>
          </div>,
          { id: toastId, duration: 5000 }
        );
        onError?.(err, 'sell');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      wallet,
      connection,
      tokenMint,
      tokenBalance,
      tradingParams,
      refreshBalances,
      refreshBondingCurve,
      queryClient,
      onSuccess,
      onError,
    ]
  );

  // Initial load
  useMemo(() => {
    if (tokenMint && wallet.connected) {
      refreshBalances();
      refreshBondingCurve();
      updatePriorityFee();
    }
  }, [tokenMint, wallet.connected, refreshBalances, refreshBondingCurve, updatePriorityFee]);

  return {
    // State
    isLoading,
    transactionState,
    bondingCurve,
    tokenBalance,
    solBalance,
    estimatedPriorityFee,

    // Trading params
    slippageBps,
    setSlippageBps,
    priorityFee,
    setPriorityFee,

    // Price estimates
    getBuyEstimate,
    getSellEstimate,

    // Actions
    buy,
    sell,
    refreshBalances,
    refreshBondingCurve,
  };
}

/**
 * Hook for quick trade actions (preset amounts)
 */
export function useQuickTrade(tokenMint: string) {
  const trading = useTrading(tokenMint);

  const quickBuy = useCallback(
    async (percentage: number) => {
      const amount = trading.solBalance * (percentage / 100);
      if (amount > 0) {
        return trading.buy(amount);
      }
      return null;
    },
    [trading]
  );

  const quickSell = useCallback(
    async (percentage: number) => {
      const amount = trading.tokenBalance * (percentage / 100);
      if (amount > 0) {
        return trading.sell(amount);
      }
      return null;
    },
    [trading]
  );

  return {
    ...trading,
    quickBuy,
    quickSell,
  };
}

export default useTrading;
