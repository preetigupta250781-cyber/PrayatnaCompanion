import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { logger } from '@/shared/lib/logger';
import { queryClient } from '@/shared/lib/query-client';
import { setSentryUser } from '@/shared/lib/sentry';

import { authApi } from '../api/auth-api';
import type { ProfileWithTeam } from '../types';

export const PERSISTED_QUERY_CACHE_KEY = 'PRAYATNA_QUERY_CACHE_V1';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileWithTeam | null;
  isInitialized: boolean;
  authNotice: string | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileWithTeam | null) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setAuthNotice: (notice: string | null) => void;
  clearAuthNotice: () => void;
  signOut: (notice?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  authNotice: null,

  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setProfile: (profile: ProfileWithTeam | null) => set({ profile }),

  setIsInitialized: (isInitialized: boolean) => set({ isInitialized }),

  setAuthNotice: (authNotice: string | null) => set({ authNotice }),

  clearAuthNotice: () => set({ authNotice: null }),

  signOut: async (notice?: string) => {
    try {
      await authApi.signOutUser();
    } catch (error: unknown) {
      logger.warn('Sign out error', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      // 1. Clear in-memory query cache
      queryClient.clear();

      // 2. Clear persisted query cache from AsyncStorage
      try {
        await AsyncStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
      } catch (cacheErr) {
        logger.warn('Failed to clear persisted query cache on sign out', {
          error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
        });
      }

      // 3. Clear Sentry user context
      setSentryUser(null);

      // 4. Reset auth state and optionally set flash notice
      set({
        session: null,
        user: null,
        profile: null,
        authNotice: notice ?? null,
      });
    }
  },
}));
