import {
  APP_TIMEZONE,
  DATE_FORMATS,
  formatCountdown,
  formatDateIST,
  formatDateTimeIST,
  formatInIST,
  formatTimeIST,
  getCountdownParts,
  getNowAndNextEvents,
  groupEventsByDay,
} from '../date';

describe('Date Utilities (Asia/Kolkata)', () => {
  it('enforces Asia/Kolkata timezone and standard formats', () => {
    expect(APP_TIMEZONE).toBe('Asia/Kolkata');
    expect(DATE_FORMATS.TIME).toBe('hh:mm a');
  });

  describe('Midnight Rollover Edge Case', () => {
    it('correctly rolls over day at midnight IST when UTC is previous calendar date', () => {
      // 18:30 UTC on Oct 17 is exactly 00:00 (midnight) Oct 18 in IST (UTC + 5:30)
      const utcString = '2026-10-17T18:30:00.000Z';
      const formattedDate = formatDateIST(utcString);
      const formattedTime = formatTimeIST(utcString);

      expect(formattedDate).toBe('18 Oct 2026');
      expect(formattedTime).toBe('12:00 AM IST');
    });

    it('correctly preserves previous day one minute before midnight IST', () => {
      // 18:29 UTC on Oct 17 is 23:59 on Oct 17 in IST
      const utcString = '2026-10-17T18:29:00.000Z';
      const formattedDate = formatDateIST(utcString);
      const formattedTime = formatTimeIST(utcString);

      expect(formattedDate).toBe('17 Oct 2026');
      expect(formattedTime).toBe('11:59 PM IST');
    });
  });

  describe('IST vs Device Timezone Handling', () => {
    it('formats consistently in IST regardless of machine local environment', () => {
      // 06:00 UTC is always 11:30 AM IST
      const utcIso = '2026-10-18T06:00:00.000Z';
      const result = formatTimeIST(utcIso);
      expect(result).toBe('11:30 AM IST');
    });

    it('formats full datetime accurately in IST', () => {
      const utcIso = '2026-10-18T06:00:00.000Z';
      const result = formatDateTimeIST(utcIso);
      expect(result).toBe('18 Oct 2026, 11:30 AM IST');
    });
  });

  describe('Invalid and Edge Case Inputs', () => {
    it('returns "Invalid Date" gracefully for malformed strings and invalid dates', () => {
      expect(formatInIST('not-a-date')).toBe('Invalid Date');
      expect(formatTimeIST('invalid')).toBe('Invalid Date');
      expect(formatDateIST('')).toBe('Invalid Date');
      expect(formatDateTimeIST('invalid')).toBe('Invalid Date');
      expect(formatInIST(new Date('invalid-date-string'))).toBe('Invalid Date');
      expect(formatInIST(NaN)).toBe('Invalid Date');
      expect(formatInIST(null as unknown as string)).toBe('Invalid Date');
      expect(formatInIST(new Date(), "''''invalid")).toBe('Invalid Date');
    });

    it('formats time with or without IST suffix', () => {
      const utcIso = '2026-10-18T06:00:00.000Z';
      expect(formatTimeIST(utcIso, true)).toBe('11:30 AM IST');
      expect(formatTimeIST(utcIso, false)).toBe('11:30 AM');
    });

    it('handles numeric epoch timestamps correctly', () => {
      // Epoch 0 is 1970-01-01 00:00:00 UTC -> 05:30 AM IST
      const epochZero = 0;
      expect(formatTimeIST(epochZero)).toBe('05:30 AM IST');
      expect(formatDateIST(epochZero)).toBe('01 Jan 1970');
    });
  });

  describe('groupEventsByDay', () => {
    interface TestEvent {
      id: string;
      title: string;
      startsAt: string;
    }

    const sampleEvents: TestEvent[] = [
      { id: '1', title: 'Day 1 Morning', startsAt: '2026-10-18T04:00:00.000Z' }, // 09:30 AM IST
      { id: '2', title: 'Day 1 Night (Pre-Midnight)', startsAt: '2026-10-18T18:15:00.000Z' }, // 23:45 IST Oct 18
      { id: '3', title: 'Day 2 Early (Post-Midnight)', startsAt: '2026-10-18T18:45:00.000Z' }, // 00:15 IST Oct 19
      { id: '4', title: 'Day 2 Afternoon', startsAt: '2026-10-19T08:30:00.000Z' }, // 14:00 IST Oct 19
      { id: '5', title: 'Invalid Event', startsAt: 'invalid-date' },
    ];

    it('groups events chronologically into IST calendar days', () => {
      const groups = groupEventsByDay(sampleEvents, (e) => e.startsAt);

      expect(groups).toHaveLength(2);

      // Group 1: 18 Oct 2026
      expect(groups[0]?.dateKey).toBe('2026-10-18');
      expect(groups[0]?.dayLabel).toBe('Day 1');
      expect(groups[0]?.items).toHaveLength(2);
      expect(groups[0]?.items.map((i) => i.id)).toEqual(['1', '2']);

      // Group 2: 19 Oct 2026 (including post-midnight event 3)
      expect(groups[1]?.dateKey).toBe('2026-10-19');
      expect(groups[1]?.dayLabel).toBe('Day 2');
      expect(groups[1]?.items).toHaveLength(2);
      expect(groups[1]?.items.map((i) => i.id)).toEqual(['3', '4']);
    });

    it('labels pre-event days when hackathonStartDate is specified', () => {
      const preEvent: TestEvent = {
        id: 'pre',
        title: 'Orientation',
        startsAt: '2026-10-17T10:00:00.000Z', // 17 Oct 2026
      };
      const events = [preEvent, ...sampleEvents];
      const groups = groupEventsByDay(events, (e) => e.startsAt, '2026-10-18T00:00:00.000Z');

      expect(groups[0]?.dateKey).toBe('2026-10-17');
      expect(groups[0]?.dayLabel).toBe('Pre-Event');
    });

    it('returns empty array when events list is empty', () => {
      const groups = groupEventsByDay([], (e: TestEvent) => e.startsAt);
      expect(groups).toEqual([]);
    });
  });

  describe('getNowAndNextEvents', () => {
    interface WindowEvent {
      id: string;
      name: string;
      startsAt: string;
      endsAt: string;
    }

    const schedule: WindowEvent[] = [
      {
        id: 'ev-past',
        name: 'Opening Ceremony',
        startsAt: '2026-10-18T03:30:00.000Z', // 09:00 IST
        endsAt: '2026-10-18T04:30:00.000Z', // 10:00 IST
      },
      {
        id: 'ev-current',
        name: 'Hacking Begins',
        startsAt: '2026-10-18T04:30:00.000Z', // 10:00 IST
        endsAt: '2026-10-18T08:30:00.000Z', // 14:00 IST
      },
      {
        id: 'ev-next',
        name: 'Lunch Break',
        startsAt: '2026-10-18T08:30:00.000Z', // 14:00 IST
        endsAt: '2026-10-18T09:30:00.000Z', // 15:00 IST
      },
      {
        id: 'ev-later',
        name: 'Mentorship Round',
        startsAt: '2026-10-18T10:00:00.000Z', // 15:30 IST
        endsAt: '2026-10-18T12:00:00.000Z', // 17:30 IST
      },
    ];

    it('identifies current active event and next upcoming event', () => {
      // Reference time: 11:30 IST (06:00 UTC) - during 'Hacking Begins'
      const now = '2026-10-18T06:00:00.000Z';
      const result = getNowAndNextEvents(schedule, now, (e) => ({
        startsAt: e.startsAt,
        endsAt: e.endsAt,
      }));

      expect(result.currentEvent?.id).toBe('ev-current');
      expect(result.nextEvent?.id).toBe('ev-next');
    });

    it('returns null for currentEvent when between events', () => {
      // 15:15 IST (09:45 UTC) - between Lunch Break and Mentorship Round
      const now = '2026-10-18T09:45:00.000Z';
      const result = getNowAndNextEvents(schedule, now, (e) => ({
        startsAt: e.startsAt,
        endsAt: e.endsAt,
      }));

      expect(result.currentEvent).toBeNull();
      expect(result.nextEvent?.id).toBe('ev-later');
    });

    it('picks the event that ends earliest when multiple are active concurrently', () => {
      const concurrent: WindowEvent[] = [
        {
          id: 'long-hack',
          name: 'Hackathon',
          startsAt: '2026-10-18T04:00:00.000Z',
          endsAt: '2026-10-18T20:00:00.000Z',
        },
        {
          id: 'short-session',
          name: 'AMA Session',
          startsAt: '2026-10-18T05:00:00.000Z',
          endsAt: '2026-10-18T06:00:00.000Z',
        },
      ];

      // Time: 05:30 UTC
      const now = '2026-10-18T05:30:00.000Z';
      const result = getNowAndNextEvents(concurrent, now, (e) => ({
        startsAt: e.startsAt,
        endsAt: e.endsAt,
      }));

      expect(result.currentEvent?.id).toBe('short-session');
    });

    it('handles invalid reference date gracefully', () => {
      const result = getNowAndNextEvents(schedule, 'not-a-date', (e) => ({
        startsAt: e.startsAt,
        endsAt: e.endsAt,
      }));

      expect(result.currentEvent).toBeNull();
      expect(result.nextEvent).toBeNull();
    });
  });

  describe('Countdown utilities', () => {
    it('decomposes remaining time with days, hours, minutes, and seconds', () => {
      const now = new Date('2026-10-18T10:00:00.000Z');
      // Target: 2 days, 3 hours, 15 minutes, 30 seconds ahead
      const target = new Date(now.getTime() + (2 * 86400 + 3 * 3600 + 15 * 60 + 30) * 1000);

      const parts = getCountdownParts(target, now);
      expect(parts.days).toBe(2);
      expect(parts.hours).toBe(3);
      expect(parts.minutes).toBe(15);
      expect(parts.seconds).toBe(30);
      expect(parts.isFinished).toBe(false);
      expect(parts.formatted).toBe('2d 03h 15m 30s');
    });

    it('formats countdown under 24 hours in hh:mm:ss format', () => {
      const now = new Date('2026-10-18T10:00:00.000Z');
      // Target: 4 hours, 5 minutes, 9 seconds ahead
      const target = new Date(now.getTime() + (4 * 3600 + 5 * 60 + 9) * 1000);

      const formatted = formatCountdown(target, now);
      expect(formatted).toBe('04:05:09');
    });

    it('returns 00:00:00 and isFinished: true when target is in the past', () => {
      const now = new Date('2026-10-18T10:00:00.000Z');
      const past = new Date(now.getTime() - 5000);

      const parts = getCountdownParts(past, now);
      expect(parts.isFinished).toBe(true);
      expect(parts.formatted).toBe('00:00:00');
    });

    it('handles invalid dates for countdown', () => {
      const parts = getCountdownParts('invalid-date', 'another-invalid');
      expect(parts.isFinished).toBe(true);
      expect(parts.formatted).toBe('00:00:00');
    });
  });
});
