import { announcementPrioritySchema, announcementSchema } from '@/features/announcements/types';
import {
  leaderboardEntrySchema,
  leaderboardRoundItemSchema,
  leaderboardRowSchema,
} from '@/features/leaderboard/types';
import { problemStatementSchema } from '@/features/problems/types';
import { profileSchema, profileUpdateSchema, userRoleSchema } from '@/features/profile/types';
import { eventTypeSchema, scheduleEventSchema } from '@/features/schedule/types';
import { teamInsertSchema, teamSchema } from '@/features/teams/types';
import {
  busRoutePathSchema,
  busRoutePointSchema,
  busRouteSchema,
  busStopSchema,
} from '@/features/transit/types';

describe('Feature Zod Schemas & Validation', () => {
  describe('Teams Schemas', () => {
    it('validates a correct team object', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Binary Beasts',
        team_code: 'BB100',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(teamSchema.parse(valid)).toEqual(valid);
    });

    it('validates team insert payload', () => {
      const insert = { name: 'Code Crushers', team_code: 'CC200' };
      expect(teamInsertSchema.parse(insert)).toEqual(insert);
    });

    it('rejects empty team name', () => {
      expect(() =>
        teamSchema.parse({ id: 'bad', name: '', team_code: 'A', created_at: '' })
      ).toThrow();
    });
  });

  describe('Profile Schemas', () => {
    it('validates valid participant profile', () => {
      const profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Aarav Sharma',
        email: 'aarav@medicaps.ac.in',
        college: 'Medi-Caps University',
        city: 'Indore',
        phone: '+919876543210',
        team_id: '123e4567-e89b-12d3-a456-426614174001',
        role: 'participant',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(profileSchema.parse(profile)).toEqual(profile);
    });

    it('validates organizer profile without team_id', () => {
      const profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Organizer One',
        email: 'org@medicaps.ac.in',
        college: null,
        city: null,
        phone: null,
        team_id: null,
        role: 'organizer',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(profileSchema.parse(profile)).toEqual(profile);
    });

    it('validates userRoleSchema and rejects invalid role', () => {
      expect(userRoleSchema.parse('participant')).toBe('participant');
      expect(userRoleSchema.parse('organizer')).toBe('organizer');
      expect(() => userRoleSchema.parse('admin')).toThrow();
    });

    it('validates partial profile update', () => {
      const update = { full_name: 'Updated Name', city: 'Bhopal' };
      expect(profileUpdateSchema.parse(update)).toEqual(update);
    });
  });

  describe('Schedule Schemas', () => {
    it('validates schedule event and event types', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Opening Ceremony',
        description: 'Welcome keynote and guidelines.',
        location: 'Main Auditorium',
        event_type: 'ceremony',
        starts_at: '2026-10-18T09:00:00.000Z',
        ends_at: '2026-10-18T10:00:00.000Z',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(scheduleEventSchema.parse(event)).toEqual(event);
      expect(eventTypeSchema.parse('workshop')).toBe('workshop');
      expect(eventTypeSchema.parse('jamming')).toBe('jamming');
    });

    it('rejects invalid event type', () => {
      expect(() => eventTypeSchema.parse('party')).toThrow();
    });
  });

  describe('Problem Statement Schemas', () => {
    it('validates problem statement', () => {
      const ps = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'PS-01',
        title: 'AI Traffic Optimization',
        description: 'Design a system for real-time congestion mitigation.',
        domain: 'Artificial Intelligence',
        difficulty: 'Hard',
        release_at: '2026-10-18T10:00:00.000Z',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(problemStatementSchema.parse(ps)).toEqual(ps);
    });

    it('rejects missing code or title', () => {
      expect(() =>
        problemStatementSchema.parse({
          id: '123',
          code: '',
          title: '',
        })
      ).toThrow();
    });
  });

  describe('Announcements Schemas', () => {
    it('validates announcement priorities', () => {
      expect(announcementPrioritySchema.parse('normal')).toBe('normal');
      expect(announcementPrioritySchema.parse('important')).toBe('important');
      expect(announcementPrioritySchema.parse('urgent')).toBe('urgent');
      expect(() => announcementPrioritySchema.parse('critical')).toThrow();
    });

    it('validates full announcement object', () => {
      const announcement = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'WiFi Credentials Updated',
        body: 'Connect to Prayatna-5G with password provided.',
        priority: 'urgent',
        created_by: '123e4567-e89b-12d3-a456-426614174001',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(announcementSchema.parse(announcement)).toEqual(announcement);
    });
  });

  describe('Leaderboard Schemas', () => {
    it('validates raw leaderboard entry', () => {
      const entry = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        team_id: '123e4567-e89b-12d3-a456-426614174001',
        round_name: 'Round 1',
        score: 88.5,
        published: true,
        updated_at: '2026-10-18T12:00:00.000Z',
      };
      expect(leaderboardEntrySchema.parse(entry)).toEqual(entry);
    });

    it('validates aggregated leaderboard row', () => {
      const row = {
        rank: 1,
        team_id: '123e4567-e89b-12d3-a456-426614174001',
        team_name: 'Binary Beasts',
        team_code: 'BB100',
        total_score: 185.5,
        published_rounds_count: 2,
        last_score_updated_at: '2026-10-18T12:00:00.000Z',
        rounds: [
          {
            id: '123e4567-e89b-12d3-a456-426614174010',
            round_name: 'Round 1',
            score: 90,
            published: true,
            updated_at: '2026-10-18T11:00:00.000Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174011',
            round_name: 'Round 2',
            score: 95.5,
            published: true,
            updated_at: '2026-10-18T12:00:00.000Z',
          },
        ],
      };
      expect(leaderboardRowSchema.parse(row)).toEqual(row);
      expect(
        leaderboardRoundItemSchema.parse({
          id: '123e4567-e89b-12d3-a456-426614174010',
          round_name: 'Round 1',
          score: 90,
          published: true,
          updated_at: '2026-10-18T11:00:00.000Z',
        })
      ).toBeDefined();
    });
  });

  describe('Transit Schemas', () => {
    it('validates bus route', () => {
      const route = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Route 1 - Indore City Express',
        description: 'Direct shuttle from Indore Railway Station',
        color: '#4F46E5',
        origin_city: 'Indore',
        departs_at: '2026-10-18T07:30:00.000Z',
        sort_order: 1,
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(busRouteSchema.parse(route)).toEqual(route);
    });

    it('validates bus stop with coordinates', () => {
      const stop = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        route_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Indore Railway Station Platform 1',
        latitude: 22.7196,
        longitude: 75.8577,
        stop_order: 1,
        scheduled_time: '2026-10-18T07:30:00.000Z',
        notes: 'Meet near VIP exit gate',
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(busStopSchema.parse(stop)).toEqual(stop);
    });

    it('rejects out of range latitude/longitude', () => {
      expect(() =>
        busStopSchema.parse({
          id: '123',
          route_id: '123',
          name: 'Invalid Stop',
          latitude: 105, // > 90
          longitude: 75.8,
          stop_order: 1,
          scheduled_time: null,
          notes: null,
          created_at: '2026-10-18T00:00:00.000Z',
        })
      ).toThrow();
    });

    it('validates bus route path points', () => {
      const point = { lat: 22.7196, lng: 75.8577 };
      expect(busRoutePointSchema.parse(point)).toEqual(point);

      const path = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        route_id: '123e4567-e89b-12d3-a456-426614174001',
        points: [
          { lat: 22.7196, lng: 75.8577 },
          { lat: 22.6245, lng: 75.8012 },
        ],
        created_at: '2026-10-18T00:00:00.000Z',
      };
      expect(busRoutePathSchema.parse(path)).toEqual(path);
    });
  });
});
