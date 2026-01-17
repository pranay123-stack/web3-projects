'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Token, Trade, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UseProfileOptions {
  address: string;
  enabled?: boolean;
}

interface ProfileData {
  user: User;
  isFollowing: boolean;
}

/**
 * Fetch user profile
 */
async function fetchProfile(address: string): Promise<ProfileData> {
  const response = await fetch(`${API_BASE_URL}/users/${address}`);

  if (!response.ok) {
    if (response.status === 404) {
      // Return default profile for new users
      return {
        user: {
          id: address,
          address,
          username: undefined,
          avatar: undefined,
          bio: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            tokensCreated: 0,
            totalTrades: 0,
            totalVolume: 0,
            totalPnL: 0,
            followers: 0,
            following: 0,
          },
        },
        isFollowing: false,
      };
    }
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

/**
 * Fetch tokens created by user
 */
async function fetchCreatedTokens(
  address: string,
  page = 1,
  pageSize = 12
): Promise<PaginatedResponse<Token>> {
  const response = await fetch(
    `${API_BASE_URL}/users/${address}/tokens?page=${page}&pageSize=${pageSize}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch created tokens');
  }

  return response.json();
}

/**
 * Fetch user's trade history
 */
async function fetchTradeHistory(
  address: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Trade>> {
  const response = await fetch(
    `${API_BASE_URL}/users/${address}/trades?page=${page}&pageSize=${pageSize}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch trade history');
  }

  return response.json();
}

/**
 * Hook to fetch and manage user profile
 */
export function useProfile({ address, enabled = true }: UseProfileOptions) {
  const queryClient = useQueryClient();
  const { sessionToken, user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.address === address;

  // Profile query
  const profileQuery = useQuery({
    queryKey: ['profile', address],
    queryFn: () => fetchProfile(address),
    enabled: enabled && !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Created tokens query
  const createdTokensQuery = useQuery({
    queryKey: ['profile', address, 'tokens'],
    queryFn: () => fetchCreatedTokens(address),
    enabled: enabled && !!address,
    staleTime: 60 * 1000, // 1 minute
  });

  // Trade history query
  const tradeHistoryQuery = useQuery({
    queryKey: ['profile', address, 'trades'],
    queryFn: () => fetchTradeHistory(address),
    enabled: enabled && !!address,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!sessionToken) throw new Error('Not authenticated');
      return authService.updateUserProfile(address, updates, sessionToken);
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.setQueryData(['profile', address], (old: ProfileData | undefined) => ({
          ...old,
          user: result.data,
        }));
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!sessionToken) throw new Error('Not authenticated');
      return authService.uploadAvatar(file, sessionToken);
    },
    onSuccess: async (result) => {
      if (result.success && result.data) {
        // Update profile with new avatar URL
        await updateProfileMutation.mutateAsync({ avatar: result.data.url });
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });

  // Follow/unfollow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (!sessionToken) throw new Error('Not authenticated');
      return authService.toggleFollow(address, sessionToken);
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        queryClient.setQueryData(['profile', address], (old: ProfileData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            isFollowing: result.data!.isFollowing,
            user: {
              ...old.user,
              stats: {
                ...old.user.stats,
                followers: old.user.stats.followers + (result.data!.isFollowing ? 1 : -1),
              },
            },
          };
        });
        toast.success(result.data.isFollowing ? 'Following user' : 'Unfollowed user');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });

  // Refresh profile data
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', address] });
  };

  // Load more tokens
  const loadMoreTokens = async (page: number) => {
    const data = await fetchCreatedTokens(address, page);
    queryClient.setQueryData(
      ['profile', address, 'tokens'],
      (old: PaginatedResponse<Token> | undefined) => {
        if (!old) return data;
        return {
          ...data,
          items: [...old.items, ...data.items],
        };
      }
    );
  };

  // Load more trades
  const loadMoreTrades = async (page: number) => {
    const data = await fetchTradeHistory(address, page);
    queryClient.setQueryData(
      ['profile', address, 'trades'],
      (old: PaginatedResponse<Trade> | undefined) => {
        if (!old) return data;
        return {
          ...data,
          items: [...old.items, ...data.items],
        };
      }
    );
  };

  return {
    // Profile data
    profile: profileQuery.data?.user ?? null,
    isFollowing: profileQuery.data?.isFollowing ?? false,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,

    // Created tokens
    createdTokens: createdTokensQuery.data?.items ?? [],
    createdTokensTotal: createdTokensQuery.data?.total ?? 0,
    createdTokensLoading: createdTokensQuery.isLoading,
    hasMoreTokens: createdTokensQuery.data?.hasMore ?? false,
    loadMoreTokens,

    // Trade history
    tradeHistory: tradeHistoryQuery.data?.items ?? [],
    tradeHistoryTotal: tradeHistoryQuery.data?.total ?? 0,
    tradeHistoryLoading: tradeHistoryQuery.isLoading,
    hasMoreTrades: tradeHistoryQuery.data?.hasMore ?? false,
    loadMoreTrades,

    // State
    isOwnProfile,

    // Actions
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    toggleFollow: toggleFollowMutation.mutate,
    refreshProfile,

    // Mutation states
    isUpdating: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isTogglingFollow: toggleFollowMutation.isPending,
  };
}

export default useProfile;
