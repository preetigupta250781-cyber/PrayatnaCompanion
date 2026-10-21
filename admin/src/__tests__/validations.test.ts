import {
  participantCsvRowSchema,
  scheduleEventSchema,
  problemStatementSchema,
  announcementSchema,
  teamSchema,
  scoreEntrySchema,
  busRouteSchema,
  busStopSchema,
} from '@/lib/validations';

describe('Admin Zod Validations', () => {
  describe('participantCsvRowSchema', () => {
    it('accepts valid participant row', () => {
      const result = participantCsvRowSchema.safeParse({
        full_name: 'Alice Johnson',
        email: 'alice@example.com',
        college: 'MIT Campus',
        city: 'Chennai',
        phone: '9876543210',
        team_name: 'Alpha Squad',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('alice@example.com');
      }
    });

    it('rejects invalid email', () => {
      const result = participantCsvRowSchema.safeParse({
        full_name: 'Bob',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects too short name', () => {
      const result = participantCsvRowSchema.safeParse({
        full_name: 'A',
        email: 'bob@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('scheduleEventSchema', () => {
    it('accepts chronological start and end times', () => {
      const result = scheduleEventSchema.safeParse({
        title: 'Opening Ceremony',
        description: 'Welcome keynote and rules announcement',
        location: 'Main Auditorium',
        event_type: 'ceremony',
        starts_at: '2026-10-24T04:30:00.000Z',
        ends_at: '2026-10-24T05:30:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when ends_at is before or equal to starts_at', () => {
      const result = scheduleEventSchema.safeParse({
        title: 'Bad Time Window',
        event_type: 'session',
        starts_at: '2026-10-24T05:30:00.000Z',
        ends_at: '2026-10-24T04:30:00.000Z',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          'Event end time must be chronologically after start time'
        );
      }
    });
  });

  describe('problemStatementSchema', () => {
    it('accepts valid problem statement', () => {
      const result = problemStatementSchema.safeParse({
        code: 'AI-01',
        title: 'Edge AI Detection',
        description: 'Comprehensive description of the challenge.',
        domain: 'AI/ML',
        difficulty: 'Hard',
        release_at: '2026-10-24T06:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid characters in code', () => {
      const result = problemStatementSchema.safeParse({
        code: 'AI 01 invalid!',
        title: 'Edge AI Detection',
        description: 'Detailed description.',
        domain: 'AI/ML',
        difficulty: 'Easy',
        release_at: '2026-10-24T06:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('announcementSchema', () => {
    it('accepts valid announcement and checks priorities', () => {
      const valid = announcementSchema.safeParse({
        title: 'Lunch is served',
        body: 'Please proceed to dining area A.',
        priority: 'urgent',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects body with less than 5 chars', () => {
      const result = announcementSchema.safeParse({
        title: 'Test',
        body: 'Hey',
        priority: 'normal',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('teamSchema', () => {
    it('accepts alphanumeric team code', () => {
      const result = teamSchema.safeParse({
        name: 'Cyber Knights',
        team_code: 'CYB-01',
      });
      expect(result.success).toBe(true);
    });

    it('rejects team code with spaces', () => {
      const result = teamSchema.safeParse({
        name: 'Cyber Knights',
        team_code: 'CYB 01',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('scoreEntrySchema', () => {
    it('validates non-negative scores and UUID', () => {
      const result = scoreEntrySchema.safeParse({
        team_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        round_name: 'Round 1',
        score: 88.5,
        published: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative scores', () => {
      const result = scoreEntrySchema.safeParse({
        team_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        round_name: 'Round 1',
        score: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('busRouteSchema & busStopSchema', () => {
    it('validates coordinates range', () => {
      const validStop = busStopSchema.safeParse({
        route_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Central Station',
        latitude: 13.0827,
        longitude: 80.2707,
        stop_order: 1,
      });
      expect(validStop.success).toBe(true);

      const invalidLatitude = busStopSchema.safeParse({
        route_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Invalid Stop',
        latitude: 195.0,
        longitude: 80.0,
        stop_order: 1,
      });
      expect(invalidLatitude.success).toBe(false);
    });
  });
});
