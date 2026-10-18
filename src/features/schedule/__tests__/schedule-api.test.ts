import { supabase } from '@/shared/lib/supabase';

import { scheduleApi } from '../api/schedule-api';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('scheduleApi', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchScheduleEvents', () => {
    it('fetches and validates schedule events list successfully', async () => {
      const mockRawData = [
        {
          id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
          title: 'Orientation',
          description: 'Getting started guide',
          location: 'Hall A',
          event_type: 'ceremony',
          starts_at: '2026-10-18T04:00:00.000Z',
          ends_at: '2026-10-18T05:00:00.000Z',
          created_at: '2026-10-17T00:00:00.000Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockRawData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await scheduleApi.fetchScheduleEvents();

      expect(mockFrom).toHaveBeenCalledWith('schedule_events');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('starts_at', { ascending: true });
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Orientation');
    });

    it('returns empty array when data is null', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      const result = await scheduleApi.fetchScheduleEvents();
      expect(result).toEqual([]);
    });

    it('throws AppError when Supabase responds with error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST500' },
      });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(scheduleApi.fetchScheduleEvents()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });

    it('throws AppError when data violates zod schema', async () => {
      const invalidData = [
        {
          id: 'not-a-uuid',
          title: '', // Invalid empty title
          event_type: 'unknown-type',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: invalidData, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(scheduleApi.fetchScheduleEvents()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });
  });

  describe('fetchScheduleEventById', () => {
    it('returns single event when found', async () => {
      const mockItem = {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        title: 'Mentoring',
        description: null,
        location: null,
        event_type: 'session',
        starts_at: '2026-10-18T06:00:00.000Z',
        ends_at: '2026-10-18T07:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      };

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await scheduleApi.fetchScheduleEventById(mockItem.id);
      expect(result?.id).toBe(mockItem.id);
    });

    it('returns null when event not found', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await scheduleApi.fetchScheduleEventById(
        'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
      );
      expect(result).toBeNull();
    });
  });
});
