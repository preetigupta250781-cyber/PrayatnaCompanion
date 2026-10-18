import { useQuery } from '@tanstack/react-query';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { announcementsApi } from '../api/announcements-api';
import { Announcement } from '../types';

export interface UseAnnouncementsReturn {
  announcements: Announcement[];
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve announcements feed with TanStack Query caching
 * and automatic Supabase Realtime synchronization.
 */
export function useAnnouncements(): UseAnnouncementsReturn {
  // Subscribe to table changes to invalidate cache automatically
  useTableRealtime('announcements');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    Announcement[],
    unknown
  >({
    queryKey: QUERY_KEYS.announcements,
    queryFn: announcementsApi.fetchAnnouncements,
    staleTime: STALE_TIMES.announcements,
  });

  return {
    announcements: data ?? [],
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
