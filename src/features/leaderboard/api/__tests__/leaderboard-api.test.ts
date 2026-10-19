import { AppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { leaderboardApi } from '../leaderboard-api';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('leaderboardApi', () => {
  const mockViewData = [
    {
      team_id: 'd1111111-1111-4111-a111-111111111111',
      team_name: 'Algorhythms',
      team_code: 'ALGO-2026',
      total_score: 175,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00.000Z',
      rounds: [
        {
          id: 'f2111111-0001-4000-a000-000000000001',
          round_name: 'Round 1: Architecture Review',
          score: 85,
          published: true,
          updated_at: '2026-10-24T14:00:00.000Z',
        },
      ],
      rank: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and returns validated leaderboard rows', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: mockViewData, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await leaderboardApi.fetchLeaderboardView();

    expect(supabase.from).toHaveBeenCalledWith('leaderboard_view');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('total_score', { ascending: false });
    expect(result).toHaveLength(1);
    expect(result[0]?.team_name).toBe('Algorhythms');
    expect(result[0]?.total_score).toBe(175);
  });

  it('returns empty array when data is null', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await leaderboardApi.fetchLeaderboardView();

    expect(result).toEqual([]);
  });

  it('throws mapped AppError on database error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed', code: 'PGRST000' },
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    await expect(leaderboardApi.fetchLeaderboardView()).rejects.toBeInstanceOf(AppError);
  });
});
