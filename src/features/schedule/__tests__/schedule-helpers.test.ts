import { ScheduleEvent } from '../types';
import {
  EVENT_TYPE_CONFIG,
  filterEventsByDay,
  formatEventTimeRange,
  isEventActive,
  isMidnightCrossing,
} from '../utils/schedule-helpers';

describe('Schedule Helpers & Core Logic', () => {
  const baseEvent: ScheduleEvent = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    title: 'Opening Keynote',
    description: 'Welcome and guidelines',
    location: 'Auditorium A',
    event_type: 'ceremony',
    starts_at: '2026-10-18T04:00:00.000Z', // 09:30 AM IST
    ends_at: '2026-10-18T05:00:00.000Z', // 10:30 AM IST
    created_at: '2026-10-17T00:00:00.000Z',
  };

  const midnightCrossingEvent: ScheduleEvent = {
    id: 'a81d4fae-7dec-11d0-a765-00a0c91e6bf7',
    title: 'Overnight Hack Jam',
    description: 'Continuous development and midnight snacks',
    location: 'Main Arena',
    event_type: 'jamming',
    // 23:00 IST Oct 18 (17:30 UTC) to 02:30 IST Oct 19 (21:00 UTC Oct 18)
    starts_at: '2026-10-18T17:30:00.000Z',
    ends_at: '2026-10-18T21:00:00.000Z',
    created_at: '2026-10-17T00:00:00.000Z',
  };

  const day2Event: ScheduleEvent = {
    id: 'b81d4fae-7dec-11d0-a765-00a0c91e6bf8',
    title: 'Final Judging Round',
    description: 'Presentations to judges',
    location: 'Lab 3',
    event_type: 'judging',
    starts_at: '2026-10-19T05:30:00.000Z', // 11:00 AM IST Oct 19
    ends_at: '2026-10-19T07:30:00.000Z', // 13:00 PM IST Oct 19
    created_at: '2026-10-17T00:00:00.000Z',
  };

  const allEvents: ScheduleEvent[] = [baseEvent, midnightCrossingEvent, day2Event];

  describe('Empty Day Edge Case', () => {
    it('returns an empty array when filtering for a day with no scheduled events', () => {
      // 2026-10-20 has no events
      const result = filterEventsByDay(allEvents, '2026-10-20');
      expect(result).toEqual([]);
    });

    it('returns empty array when source events list is empty', () => {
      const result = filterEventsByDay([], '2026-10-18');
      expect(result).toEqual([]);
    });

    it('returns all events when filter is set to "all"', () => {
      const result = filterEventsByDay(allEvents, 'all');
      expect(result).toHaveLength(3);
    });
  });

  describe('Midnight-Crossing Event Edge Case', () => {
    it('detects when an event crosses midnight in IST', () => {
      expect(isMidnightCrossing(midnightCrossingEvent)).toBe(true);
      expect(isMidnightCrossing(baseEvent)).toBe(false);
      expect(isMidnightCrossing(day2Event)).toBe(false);
    });

    it('includes midnight-crossing event on Day 1 (starting day)', () => {
      const day1Events = filterEventsByDay(allEvents, '2026-10-18');
      const eventIds = day1Events.map((e) => e.id);

      expect(eventIds).toContain(midnightCrossingEvent.id);
      expect(eventIds).toContain(baseEvent.id);
      expect(eventIds).not.toContain(day2Event.id);
    });

    it('includes midnight-crossing event on Day 2 (finishing day)', () => {
      const day2Events = filterEventsByDay(allEvents, '2026-10-19');
      const eventIds = day2Events.map((e) => e.id);

      expect(eventIds).toContain(midnightCrossingEvent.id);
      expect(eventIds).toContain(day2Event.id);
      expect(eventIds).not.toContain(baseEvent.id);
    });

    it('appends overnight (+1 Day) indicator to the formatted time range', () => {
      const formatted = formatEventTimeRange(
        midnightCrossingEvent.starts_at,
        midnightCrossingEvent.ends_at
      );
      expect(formatted).toBe('11:00 PM – 02:30 AM (+1 Day)');
    });

    it('remains active when authoritative time is post-midnight IST during the event', () => {
      // 01:15 AM IST Oct 19 is 19:45 UTC Oct 18
      const postMidnightIST = new Date('2026-10-18T19:45:00.000Z');
      expect(isEventActive(midnightCrossingEvent, postMidnightIST)).toBe(true);
    });
  });

  describe('Current Event Changes While Open Edge Case', () => {
    const eventA: ScheduleEvent = {
      ...baseEvent,
      id: 'ev-a',
      title: 'Morning Keynote',
      starts_at: '2026-10-18T04:30:00.000Z', // 10:00 AM IST
      ends_at: '2026-10-18T05:30:00.000Z', // 11:00 AM IST
    };

    const eventB: ScheduleEvent = {
      ...baseEvent,
      id: 'ev-b',
      title: 'Workshop',
      event_type: 'workshop',
      starts_at: '2026-10-18T05:30:00.000Z', // 11:00 AM IST
      ends_at: '2026-10-18T06:30:00.000Z', // 12:00 PM IST
    };

    it('accurately transitions current event status as time advances while screen is open', () => {
      // At t1 (10:30 AM IST = 05:00 UTC): Event A is current, Event B is upcoming
      const t1 = new Date('2026-10-18T05:00:00.000Z');
      expect(isEventActive(eventA, t1)).toBe(true);
      expect(isEventActive(eventB, t1)).toBe(false);

      // At t2 (11:15 AM IST = 05:45 UTC): Event A is finished, Event B is current
      const t2 = new Date('2026-10-18T05:45:00.000Z');
      expect(isEventActive(eventA, t2)).toBe(false);
      expect(isEventActive(eventB, t2)).toBe(true);

      // At t3 (12:30 PM IST = 07:00 UTC): Both events are finished
      const t3 = new Date('2026-10-18T07:00:00.000Z');
      expect(isEventActive(eventA, t3)).toBe(false);
      expect(isEventActive(eventB, t3)).toBe(false);
    });

    it('handles overlapping events concurrently active at the same time', () => {
      const overlappingWorkshop: ScheduleEvent = {
        ...baseEvent,
        id: 'ev-overlap',
        title: 'Concurrent Mini-Workshop',
        starts_at: '2026-10-18T04:45:00.000Z', // 10:15 AM IST
        ends_at: '2026-10-18T05:15:00.000Z', // 10:45 AM IST
      };

      // Reference time: 10:30 AM IST (05:00 UTC)
      const now = new Date('2026-10-18T05:00:00.000Z');

      // Both eventA and overlappingWorkshop are active at 10:30 AM
      expect(isEventActive(eventA, now)).toBe(true);
      expect(isEventActive(overlappingWorkshop, now)).toBe(true);
    });
  });

  describe('EVENT_TYPE_CONFIG', () => {
    it('provides valid configurations for all supported event types', () => {
      const types = [
        'ceremony',
        'session',
        'workshop',
        'jamming',
        'judging',
        'meal',
        'other',
      ] as const;

      for (const type of types) {
        const config = EVENT_TYPE_CONFIG[type];
        expect(config).toBeDefined();
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.badgeVariant).toBeDefined();
        expect(config.accentColor.startsWith('#')).toBe(true);
      }
    });
  });
});
