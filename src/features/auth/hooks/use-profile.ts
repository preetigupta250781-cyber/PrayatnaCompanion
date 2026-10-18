import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import type { Team } from '@/shared/types';

import { authApi } from '../api/auth-api';
import { useAuthStore } from '../model/auth-store';
import type { ProfileWithTeam } from '../types';

export interface UseProfileReturn {
  profile: ProfileWithTeam | null;
  team: Team | null;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<UseQueryResult<ProfileWithTeam | null, Error>>;
  isRefetching: boolean;
}

export const PROFILE_MISSING_MESSAGE =
  'Your account does not have an active participant profile. Please contact the organizers.';
export const SESSION_EXPIRED_MESSAGE =
  'Your session has expired or your account was removed. Please sign in again.';

/**
 * Hook providing current user profile and team details.
 * Automatically enforces forced sign-out if profile is missing or session invalidated.
 */
export function useProfile(): UseProfileReturn {
  const session = useAuthStore((s) => s.session);
  const storedProfile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: [...QUERY_KEYS.profile, userId ?? 'anonymous'],
    queryFn: async (): Promise<ProfileWithTeam | null> => {
      if (!userId) {
        return null;
      }
      return authApi.fetchProfileWithTeam(userId);
    },
    enabled: Boolean(userId),
    staleTime: STALE_TIMES.profile,
  });

  // Watch for profile presence and auth validity
  useEffect(() => {
    // If not authenticated or query is still loading, wait
    if (!session || !userId || query.isLoading) {
      return;
    }

    // 1. Session exists, but no profile row in database
    if (query.isSuccess && query.data === null) {
      void signOut(PROFILE_MISSING_MESSAGE);
      return;
    }

    // 2. Query error indicating token invalid, expired, or account deleted
    if (query.isError && query.error) {
      const appErr = mapToAppError(query.error);
      const isAuthIssue =
        appErr.code === 'AUTH_SESSION_EXPIRED' ||
        appErr.code === 'AUTH_UNAUTHORIZED' ||
        appErr.code === 'PERMISSION_DENIED';

      if (isAuthIssue) {
        void signOut(SESSION_EXPIRED_MESSAGE);
        return;
      }
    }

    // 3. Successful fetch: update stored profile in auth store
    if (query.isSuccess && query.data) {
      setProfile(query.data);
    }
  }, [
    session,
    userId,
    query.isSuccess,
    query.isError,
    query.isLoading,
    query.data,
    query.error,
    signOut,
    setProfile,
  ]);

  const activeProfile = query.data ?? storedProfile ?? null;

  return {
    profile: activeProfile,
    team: (activeProfile?.team as Team | null | undefined) ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? mapToAppError(query.error) : null,
    refetch: query.refetch as () => Promise<UseQueryResult<ProfileWithTeam | null, Error>>,
    isRefetching: query.isRefetching,
  };
}
