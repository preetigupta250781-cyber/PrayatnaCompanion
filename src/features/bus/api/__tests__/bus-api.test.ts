import { AppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { busApi } from '../bus-api';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('busApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRoute = {
    id: 'b1111111-0001-4000-a000-000000000001',
    name: 'Indore City Transit Express',
    description: 'High-frequency circuit',
    color: '#00F0FF',
    origin_city: 'Indore',
    departs_at: '2026-10-24T02:00:00.000Z',
    sort_order: 1,
  };

  const mockStops = [
    {
      id: 'c1111111-0001-4000-a000-000000000001',
      route_id: 'b1111111-0001-4000-a000-000000000001',
      name: 'Rajwada Historical Gate',
      latitude: 22.7186,
      longitude: 75.855,
      stop_order: 1,
      scheduled_time: '2026-10-24T02:00:00.000Z',
      notes: 'Opposite main arch',
    },
    {
      id: 'c1111111-0002-4000-a000-000000000002',
      route_id: 'b1111111-0001-4000-a000-000000000001',
      name: 'Invalid Latitude Stop',
      latitude: 105.0, // Invalid lat > 90
      longitude: 75.86,
      stop_order: 2,
      scheduled_time: '2026-10-24T02:15:00.000Z',
      notes: null,
    },
  ];

  const mockPath = {
    id: 'd1111111-0001-4000-a000-000000000001',
    route_id: 'b1111111-0001-4000-a000-000000000001',
    points: [
      { lat: 22.7186, lng: 75.855 },
      { lat: 22.7195, lng: 75.867 },
    ],
  };

  describe('fetchBusRoutes', () => {
    it('fetches and returns validated routes ordered by sort_order', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [mockRoute], error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await busApi.fetchBusRoutes();

      expect(supabase.from).toHaveBeenCalledWith('bus_routes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Indore City Transit Express');
    });

    it('returns empty array when data is null', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await busApi.fetchBusRoutes();
      expect(result).toEqual([]);
    });

    it('wraps PostgREST error into AppError', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database failure', code: 'PGRST500' },
      });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(busApi.fetchBusRoutes()).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('fetchBusRouteDetail', () => {
    it('fetches route, stops, and path, filtering invalid coordinates and returning detail', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bus_routes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
              }),
            }),
          };
        }
        if (table === 'bus_stops') {
          return {
            select: () => ({
              eq: () => ({
                order: jest.fn().mockResolvedValue({ data: mockStops, error: null }),
              }),
            }),
          };
        }
        if (table === 'bus_route_paths') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: mockPath, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const detail = await busApi.fetchBusRouteDetail('b1111111-0001-4000-a000-000000000001');

      expect(detail.route.id).toBe('b1111111-0001-4000-a000-000000000001');
      expect(detail.stops).toHaveLength(2);
      // Valid stops should have filtered out the invalid lat stop
      expect(detail.validStops).toHaveLength(1);
      expect(detail.validStops[0]?.name).toBe('Rajwada Historical Gate');
      expect(detail.validPathCoordinates).toHaveLength(2);
      expect(detail.validPathCoordinates[0]).toEqual({ latitude: 22.7186, longitude: 75.855 });
    });

    it('handles route with zero stops gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bus_routes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: mockRoute, error: null }),
              }),
            }),
          };
        }
        if (table === 'bus_stops') {
          return {
            select: () => ({
              eq: () => ({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === 'bus_route_paths') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const detail = await busApi.fetchBusRouteDetail('b1111111-0001-4000-a000-000000000001');
      expect(detail.stops).toEqual([]);
      expect(detail.validStops).toEqual([]);
      expect(detail.path).toBeNull();
      expect(detail.validPathCoordinates).toEqual([]);
    });

    it('throws AppError when route does not exist', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bus_routes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(busApi.fetchBusRouteDetail('non-existent-id')).rejects.toThrow(
        'The requested bus route could not be found.'
      );
    });
  });
});
