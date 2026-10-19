import { useQuery } from '@tanstack/react-query';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { busApi } from '../api/bus-api';
import { BusRouteDetail } from '../types';

export interface UseBusRouteDetailReturn {
  routeDetail: BusRouteDetail | null;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve specific bus route details, stop sequences, and path coordinates.
 */
export function useBusRouteDetail(routeId: string): UseBusRouteDetailReturn {
  // Listen for realtime bus stops and route mutations
  useTableRealtime('bus_stops');
  useTableRealtime('bus_routes');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    BusRouteDetail,
    unknown
  >({
    queryKey: [...QUERY_KEYS.bus, routeId],
    queryFn: () => busApi.fetchBusRouteDetail(routeId),
    enabled: Boolean(routeId),
    staleTime: STALE_TIMES.bus,
  });

  return {
    routeDetail: data ?? null,
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
