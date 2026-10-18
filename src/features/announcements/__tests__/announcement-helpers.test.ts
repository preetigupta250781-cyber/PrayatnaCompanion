import { Announcement } from '../types';
import {
  ANNOUNCEMENT_PRIORITY_CONFIG,
  sortAnnouncementsByDate,
  sortAnnouncementsByPriority,
} from '../utils/announcement-helpers';

describe('Announcements Helpers & Priority Logic', () => {
  const normalOld: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf1',
    title: 'Registration desk open',
    body: 'Badges are ready for collection at the front entrance.',
    priority: 'normal',
    created_by: null,
    created_at: '2026-10-18T03:00:00.000Z',
  };

  const normalRecent: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf2',
    title: 'Snacks arriving',
    body: 'Coffee and snacks available in hall 2.',
    priority: 'normal',
    created_by: null,
    created_at: '2026-10-18T05:00:00.000Z',
  };

  const importantMiddle: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf3',
    title: 'Mentorship round starting',
    body: 'Mentors have arrived and are available in the lounge.',
    priority: 'important',
    created_by: null,
    created_at: '2026-10-18T04:00:00.000Z',
  };

  const urgentOlder: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf4',
    title: 'Power outage notice in Wing B',
    body: 'Electricians are working on backup generators in Wing B.',
    priority: 'urgent',
    created_by: null,
    created_at: '2026-10-18T04:30:00.000Z',
  };

  const urgentNewest: Announcement = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf5',
    title: 'Emergency server maintenance',
    body: 'The git submission portal will restart in 5 minutes.',
    priority: 'urgent',
    created_by: null,
    created_at: '2026-10-18T06:00:00.000Z',
  };

  const mixedAnnouncements: Announcement[] = [
    normalOld,
    importantMiddle,
    urgentOlder,
    normalRecent,
    urgentNewest,
  ];

  describe('Urgent Announcement Ordering Edge Case', () => {
    it('orders urgent announcements first, then important, then normal', () => {
      const sorted = sortAnnouncementsByPriority(mixedAnnouncements);
      const priorities = sorted.map((a) => a.priority);

      expect(priorities).toEqual(['urgent', 'urgent', 'important', 'normal', 'normal']);
    });

    it('breaks ties within the same priority rank by publication date descending (newest first)', () => {
      const sorted = sortAnnouncementsByPriority(mixedAnnouncements);

      // Check the two urgent announcements: urgentNewest (06:00) should be before urgentOlder (04:30)
      expect(sorted[0]?.id).toBe(urgentNewest.id);
      expect(sorted[1]?.id).toBe(urgentOlder.id);

      // Check the important announcement
      expect(sorted[2]?.id).toBe(importantMiddle.id);

      // Check the two normal announcements: normalRecent (05:00) should be before normalOld (03:00)
      expect(sorted[3]?.id).toBe(normalRecent.id);
      expect(sorted[4]?.id).toBe(normalOld.id);
    });

    it('handles empty announcements array gracefully', () => {
      expect(sortAnnouncementsByPriority([])).toEqual([]);
    });

    it('does not mutate the original array', () => {
      const copy = [...mixedAnnouncements];
      sortAnnouncementsByPriority(copy);
      expect(copy).toEqual(mixedAnnouncements);
    });
  });

  describe('sortAnnouncementsByDate', () => {
    it('sorts announcements strictly by publication timestamp with newest first', () => {
      const sorted = sortAnnouncementsByDate(mixedAnnouncements);
      const ids = sorted.map((a) => a.id);

      expect(ids).toEqual([
        urgentNewest.id, // 06:00
        normalRecent.id, // 05:00
        urgentOlder.id, // 04:30
        importantMiddle.id, // 04:00
        normalOld.id, // 03:00
      ]);
    });
  });

  describe('ANNOUNCEMENT_PRIORITY_CONFIG', () => {
    it('contains valid weights, badges, and labels for all priorities', () => {
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.urgent.isUrgent).toBe(true);
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.urgent.badgeVariant).toBe('error');
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.urgent.weight).toBeGreaterThan(
        ANNOUNCEMENT_PRIORITY_CONFIG.important.weight
      );

      expect(ANNOUNCEMENT_PRIORITY_CONFIG.important.isUrgent).toBe(false);
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.important.badgeVariant).toBe('warning');
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.important.weight).toBeGreaterThan(
        ANNOUNCEMENT_PRIORITY_CONFIG.normal.weight
      );

      expect(ANNOUNCEMENT_PRIORITY_CONFIG.normal.isUrgent).toBe(false);
      expect(ANNOUNCEMENT_PRIORITY_CONFIG.normal.badgeVariant).toBe('default');
    });
  });
});
