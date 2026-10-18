import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { mapToAppError } from './errors';

/**
 * Standardized stale times per resource requirement
 */
export const STALE_TIMES = {
  schedule: 60 * 1000, // 60s
  announcements: 15 * 1000, // 15s
  leaderboard: 10 * 1000, // 10s
  problems: 30 * 1000, // 30s
  bus: 10 * 60 * 1000, // 10 minutes
  teams: 5 * 60 * 1000, // 5 minutes
  profile: 5 * 60 * 1000, // 5 minutes
  serverNow: 60 * 1000, // 60s
} as const;

/**
 * Centralized Query Keys
 */
export const QUERY_KEYS = {
  schedule: ['schedule'] as const,
  announcements: ['announcements'] as const,
  leaderboard: ['leaderboard'] as const,
  problems: ['problems'] as const,
  bus: ['bus'] as const,
  teams: ['teams'] as const,
  profile: ['profile'] as const,
  serverNow: ['server_now'] as const,
} as const;

/**
 * Focus manager synchronization with React Native AppState
 */
function onAppStateChange(status: AppStateStatus): void {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

if (process.env.NODE_ENV !== 'test') {
  AppState.addEventListener('change', onAppStateChange);

  // Online manager synchronization with NetInfo
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  });
}

/**
 * TanStack Query Client instance configured with retry backoff for retryable errors
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: unknown): boolean => {
        if (failureCount >= 3) return false;
        const appError = mapToAppError(error);
        return appError.retryable;
      },
      retryDelay: (attemptIndex: number): number => {
        // Exponential backoff: 1s, 2s, 4s capped at 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      staleTime: STALE_TIMES.schedule,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * Cache persister with AsyncStorage so the app opens instantly with last cached data
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'PRAYATNA_QUERY_CACHE_V1',
  throttleTime: 1000,
});

if (process.env.NODE_ENV !== 'test') {
  void persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days retention
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => query.state.status === 'success',
    },
  });
}
