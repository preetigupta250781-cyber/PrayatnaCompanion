import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { QUERY_KEYS } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { busApi } from '../../api/bus-api';
import { BusRoute, BusRouteDetail } from '../../types';
import { useBusRouteDetail } from '../use-bus-route-detail';
import { useBusRoutes } from '../use-bus-routes';

jest.mock('../../api/bus-api');
jest.mock('@/shared/lib/realtime', () => ({
  useTableRealtime: jest.fn(),
}));

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function RoutesConsumer({
  onData,
}: {
  onData: (data: ReturnType<typeof useBusRoutes>) => void;
}): null {
  const result = useBusRoutes();
  onData(result);
  return null;
}

function RouteDetailConsumer({
  routeId,
  onData,
}: {
  routeId: string;
  onData: (data: ReturnType<typeof useBusRouteDetail>) => void;
}): null {
  const result = useBusRouteDetail(routeId);
  onData(result);
  return null;
}

describe('Bus Hooks', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (tree) {
      renderer.act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    queryClient.clear();
  });

  describe('useBusRoutes', () => {
    it('subscribes to realtime updates and returns cached routes from query client', async () => {
      const mockRoutes: BusRoute[] = [
        {
          id: 'b1111111-0001-4000-a000-000000000001',
          name: 'Indore City Transit Express',
          description: 'Circuit',
          color: '#00F0FF',
          origin_city: 'Indore',
          departs_at: '2026-10-24T02:00:00.000Z',
          sort_order: 1,
        },
      ];

      queryClient.setQueryData(QUERY_KEYS.bus, mockRoutes);
      (busApi.fetchBusRoutes as jest.Mock).mockResolvedValue(mockRoutes);

      let hookResult: ReturnType<typeof useBusRoutes> | undefined;

      renderer.act(() => {
        tree = renderer.create(
          <QueryClientProvider client={queryClient}>
            <RoutesConsumer
              onData={(data) => {
                hookResult = data;
              }}
            />
          </QueryClientProvider>
        );
      });

      expect(useTableRealtime).toHaveBeenCalledWith('bus_routes');
      expect(hookResult?.routes).toHaveLength(1);
      expect(hookResult?.routes[0]?.name).toBe('Indore City Transit Express');
      expect(hookResult?.isLoading).toBe(false);
      expect(hookResult?.isError).toBe(false);

      // Verify refetch
      await renderer.act(async () => {
        await hookResult?.refetch();
      });
      expect(busApi.fetchBusRoutes).toHaveBeenCalled();
    });

    it('handles query errors cleanly', async () => {
      const error = new Error('Network error');
      (busApi.fetchBusRoutes as jest.Mock).mockRejectedValue(error);

      queryClient.setQueryDefaults(QUERY_KEYS.bus, { retry: false });

      try {
        await queryClient.fetchQuery({
          queryKey: QUERY_KEYS.bus,
          queryFn: busApi.fetchBusRoutes,
        });
      } catch {
        // expected error
      }

      let hookResult: ReturnType<typeof useBusRoutes> | undefined;

      await renderer.act(async () => {
        tree = renderer.create(
          <QueryClientProvider client={queryClient}>
            <RoutesConsumer
              onData={(data) => {
                hookResult = data;
              }}
            />
          </QueryClientProvider>
        );
      });

      await renderer.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(hookResult?.isError).toBe(true);
      expect(hookResult?.error?.userMessage).toBeDefined();
    });
  });

  describe('useBusRouteDetail', () => {
    it('subscribes to bus_stops and bus_routes and returns route detail', async () => {
      const mockDetail: BusRouteDetail = {
        route: {
          id: 'b1111111-0001-4000-a000-000000000001',
          name: 'Indore City Transit Express',
          description: 'Circuit',
          color: '#00F0FF',
          origin_city: 'Indore',
          departs_at: '2026-10-24T02:00:00.000Z',
          sort_order: 1,
        },
        stops: [
          {
            id: 'c1111111-0001-4000-a000-000000000001',
            route_id: 'b1111111-0001-4000-a000-000000000001',
            name: 'Rajwada Historical Gate',
            latitude: 22.7186,
            longitude: 75.855,
            stop_order: 1,
            scheduled_time: '2026-10-24T02:00:00.000Z',
            notes: 'Main arch',
          },
        ],
        path: null,
        validStops: [
          {
            id: 'c1111111-0001-4000-a000-000000000001',
            route_id: 'b1111111-0001-4000-a000-000000000001',
            name: 'Rajwada Historical Gate',
            latitude: 22.7186,
            longitude: 75.855,
            stop_order: 1,
            scheduled_time: '2026-10-24T02:00:00.000Z',
            notes: 'Main arch',
          },
        ],
        validPathCoordinates: [],
      };

      const routeId = 'b1111111-0001-4000-a000-000000000001';
      queryClient.setQueryData([...QUERY_KEYS.bus, routeId], mockDetail);
      (busApi.fetchBusRouteDetail as jest.Mock).mockResolvedValue(mockDetail);

      let hookResult: ReturnType<typeof useBusRouteDetail> | undefined;

      renderer.act(() => {
        tree = renderer.create(
          <QueryClientProvider client={queryClient}>
            <RouteDetailConsumer
              routeId={routeId}
              onData={(data) => {
                hookResult = data;
              }}
            />
          </QueryClientProvider>
        );
      });

      expect(useTableRealtime).toHaveBeenCalledWith('bus_stops');
      expect(useTableRealtime).toHaveBeenCalledWith('bus_routes');
      expect(hookResult?.routeDetail?.route.name).toBe('Indore City Transit Express');
      expect(hookResult?.routeDetail?.validStops).toHaveLength(1);
    });
  });
});
