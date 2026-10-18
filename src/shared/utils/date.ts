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
  DATE_KEY: 'yyyy-MM-dd',
  DATETIME_SHORT: 'dd MMM, hh:mm a',
  DATETIME_FULL: 'dd MMM yyyy, hh:mm a',
} as const;

export function coerceToDate(input: Date | string | number): Date | null {
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

/**
 * Returns YYYY-MM-DD date key in Asia/Kolkata for day grouping
 */
export function getISTDateKey(dateInput: Date | string | number): string {
  return formatInIST(dateInput, DATE_FORMATS.DATE_KEY);
}

export interface DayGroup<T> {
  dateKey: string;
  dayLabel: string;
  displayDate: string;
  items: T[];
}

/**
 * Groups a collection of events into chronological days in Asia/Kolkata
 */
export function groupEventsByDay<T>(
  events: readonly T[],
  getDate: (item: T) => Date | string | number,
  hackathonStartDate?: Date | string | number
): DayGroup<T>[] {
  const groupsMap = new Map<string, { displayDate: string; items: T[] }>();

  // Determine hackathon start date key if provided
  const baseStartKey = hackathonStartDate ? getISTDateKey(hackathonStartDate) : null;

  for (const item of events) {
    const rawDate = getDate(item);
    const dateKey = getISTDateKey(rawDate);
    if (dateKey === 'Invalid Date') continue;

    let group = groupsMap.get(dateKey);
    if (!group) {
      group = {
        displayDate: formatInIST(rawDate, DATE_FORMATS.DATE_LONG),
        items: [],
      };
      groupsMap.set(dateKey, group);
    }
    group.items.push(item);
  }

  // Sort groups chronologically
  const sortedKeys = Array.from(groupsMap.keys()).sort();

  return sortedKeys.map((key, index) => {
    const group = groupsMap.get(key)!;
    let dayLabel = `Day ${index + 1}`;

    if (baseStartKey && key < baseStartKey) {
      dayLabel = 'Pre-Event';
    }

    return {
      dateKey: key,
      dayLabel,
      displayDate: group.displayDate,
      items: group.items,
    };
  });
}

export interface NowAndNext<T> {
  currentEvent: T | null;
  nextEvent: T | null;
}

/**
 * Identifies currently active event (startsAt <= now < endsAt)
 * and next upcoming event (startsAt > now).
 */
export function getNowAndNextEvents<T>(
  events: readonly T[],
  nowInput: Date | string | number = new Date(),
  getWindow: (item: T) => { startsAt: Date | string | number; endsAt: Date | string | number }
): NowAndNext<T> {
  const nowDate = coerceToDate(nowInput);
  if (!nowDate) {
    return { currentEvent: null, nextEvent: null };
  }
  const nowMs = nowDate.getTime();

  let currentEvent: T | null = null;
  let nextEvent: T | null = null;
  let earliestUpcomingStart = Infinity;

  for (const item of events) {
    const { startsAt, endsAt } = getWindow(item);
    const startDate = coerceToDate(startsAt);
    const endDate = coerceToDate(endsAt);

    if (!startDate || !endDate) continue;

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // Check if event is currently active
    if (startMs <= nowMs && nowMs < endMs) {
      // If multiple, pick the one that ends earliest
      if (!currentEvent) {
        currentEvent = item;
      } else {
        const currentEnd = coerceToDate(getWindow(currentEvent).endsAt)?.getTime() ?? Infinity;
        if (endMs < currentEnd) {
          currentEvent = item;
        }
      }
    } else if (startMs > nowMs) {
      // Upcoming event
      if (startMs < earliestUpcomingStart) {
        earliestUpcomingStart = startMs;
        nextEvent = item;
      }
    }
  }

  return { currentEvent, nextEvent };
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
  formatted: string;
}

/**
 * Decomposes time remaining between reference and target date.
 */
export function getCountdownParts(
  targetInput: Date | string | number,
  referenceInput: Date | string | number = new Date()
): CountdownParts {
  const targetDate = coerceToDate(targetInput);
  const refDate = coerceToDate(referenceInput);

  if (!targetDate || !refDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: true,
      formatted: '00:00:00',
    };
  }

  const diffMs = targetDate.getTime() - refDate.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: true,
      formatted: '00:00:00',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  let formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (days > 0) {
    formatted = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isFinished: false,
    formatted,
  };
}

/**
 * Returns formatted countdown string (e.g. "04:12:30" or "2d 06h 15m 00s")
 */
export function formatCountdown(
  targetInput: Date | string | number,
  referenceInput: Date | string | number = new Date()
): string {
  return getCountdownParts(targetInput, referenceInput).formatted;
}
