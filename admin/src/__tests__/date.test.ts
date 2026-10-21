import { formatInIST, toISTInputValue, fromISTInputValue } from '@/lib/date';

describe('Admin Date & IST Timezone Helpers', () => {
  it('formats UTC ISO string into Indian Standard Time (IST)', () => {
    // 2026-10-24T04:30:00.000Z in UTC is 10:00 AM IST (UTC + 05:30)
    const formatted = formatInIST('2026-10-24T04:30:00.000Z', 'yyyy-MM-dd HH:mm');
    expect(formatted).toBe('2026-10-24 10:00 IST');
  });

  it('converts UTC ISO string to IST datetime-local input string', () => {
    // 2026-10-24T04:30:00.000Z -> '2026-10-24T10:00'
    const inputValue = toISTInputValue('2026-10-24T04:30:00.000Z');
    expect(inputValue).toBe('2026-10-24T10:00');
  });

  it('converts IST input string back to authoritative UTC ISO string', () => {
    // '2026-10-24T10:00' entered in IST -> '2026-10-24T04:30:00.000Z' in UTC
    const utcIso = fromISTInputValue('2026-10-24T10:00');
    expect(utcIso).toBe('2026-10-24T04:30:00.000Z');
  });

  it('handles empty or invalid inputs gracefully', () => {
    expect(formatInIST(null)).toBe('—');
    expect(formatInIST(undefined)).toBe('—');
    expect(formatInIST('not-a-date')).toBe('Invalid date');

    expect(toISTInputValue(null)).toBe('');
    expect(fromISTInputValue('')).toBe('');
  });
});
