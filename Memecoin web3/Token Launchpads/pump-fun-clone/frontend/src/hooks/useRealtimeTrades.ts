'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocketEvent } from './useSocketEvent';
import { useTokenRoom } from './useTokenRoom';

/**
 * Trade data structure
 */
export interface Trade {
  id: string;
  tokenMint: string;
  type: 'buy' | 'sell';
  trader: string;
  traderShort: string;
  amountSol: number;
  amountTokens: number;
  price: number;
  priceUsd?: number | null;
  timestamp: number;
  signature?: string | null;
  isBuy: boolean;
  valueUsd?: number | null;
  // UI state
  isNew?: boolean;
  isAnimating?: boolean;
}

/**
 * Trade event from socket
 */
interface TradeEventData {
  type: 'trade';
  tokenMint: string;
  data: Trade;
  timestamp: number;
}

/**
 * Options for useRealtimeTrades hook
 */
interface UseRealtimeTradesOptions {
  /** Maximum number of trades to keep in memory */
  maxTrades?: number;
  /** Auto-join token room */
  autoJoin?: boolean;
  /** Callback when new trade arrives */
  onNewTrade?: (trade: Trade) => void;
  /** Duration to mark trade as "new" for animations (ms) */
  newTradeDuration?: number;
  /** Include global trades (from other tokens) */
  includeGlobal?: boolean;
}

/**
 * Hook for real-time trade updates
 * Manages trade list with optimistic updates and animation states
 *
 * @param tokenMint - Token mint address to watch trades for
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { trades, isConnected, addOptimisticTrade } = useRealtimeTrades('tokenMint', {
 *   maxTrades: 50,
 *   onNewTrade: (trade) => playSound(trade.type),
 * });
 * ```
 */
