import { useQuery } from '@tanstack/react-query';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { scheduleApi } from '../api/schedule-api';
import { ScheduleEvent } from '../types';

export interface UseScheduleReturn {
  events: ScheduleEvent[];
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve the hackathon event schedule with TanStack Query caching
 * and automatic Supabase Realtime synchronization.
 */
export function useSchedule(): UseScheduleReturn {
  // Subscribe to table changes to invalidate cache automatically
  useTableRealtime('schedule_events');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ScheduleEvent[],
    unknown
  >({
    queryKey: QUERY_KEYS.schedule,
    queryFn: scheduleApi.fetchScheduleEvents,
    staleTime: STALE_TIMES.schedule,
  });

  return {
    events: data ?? [],
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
