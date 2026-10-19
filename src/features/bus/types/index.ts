import { z } from 'zod';

import { Database } from '@/shared/types/database';

export type BusRouteRow = Database['public']['Tables']['bus_routes']['Row'];
export type BusStopRow = Database['public']['Tables']['bus_stops']['Row'];
export type BusRoutePathRow = Database['public']['Tables']['bus_route_paths']['Row'];

/**
 * Coordinate structure for map rendering
 */
export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Zod schema for bus_routes table rows
 */
export const busRouteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Route name is required'),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  origin_city: z.string().nullable().optional(),
  departs_at: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  created_at: z.string().optional(),
});

export type BusRoute = z.infer<typeof busRouteSchema>;

/**
 * Zod schema for bus_stops table rows
 */
export const busStopSchema = z.object({
  id: z.string().uuid(),
  route_id: z.string().uuid(),
  name: z.string().min(1, 'Stop name is required'),
  latitude: z.number(),
  longitude: z.number(),
  stop_order: z.number().int(),
  scheduled_time: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type BusStop = z.infer<typeof busStopSchema>;

/**
 * Raw point from bus_route_paths points array (JSONB stores { lat, lng } or { latitude, longitude })
 */
export const rawPointSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .passthrough();

export type RawPoint = z.infer<typeof rawPointSchema>;

/**
 * Zod schema for bus_route_paths table rows
 */
export const busRoutePathSchema = z.object({
  id: z.string().uuid(),
  route_id: z.string().uuid(),
  points: z.array(rawPointSchema).or(z.array(z.record(z.string(), z.unknown()))),
  created_at: z.string().optional(),
});

export type BusRoutePath = z.infer<typeof busRoutePathSchema>;

/**
 * Consolidated Bus Route Detail representation
 */
export interface BusRouteDetail {
  route: BusRoute;
  stops: BusStop[];
  path: BusRoutePath | null;
  validStops: BusStop[];
  validPathCoordinates: MapCoordinate[];
}
