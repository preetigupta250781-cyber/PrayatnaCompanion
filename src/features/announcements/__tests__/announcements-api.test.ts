import { supabase } from '@/shared/lib/supabase';

import { announcementsApi } from '../api/announcements-api';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('announcementsApi', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAnnouncements', () => {
    it('fetches and validates announcements feed ordered by created_at descending', async () => {
      const mockRawData = [
        {
          id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf1',
          title: 'Opening Ceremony in 15 Minutes',
          body: 'All teams please report to Main Auditorium.',
          priority: 'urgent',
          created_by: null,
          created_at: '2026-10-18T04:00:00.000Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockRawData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await announcementsApi.fetchAnnouncements();

      expect(mockFrom).toHaveBeenCalledWith('announcements');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Opening Ceremony in 15 Minutes');
    });

    it('returns empty array when data is null', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      const result = await announcementsApi.fetchAnnouncements();
      expect(result).toEqual([]);
    });

    it('throws AppError when Supabase responds with error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network disconnected', code: 'PGRST500' },
      });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(announcementsApi.fetchAnnouncements()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });

    it('throws AppError when data fails zod validation', async () => {
      const invalidData = [
        {
          id: 'invalid-id',
          title: '', // Empty title
          priority: 'not-valid-priority',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: invalidData, error: null });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order: mockOrder }) });

      await expect(announcementsApi.fetchAnnouncements()).rejects.toMatchObject({
        userMessage: expect.any(String),
      });
    });
  });

  describe('fetchAnnouncementById', () => {
    it('returns single announcement when found', async () => {
      const mockItem = {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf1',
        title: 'Wifi info',
        body: 'Credentials on badge.',
        priority: 'normal',
        created_by: null,
        created_at: '2026-10-18T04:00:00.000Z',
      };

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await announcementsApi.fetchAnnouncementById(mockItem.id);
      expect(result?.id).toBe(mockItem.id);
    });

    it('returns null when announcement not found', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const result = await announcementsApi.fetchAnnouncementById(
        'f81d4fae-7dec-11d0-a765-00a0c91e6bf1'
      );
      expect(result).toBeNull();
    });
  });
});
