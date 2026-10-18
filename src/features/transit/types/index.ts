import { z } from 'zod';

export const busRouteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Route name is required'),
  description: z.string().nullable(),
  color: z.string().nullable(),
  origin_city: z.string().nullable(),
  departs_at: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.string(),
});

export const busStopSchema = z.object({
  id: z.string().uuid(),
  route_id: z.string().uuid(),
  name: z.string().min(1, 'Stop name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  stop_order: z.number().int(),
  scheduled_time: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

export const busRoutePointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const busRoutePathSchema = z.object({
  id: z.string().uuid(),
  route_id: z.string().uuid(),
  points: z.array(busRoutePointSchema),
  created_at: z.string(),
});

export type BusRoute = z.infer<typeof busRouteSchema>;
export type BusStop = z.infer<typeof busStopSchema>;
export type BusRoutePoint = z.infer<typeof busRoutePointSchema>;
export type BusRoutePath = z.infer<typeof busRoutePathSchema>;
