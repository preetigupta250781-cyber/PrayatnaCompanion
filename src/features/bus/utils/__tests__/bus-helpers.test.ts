import { Linking } from 'react-native';

import { logger } from '@/shared/lib/logger';

import { BusStop } from '../../types';
import {
  buildGoogleMapsUrl,
  filterValidPathCoordinates,
  filterValidStops,
  formatBusDepartureTime,
  formatStopScheduledTime,
  isValidCoordinate,
  openInGoogleMaps,
} from '../bus-helpers';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('bus-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidCoordinate', () => {
    it('returns true for valid geographic coordinates', () => {
      expect(isValidCoordinate(22.7196, 75.8577)).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    it('returns false for latitude outside [-90, 90]', () => {
      expect(isValidCoordinate(90.1, 75.85)).toBe(false);
      expect(isValidCoordinate(-90.1, 75.85)).toBe(false);
      expect(isValidCoordinate(120, 75.85)).toBe(false);
    });

    it('returns false for longitude outside [-180, 180]', () => {
      expect(isValidCoordinate(22.71, 180.1)).toBe(false);
      expect(isValidCoordinate(22.71, -180.1)).toBe(false);
      expect(isValidCoordinate(22.71, 250)).toBe(false);
    });

    it('returns false for non-numeric or non-finite coordinates', () => {
      expect(isValidCoordinate(NaN, 75.85)).toBe(false);
      expect(isValidCoordinate(22.71, NaN)).toBe(false);
      expect(isValidCoordinate(Infinity, 75.85)).toBe(false);
      expect(isValidCoordinate('22.71', 75.85)).toBe(false);
      expect(isValidCoordinate(null, undefined)).toBe(false);
    });
  });

  describe('filterValidStops', () => {
    it('handles zero stops gracefully', () => {
      const result = filterValidStops([]);
      expect(result).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('retains valid stops and filters out stops with invalid coordinates while logging a warning', () => {
      const stops: BusStop[] = [
        {
          id: '11111111-1111-4111-a111-111111111111',
          route_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
          name: 'Valid Stop 1',
          latitude: 22.7186,
          longitude: 75.855,
          stop_order: 1,
          scheduled_time: '2026-10-24T02:00:00.000Z',
          notes: 'Near gate',
        },
        {
          id: '22222222-2222-4222-a222-222222222222',
          route_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
          name: 'Corrupt Coordinate Stop',
          latitude: 195.5, // Invalid lat > 90
          longitude: 75.86,
          stop_order: 2,
          scheduled_time: '2026-10-24T02:15:00.000Z',
          notes: null,
        },
        {
          id: '33333333-3333-4333-a333-333333333333',
          route_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
          name: 'Valid Stop 2',
          latitude: 22.721,
          longitude: 75.87,
          stop_order: 3,
          scheduled_time: '2026-10-24T02:30:00.000Z',
          notes: null,
        },
      ];

      const filtered = filterValidStops(stops);
      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.id).toBe('11111111-1111-4111-a111-111111111111');
      expect(filtered[1]?.id).toBe('33333333-3333-4333-a333-333333333333');

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid coordinate detected for bus stop',
        expect.objectContaining({
          stopId: '22222222-2222-4222-a222-222222222222',
          stopName: 'Corrupt Coordinate Stop',
          latitude: 195.5,
        })
      );
    });
  });

  describe('filterValidPathCoordinates', () => {
    it('handles null, undefined, or empty path points array', () => {
      expect(filterValidPathCoordinates(null)).toEqual([]);
      expect(filterValidPathCoordinates(undefined)).toEqual([]);
      expect(filterValidPathCoordinates([])).toEqual([]);
    });

    it('extracts { latitude, longitude } from { lat, lng } and filters invalid points', () => {
      const rawPoints = [
        { lat: 22.718, lng: 75.855 },
        { lat: 999, lng: 75.856 }, // Invalid
        { lat: 22.72, lng: 75.86 },
        null,
      ];

      const validCoords = filterValidPathCoordinates(rawPoints);
      expect(validCoords).toHaveLength(2);
      expect(validCoords[0]).toEqual({ latitude: 22.718, longitude: 75.855 });
      expect(validCoords[1]).toEqual({ latitude: 22.72, longitude: 75.86 });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('supports alternative { latitude, longitude } property naming', () => {
      const rawPoints = [
        { latitude: 22.718, longitude: 75.855 },
        { latitude: 22.719, longitude: 75.858 },
      ];

      const validCoords = filterValidPathCoordinates(rawPoints);
      expect(validCoords).toHaveLength(2);
      expect(validCoords[0]).toEqual({ latitude: 22.718, longitude: 75.855 });
    });
  });

  describe('buildGoogleMapsUrl', () => {
    it('constructs universal Google Maps web search link', () => {
      const url = buildGoogleMapsUrl(22.7186, 75.855);
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=22.7186,75.855');
    });
  });

  describe('openInGoogleMaps', () => {
    it('opens URL when device supports it', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

      const result = await openInGoogleMaps(22.7186, 75.855);
      expect(result).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=22.7186,75.855'
      );
    });

    it('returns false and logs warning if URL is unsupported', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);

      const result = await openInGoogleMaps(22.7186, 75.855);
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Device cannot open Google Maps URL',
        expect.any(Object)
      );
    });

    it('catches and logs exceptions from Linking gracefully', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('Linking error'));

      const result = await openInGoogleMaps(22.7186, 75.855);
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to open Google Maps URL',
        expect.any(Object)
      );
    });
  });

  describe('formatBusDepartureTime', () => {
    it('returns "Departure time TBA" for null or undefined', () => {
      expect(formatBusDepartureTime(null)).toBe('Departure time TBA');
      expect(formatBusDepartureTime(undefined)).toBe('Departure time TBA');
      expect(formatBusDepartureTime('')).toBe('Departure time TBA');
    });

    it('formats departure time into IST', () => {
      // 2026-10-24T02:00:00.000Z is 07:30 AM in IST (UTC + 05:30)
      const formatted = formatBusDepartureTime('2026-10-24T02:00:00.000Z');
      expect(formatted).toBe('Departs at 07:30 AM');
    });
  });

  describe('formatStopScheduledTime', () => {
    it('returns "Time TBA" for null or invalid inputs', () => {
      expect(formatStopScheduledTime(null)).toBe('Time TBA');
      expect(formatStopScheduledTime('invalid-date')).toBe('Time TBA');
    });

    it('formats scheduled arrival time into IST', () => {
      const formatted = formatStopScheduledTime('2026-10-24T02:15:00.000Z');
      expect(formatted).toBe('07:45 AM');
    });
  });
});
