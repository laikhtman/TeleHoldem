import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTelegramWebApp } from './useTelegramWebApp';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface TelegramAuthUser {
  id: number;
  displayName: string;
  photoUrl?: string;
  bankroll: number;
  stats: {
    handsPlayed: number;
    handsWon: number;
    biggestPot: number;
    totalWinnings: number;
    achievements: string[];
  };
}

interface AuthResponse {
  success: boolean;
  user: TelegramAuthUser;
}

interface SessionResponse {
  user: TelegramAuthUser;
}

/**
 * Hook to manage Telegram authentication
 * Automatically authenticates when running in Telegram context
 * Returns user data, loading state, and auth status
 */
export function useTelegramAuth() {
  const { isInTelegram, isReady, initData } = useTelegramWebApp();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  // Mutation for authenticating with Telegram initData
  const authMutation = useMutation({
    mutationFn: async (initDataPayload: string) => {
      const response = await apiRequest('POST', '/api/telegram/auth', { initData: initDataPayload });
      return await response.json() as AuthResponse;
    },
    onSuccess: (data) => {
      // Cache the user data
      queryClient.setQueryData(['/api/session'], { user: data.user });
    },
    onError: (error) => {
      console.error('Telegram auth failed:', error);
    },
  });

  // Query for current session (only runs if we're in Telegram and have attempted auth)
  const sessionQuery = useQuery<SessionResponse | null>({
    queryKey: ['/api/session'],
    queryFn: async () => {
      const res = await fetch('/api/session', {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch session');
      }
      return await res.json();
    },
    enabled: isInTelegram && hasAttemptedAuth,
    retry: false,
  });

  // Automatically authenticate when in Telegram
  useEffect(() => {
    if (isInTelegram && isReady && initData && !hasAttemptedAuth && !authMutation.isPending) {
      setHasAttemptedAuth(true);
      authMutation.mutate(initData);
    }
  }, [isInTelegram, isReady, initData, hasAttemptedAuth, authMutation]);

  const isLoading = isInTelegram 
    ? (!hasAttemptedAuth || authMutation.isPending || sessionQuery.isLoading)
    : false;

  const isAuthenticated = isInTelegram 
    ? (authMutation.isSuccess && !!sessionQuery.data?.user)
    : false;

  const user = isInTelegram ? sessionQuery.data?.user : null;
  const error = authMutation.error || sessionQuery.error;

  return {
    isInTelegram,
    isAuthenticated,
    isLoading,
    user,
    error,
    isStandalone: !isInTelegram,
  };
}
