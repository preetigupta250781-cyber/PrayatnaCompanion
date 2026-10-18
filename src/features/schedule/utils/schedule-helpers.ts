import { BadgeVariant } from '@/shared/ui/badge';
import { formatTimeIST, getISTDateKey } from '@/shared/utils/date';

import { EventType, ScheduleEvent } from '../types';

export interface EventTypeConfig {
  label: string;
  badgeVariant: BadgeVariant;
  accentColor: string;
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  ceremony: {
    label: 'Ceremony',
    badgeVariant: 'accent',
    accentColor: '#8B5CF6',
  },
  session: {
    label: 'Session',
    badgeVariant: 'default',
    accentColor: '#38BDF8',
  },
  workshop: {
    label: 'Workshop',
    badgeVariant: 'warning',
    accentColor: '#FBBF24',
  },
  jamming: {
    label: 'Jamming',
    badgeVariant: 'success',
    accentColor: '#34D399',
  },
  judging: {
    label: 'Judging',
    badgeVariant: 'error',
    accentColor: '#F87171',
  },
  meal: {
    label: 'Meal',
    badgeVariant: 'outline',
    accentColor: '#FB923C',
  },
  other: {
    label: 'General',
    badgeVariant: 'muted',
    accentColor: '#94A3B8',
  },
};

/**
 * Checks whether an event is active at the provided authoritative timestamp
 */
export function isEventActive(event: ScheduleEvent, now: Date): boolean {
  const startMs = new Date(event.starts_at).getTime();
  const endMs = new Date(event.ends_at).getTime();
  const nowMs = now.getTime();
  return startMs <= nowMs && nowMs < endMs;
}

/**
 * Checks if an event crosses midnight in IST
 */
export function isMidnightCrossing(event: ScheduleEvent): boolean {
  const startKey = getISTDateKey(event.starts_at);
  const endKey = getISTDateKey(event.ends_at);
  return startKey !== 'Invalid Date' && endKey !== 'Invalid Date' && startKey !== endKey;
}

/**
 * Filters a list of events for a specific IST date key or returns all.
 * Properly includes events that cross midnight into or across the selected day.
 */
export function filterEventsByDay(
  events: readonly ScheduleEvent[],
  selectedDateKey: string
): ScheduleEvent[] {
  if (selectedDateKey === 'all') {
    return [...events];
  }

  return events.filter((event) => {
    const startKey = getISTDateKey(event.starts_at);
    const endKey = getISTDateKey(event.ends_at);

    if (startKey === 'Invalid Date') {
      return false;
    }

    // Single day event
    if (startKey === endKey) {
      return startKey === selectedDateKey;
    }

    // Midnight crossing event: spans across multiple calendar days
    return startKey <= selectedDateKey && selectedDateKey <= endKey;
  });
}

/**
 * Formats user-facing time range with overnight indicator when crossing midnight
 */
export function formatEventTimeRange(startsAt: string, endsAt: string): string {
  const startTime = formatTimeIST(startsAt, false);
  const endTime = formatTimeIST(endsAt, false);
  const crosses = getISTDateKey(startsAt) !== getISTDateKey(endsAt);

  if (crosses) {
    return `${startTime} – ${endTime} (+1 Day)`;
  }

  return `${startTime} – ${endTime}`;
}
