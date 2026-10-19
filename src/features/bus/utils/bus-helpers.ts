import { Linking } from 'react-native';

import { logger } from '@/shared/lib/logger';
import { DATE_FORMATS, formatInIST } from '@/shared/utils/date';

import { BusStop, MapCoordinate, RawPoint } from '../types';

/**
 * Validates latitude and longitude bounds:
 * Latitude: [-90, 90]
 * Longitude: [-180, 180]
 */
export function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return false;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Filters bus stops ensuring only valid coordinates are supplied to MapView.
 * Logs warnings for any dropped invalid coordinates.
 */
export function filterValidStops(stops: BusStop[]): BusStop[] {
  const validStops: BusStop[] = [];

  for (const stop of stops) {
    if (isValidCoordinate(stop.latitude, stop.longitude)) {
      validStops.push(stop);
    } else {
      logger.warn('Invalid coordinate detected for bus stop', {
        stopId: stop.id,
        stopName: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
      });
    }
  }

  return validStops;
}

/**
 * Extracts and filters valid polyline coordinates from raw JSON points.
 * Accommodates { lat, lng } or { latitude, longitude }.
 */
export function filterValidPathCoordinates(
  rawPoints: unknown[] | null | undefined
): MapCoordinate[] {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  const validCoordinates: MapCoordinate[] = [];

  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i] as RawPoint | null | undefined;
    if (!pt || typeof pt !== 'object') {
      logger.warn('Invalid polyline point format', { index: i, point: pt });
      continue;
    }

    const lat = typeof pt.lat === 'number' ? pt.lat : pt.latitude;
    const lng = typeof pt.lng === 'number' ? pt.lng : pt.longitude;

    if (isValidCoordinate(lat, lng)) {
      validCoordinates.push({
        latitude: lat as number,
        longitude: lng as number,
      });
    } else {
      logger.warn('Invalid coordinate detected in bus route path', {
        index: i,
        latitude: lat,
        longitude: lng,
      });
    }
  }

  return validCoordinates;
}

/**
 * Builds standard Google Maps Universal URL for navigation / location viewing
 */
export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Opens a bus stop in Google Maps via standard Linking API
 */
export async function openInGoogleMaps(latitude: number, longitude: number): Promise<boolean> {
  const url = buildGoogleMapsUrl(latitude, longitude);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      logger.warn('Device cannot open Google Maps URL', { url });
      return false;
    }
  } catch (error: unknown) {
    logger.warn('Failed to open Google Maps URL', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Formats departure time for route display
 */
export function formatBusDepartureTime(departsAt: string | null | undefined): string {
  if (!departsAt) {
    return 'Departure time TBA';
  }

  const formattedTime = formatInIST(departsAt, DATE_FORMATS.TIME);
  if (formattedTime === 'Invalid Date') {
    return 'Departure time TBA';
  }

  return `Departs at ${formattedTime}`;
}

/**
 * Formats scheduled arrival time for bus stops
 */
export function formatStopScheduledTime(scheduledTime: string | null | undefined): string {
  if (!scheduledTime) {
    return 'Time TBA';
  }

  const formattedTime = formatInIST(scheduledTime, DATE_FORMATS.TIME);
  if (formattedTime === 'Invalid Date') {
    return 'Time TBA';
  }

  return formattedTime;
}
