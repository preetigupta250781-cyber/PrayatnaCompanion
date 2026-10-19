import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { busApi } from '../api/bus-api';
import { BusRoute } from '../types';

export interface UseBusRoutesReturn {
  routes: BusRoute[];
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve all registered bus transit routes with Realtime invalidation.
 */
export function useBusRoutes(): UseBusRoutesReturn {
  // Listen for realtime bus route updates
  useTableRealtime('bus_routes');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<BusRoute[], unknown>({
    queryKey: QUERY_KEYS.bus,
    queryFn: busApi.fetchBusRoutes,
    staleTime: STALE_TIMES.bus,
  });

  const routes = useMemo(() => data ?? [], [data]);

  return {
    routes,
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
