/**
 * Centralized Date & Time Utility for Prayatna Companion.
 * All user-facing times must be shown in 'Asia/Kolkata' (IST).
 */

import { format, isValid, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const APP_TIMEZONE = 'Asia/Kolkata' as const;

export const DATE_FORMATS = {
  TIME: 'hh:mm a',
  DATE_SHORT: 'dd MMM yyyy',
  DATE_LONG: 'MMMM dd, yyyy',
  DATETIME_SHORT: 'dd MMM, hh:mm a',
  DATETIME_FULL: 'dd MMM yyyy, hh:mm a',
} as const;

function coerceToDate(input: Date | string | number): Date | null {
  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }

  if (typeof input === 'string') {
    const parsed = parseISO(input);
    if (isValid(parsed)) {
      return parsed;
    }
    const directDate = new Date(input);
    return isValid(directDate) ? directDate : null;
  }

  if (typeof input === 'number') {
    const fromTimestamp = new Date(input);
    return isValid(fromTimestamp) ? fromTimestamp : null;
  }

  return null;
}

/**
 * Converts any UTC or local date into Asia/Kolkata zoned time and formats it.
 */
export function formatInIST(
  dateInput: Date | string | number,
  formatPattern: string = DATE_FORMATS.DATETIME_SHORT
): string {
  const date = coerceToDate(dateInput);
  if (!date) {
    return 'Invalid Date';
  }

  try {
    const zonedTime = toZonedTime(date, APP_TIMEZONE);
    return format(zonedTime, formatPattern);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats time in IST (e.g., "11:30 AM IST")
 */
export function formatTimeIST(dateInput: Date | string | number, includeSuffix = true): string {
  const formatted = formatInIST(dateInput, DATE_FORMATS.TIME);
  if (formatted === 'Invalid Date') {
    return formatted;
  }
  return includeSuffix ? `${formatted} IST` : formatted;
}

/**
 * Formats date in IST (e.g., "17 Oct 2026")
 */
export function formatDateIST(dateInput: Date | string | number): string {
  return formatInIST(dateInput, DATE_FORMATS.DATE_SHORT);
}

/**
 * Formats full datetime in IST (e.g., "17 Oct 2026, 11:30 AM IST")
 */
export function formatDateTimeIST(dateInput: Date | string | number): string {
  const formatted = formatInIST(dateInput, DATE_FORMATS.DATETIME_FULL);
  if (formatted === 'Invalid Date') {
    return formatted;
  }
  return `${formatted} IST`;
}
