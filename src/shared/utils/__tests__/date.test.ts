import {
  APP_TIMEZONE,
  DATE_FORMATS,
  formatDateIST,
  formatDateTimeIST,
  formatInIST,
  formatTimeIST,
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
});
