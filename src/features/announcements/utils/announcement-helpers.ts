import { BadgeVariant } from '@/shared/ui/badge';

import { Announcement, AnnouncementPriority } from '../types';

export interface PriorityConfig {
  label: string;
  badgeVariant: BadgeVariant;
  weight: number;
  isUrgent: boolean;
}

export const ANNOUNCEMENT_PRIORITY_CONFIG: Record<AnnouncementPriority, PriorityConfig> = {
  urgent: {
    label: 'URGENT',
    badgeVariant: 'error',
    weight: 3,
    isUrgent: true,
  },
  important: {
    label: 'IMPORTANT',
    badgeVariant: 'warning',
    weight: 2,
    isUrgent: false,
  },
  normal: {
    label: 'INFO',
    badgeVariant: 'default',
    weight: 1,
    isUrgent: false,
  },
};

/**
 * Sorts announcements strictly by publication date with newest first
 */
export function sortAnnouncementsByDate(announcements: readonly Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
  });
}

/**
 * Sorts announcements by priority weight (urgent > important > normal),
 * breaking ties by publication date descending (newest first).
 */
export function sortAnnouncementsByPriority(
  announcements: readonly Announcement[]
): Announcement[] {
  return [...announcements].sort((a, b) => {
    const weightA = ANNOUNCEMENT_PRIORITY_CONFIG[a.priority]?.weight ?? 0;
    const weightB = ANNOUNCEMENT_PRIORITY_CONFIG[b.priority]?.weight ?? 0;

    if (weightA !== weightB) {
      return weightB - weightA;
    }

    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeB - timeA;
  });
}