export function useRealtimeTrades(
  tokenMint: string | null | undefined,
  options: UseRealtimeTradesOptions = {}
) {
  const {
    maxTrades = 100,
    autoJoin = true,
    onNewTrade,
    newTradeDuration = 3000,
    includeGlobal = false,
  } = options;

  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeCount, setTradeCount] = useState(0);
  const tradesRef = useRef<Map<string, Trade>>(new Map());
  const animationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Join token room
  const { isJoined, isJoining, error } = useTokenRoom(tokenMint, {
    autoJoin,
  });

  // Add a trade to the list
  const addTrade = useCallback(
    (trade: Trade, isOptimistic: boolean = false) => {
      // Skip if trade already exists (by ID)
      if (tradesRef.current.has(trade.id)) {
        return;
      }

      const enrichedTrade: Trade = {
        ...trade,
        isNew: true,
        isAnimating: true,
      };

      tradesRef.current.set(trade.id, enrichedTrade);

      setTrades((prev) => {
        // Add to beginning of list
        const updated = [enrichedTrade, ...prev];

        // Trim to max size
        if (updated.length > maxTrades) {
          const removed = updated.splice(maxTrades);
          // Clean up removed trades from ref
          for (const t of removed) {
            tradesRef.current.delete(t.id);
          }
        }

        return updated;
      });

      setTradeCount((prev) => prev + 1);

      // Trigger callback
      if (!isOptimistic && onNewTrade) {
        onNewTrade(enrichedTrade);
      }

      // Clear "new" state after duration
      const timeout = setTimeout(() => {
        setTrades((prev) =>
          prev.map((t) =>
            t.id === trade.id ? { ...t, isNew: false, isAnimating: false } : t
          )
        );
        animationTimeoutsRef.current.delete(trade.id);
      }, newTradeDuration);

      animationTimeoutsRef.current.set(trade.id, timeout);
    },
    [maxTrades, newTradeDuration, onNewTrade]
  );

  // Handle incoming trade event
  useSocketEvent<TradeEventData>(
    'trade:new',
    useCallback(
      (event) => {
        if (event.tokenMint !== tokenMint) return;
        addTrade(event.data);
      },
      [tokenMint, addTrade]
    ),
    { enabled: !!tokenMint && isJoined }
  );

  // Handle global trade events (optional)
  useSocketEvent<TradeEventData>(
    'trade:global',
    useCallback(
      (event) => {
        // Only include if explicitly enabled and matches token
        if (!includeGlobal || event.tokenMint !== tokenMint) return;
        addTrade(event.data);
      },
      [tokenMint, includeGlobal, addTrade]
    ),
    { enabled: includeGlobal && !!tokenMint }
  );

  // Add optimistic trade (before confirmation)
  const addOptimisticTrade = useCallback(
    (trade: Omit<Trade, 'id' | 'timestamp' | 'isNew' | 'isAnimating'>) => {
      const optimisticTrade: Trade = {
        ...trade,
        id: `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        isNew: true,
        isAnimating: true,
        isBuy: trade.type === 'buy',
        traderShort: trade.trader
          ? `${trade.trader.slice(0, 4)}...${trade.trader.slice(-4)}`
          : 'Unknown',
      };

      addTrade(optimisticTrade, true);

      return optimisticTrade.id;
    },
    [addTrade]
  );

  // Confirm optimistic trade (replace with real data)
  const confirmOptimisticTrade = useCallback((optimisticId: string, realTrade: Trade) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === optimisticId ? { ...realTrade, isNew: false } : t))
    );
    tradesRef.current.delete(optimisticId);
    tradesRef.current.set(realTrade.id, realTrade);
  }, []);

  // Remove optimistic trade (on failure)
  const removeOptimisticTrade = useCallback((optimisticId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== optimisticId));
    tradesRef.current.delete(optimisticId);

    const timeout = animationTimeoutsRef.current.get(optimisticId);
    if (timeout) {
      clearTimeout(timeout);
      animationTimeoutsRef.current.delete(optimisticId);
    }
  }, []);

  // Clear all trades
  const clearTrades = useCallback(() => {
    setTrades([]);
    tradesRef.current.clear();

    // Clear all animation timeouts
    for (const timeout of animationTimeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    animationTimeoutsRef.current.clear();
  }, []);

  // Reset when token changes
  useEffect(() => {
    clearTrades();
    setTradeCount(0);
  }, [tokenMint, clearTrades]);

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timeout of animationTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return {
    trades,
    tradeCount,
    isJoined,
    isJoining,
    error,
    addOptimisticTrade,
    confirmOptimisticTrade,
    removeOptimisticTrade,
    clearTrades,
  };
}

/**
 * Hook for global trade feed (all tokens)
 */
export function useGlobalTrades(options: Omit<UseRealtimeTradesOptions, 'autoJoin'> = {}) {
  const { maxTrades = 50, onNewTrade, newTradeDuration = 3000 } = options;

  const [trades, setTrades] = useState<Trade[]>([]);
  const tradesRef = useRef<Map<string, Trade>>(new Map());
  const animationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Add trade to global feed
  const addTrade = useCallback(
    (trade: Trade) => {
      if (tradesRef.current.has(trade.id)) return;

      const enrichedTrade: Trade = {
        ...trade,
        isNew: true,
        isAnimating: true,
      };

      tradesRef.current.set(trade.id, enrichedTrade);

      setTrades((prev) => {
        const updated = [enrichedTrade, ...prev];
        if (updated.length > maxTrades) {
          const removed = updated.splice(maxTrades);
          for (const t of removed) {
            tradesRef.current.delete(t.id);
          }
        }
        return updated;
      });

      onNewTrade?.(enrichedTrade);

      const timeout = setTimeout(() => {
        setTrades((prev) =>
          prev.map((t) =>
            t.id === trade.id ? { ...t, isNew: false, isAnimating: false } : t
          )
        );
        animationTimeoutsRef.current.delete(trade.id);
      }, newTradeDuration);

      animationTimeoutsRef.current.set(trade.id, timeout);
    },
    [maxTrades, newTradeDuration, onNewTrade]
  );

  // Listen to global trade events
  useSocketEvent<TradeEventData>(
    'trade:global',
    useCallback(
      (event) => {
        addTrade(event.data);
      },
      [addTrade]
    )
  );

  // Cleanup
  useEffect(() => {
    return () => {
      for (const timeout of animationTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return { trades };
}

export default useRealtimeTrades;
