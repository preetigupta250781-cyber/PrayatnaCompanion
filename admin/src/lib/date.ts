import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats an ISO string or Date into IST representation with custom format string.
 */
export function formatInIST(
  date: string | Date | null | undefined,
  pattern = 'dd MMM yyyy, hh:mm a'
): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    return `${formatInTimeZone(d, IST_TIMEZONE, pattern)} IST`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Converts UTC ISO string to `YYYY-MM-DDTHH:mm` formatted in IST for <input type="datetime-local" />.
 */
export function toISTInputValue(date: string | Date | null | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(d.getTime())) return '';
    const zoned = toZonedTime(d, IST_TIMEZONE);
    return format(zoned, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

/**
 * Converts `YYYY-MM-DDTHH:mm` entered in IST into an authoritative UTC ISO string.
 * Example: "2026-10-24T10:00" in IST -> "2026-10-24T04:30:00.000Z"
 */
export function fromISTInputValue(istDateTimeString: string): string {
  if (!istDateTimeString) return '';
  // Append Indian Standard Time offset (+05:30) if not present
  const withOffset = istDateTimeString.includes('+')
    ? istDateTimeString
    : `${istDateTimeString}:00+05:30`;
  const parsed = new Date(withOffset);
  return parsed.toISOString();
}
