'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useSocketEvent } from './useSocketEvent';

/**
 * Token room state
 */
interface TokenRoomState {
  /** Whether currently joined to the room */
  isJoined: boolean;
  /** Whether join is pending */
  isJoining: boolean;
  /** Error message if any */
  error: string | null;
  /** Number of other users in the room */
  viewerCount: number;
}

/**
 * Token room event data
 */
interface TokenRoomEventData {
  tokenMint: string;
  room: string;
}

interface ViewerCountData {
  tokenMint: string;
  count: number;
}

/**
 * Options for useTokenRoom hook
 */
interface UseTokenRoomOptions {
  /** Auto-join when token mint changes */
  autoJoin?: boolean;
  /** Callback when successfully joined */
  onJoin?: (tokenMint: string) => void;
  /** Callback when left room */
  onLeave?: (tokenMint: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Hook for joining and leaving token-specific rooms
 * Handles automatic cleanup when component unmounts or token changes
 *
 * @param tokenMint - The token mint address to join room for
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { isJoined, join, leave, viewerCount } = useTokenRoom('tokenMintAddress', {
 *   autoJoin: true,
 *   onJoin: () => console.log('Joined room'),
 * });
 * ```
 */
export function useTokenRoom(
  tokenMint: string | null | undefined,
  options: UseTokenRoomOptions = {}
): TokenRoomState & {
  join: () => void;
  leave: () => void;
} {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();
  const { autoJoin = true, onJoin, onLeave, onError } = options;

  const [state, setState] = useState<TokenRoomState>({
    isJoined: false,
    isJoining: false,
    error: null,
    viewerCount: 0,
  });

  // Track the currently joined room to handle cleanup
  const joinedRoomRef = useRef<string | null>(null);
  const tokenMintRef = useRef(tokenMint);

  // Update token mint ref
  useEffect(() => {
    tokenMintRef.current = tokenMint;
  }, [tokenMint]);

  // Handle successful join
  useSocketEvent<TokenRoomEventData>(
    'joined:token',
    useCallback(
      (data) => {
        if (data.tokenMint === tokenMintRef.current) {
          joinedRoomRef.current = data.tokenMint;
          setState((prev) => ({
            ...prev,
            isJoined: true,
            isJoining: false,
            error: null,
          }));
          onJoin?.(data.tokenMint);
        }
      },
      [onJoin]
    ),
    { enabled: !!tokenMint }
  );

  // Handle successful leave
  useSocketEvent<TokenRoomEventData>(
    'left:token',
    useCallback(
      (data) => {
        if (data.tokenMint === tokenMintRef.current || data.tokenMint === joinedRoomRef.current) {
          joinedRoomRef.current = null;
          setState((prev) => ({
            ...prev,
            isJoined: false,
            isJoining: false,
            viewerCount: 0,
          }));
          onLeave?.(data.tokenMint);
        }
      },
      [onLeave]
    ),
    { enabled: !!tokenMint }
  );

  // Handle viewer count updates
  useSocketEvent<ViewerCountData>(
    'room:viewerCount',
    useCallback((data) => {
      if (data.tokenMint === tokenMintRef.current) {
        setState((prev) => ({
          ...prev,
          viewerCount: data.count,
        }));
      }
    }, []),
    { enabled: !!tokenMint && state.isJoined }
  );

  // Handle errors
  useSocketEvent<{ message: string }>(
    'error',
    useCallback(
      (data) => {
        setState((prev) => ({
          ...prev,
          error: data.message,
          isJoining: false,
        }));
        onError?.(data.message);
      },
      [onError]
    ),
    { enabled: !!tokenMint }
  );

  // Join room function
  const join = useCallback(() => {
    if (!tokenMint || !isConnected || state.isJoined || state.isJoining) {
      return;
    }

    // Leave any previously joined room
    if (joinedRoomRef.current && joinedRoomRef.current !== tokenMint) {
      leaveRoom(joinedRoomRef.current);
    }

    setState((prev) => ({
      ...prev,
      isJoining: true,
      error: null,
    }));

    joinRoom(tokenMint);
  }, [tokenMint, isConnected, state.isJoined, state.isJoining, joinRoom, leaveRoom]);

  // Leave room function
  const leave = useCallback(() => {
    if (!tokenMint || !joinedRoomRef.current) {
      return;
    }

    leaveRoom(tokenMint);
  }, [tokenMint, leaveRoom]);

  // Auto-join when connected and token changes
  useEffect(() => {
    if (!isConnected || !tokenMint) {
      return;
    }

    // If auto-join is enabled and we're not in the correct room
    if (autoJoin && joinedRoomRef.current !== tokenMint) {
      join();
    }

    // Cleanup: leave room when token changes or component unmounts
    return () => {
      if (joinedRoomRef.current) {
        leaveRoom(joinedRoomRef.current);
        joinedRoomRef.current = null;
      }
    };
  }, [tokenMint, isConnected, autoJoin, join, leaveRoom]);

  // Reset state when disconnected
  useEffect(() => {
    if (!isConnected) {
      setState({
        isJoined: false,
        isJoining: false,
        error: null,
        viewerCount: 0,
      });
      joinedRoomRef.current = null;
    }
  }, [isConnected]);

  // Re-join after reconnection
  useEffect(() => {
    if (isConnected && autoJoin && tokenMint && !state.isJoined && !state.isJoining) {
      join();
    }
  }, [isConnected, autoJoin, tokenMint, state.isJoined, state.isJoining, join]);

  return {
    ...state,
    join,
    leave,
  };
}

/**
 * Hook for subscribing to global feed
 *
 * @example
 * ```tsx
 * const { isSubscribed, subscribe, unsubscribe } = useGlobalFeed({
 *   autoSubscribe: true,
 * });
 * ```
 */
export function useGlobalFeed(options: { autoSubscribe?: boolean } = {}) {
  const { socket, isConnected, subscribeToGlobal, unsubscribeFromGlobal } = useSocket();
  const { autoSubscribe = false } = options;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Handle subscription confirmation
  useSocketEvent(
    'subscribed:global',
    useCallback(() => {
      setIsSubscribed(true);
      setIsSubscribing(false);
    }, [])
  );

  // Handle unsubscription confirmation
  useSocketEvent(
    'unsubscribed:global',
    useCallback(() => {
      setIsSubscribed(false);
    }, [])
  );

  const subscribe = useCallback(() => {
    if (!isConnected || isSubscribed || isSubscribing) {
      return;
    }
    setIsSubscribing(true);
    subscribeToGlobal();
  }, [isConnected, isSubscribed, isSubscribing, subscribeToGlobal]);

  const unsubscribe = useCallback(() => {
    if (!isSubscribed) {
      return;
    }
    unsubscribeFromGlobal();
  }, [isSubscribed, unsubscribeFromGlobal]);

  // Auto-subscribe
  useEffect(() => {
    if (autoSubscribe && isConnected && !isSubscribed) {
      subscribe();
    }

    return () => {
      if (isSubscribed) {
        unsubscribeFromGlobal();
      }
    };
  }, [autoSubscribe, isConnected, isSubscribed, subscribe, unsubscribeFromGlobal]);

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected) {
      setIsSubscribed(false);
      setIsSubscribing(false);
    }
  }, [isConnected]);

  return {
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
  };
}

export default useTokenRoom;
