import { AppError, mapToAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import {
  BusRoute,
  BusRouteDetail,
  busRoutePathSchema,
  busRouteSchema,
  busStopSchema,
} from '../types';
import { filterValidPathCoordinates, filterValidStops } from '../utils/bus-helpers';

export const busApi = {
  /**
   * Fetches all registered bus routes ordered by sort_order
   */
  async fetchBusRoutes(): Promise<BusRoute[]> {
    try {
      const { data, error } = await supabase
        .from('bus_routes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return [];
      }

      return data.map((item) => busRouteSchema.parse(item));
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },

  /**
   * Fetches a specific bus route with its sequence of stops and polyline path
   */
  async fetchBusRouteDetail(routeId: string): Promise<BusRouteDetail> {
    try {
      // 1. Fetch Route metadata
      const { data: routeData, error: routeError } = await supabase
        .from('bus_routes')
        .select('*')
        .eq('id', routeId)
        .maybeSingle();

      if (routeError) {
        throw mapToAppError(routeError);
      }

      if (!routeData) {
        throw new AppError({
          code: 'RESOURCE_NOT_FOUND',
          userMessage: 'The requested bus route could not be found.',
          retryable: false,
        });
      }

      const route = busRouteSchema.parse(routeData);

      // 2. Fetch Route Stops in chronological / sequence order
      const { data: stopsData, error: stopsError } = await supabase
        .from('bus_stops')
        .select('*')
        .eq('route_id', routeId)
        .order('stop_order', { ascending: true });

      if (stopsError) {
        throw mapToAppError(stopsError);
      }

      const stops = (stopsData ?? []).map((stop) => busStopSchema.parse(stop));

      // 3. Fetch Route Polyline Path
      const { data: pathData, error: pathError } = await supabase
        .from('bus_route_paths')
        .select('*')
        .eq('route_id', routeId)
        .maybeSingle();

      if (pathError) {
        throw mapToAppError(pathError);
      }

      const path = pathData ? busRoutePathSchema.parse(pathData) : null;

      // 4. Validate and filter coordinates (filter invalid + log warnings)
      const validStops = filterValidStops(stops);
      const validPathCoordinates = filterValidPathCoordinates(path?.points);

      return {
        route,
        stops,
        path,
        validStops,
        validPathCoordinates,
      };
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },
};
