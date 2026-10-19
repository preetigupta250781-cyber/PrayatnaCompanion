import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { QUERY_KEYS } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { leaderboardApi } from '../../api/leaderboard-api';
import { LeaderboardRow } from '../../types';
import { useLeaderboard } from '../use-leaderboard';

jest.mock('../../api/leaderboard-api');
jest.mock('@/shared/lib/realtime', () => ({
  useTableRealtime: jest.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function LeaderboardConsumer({
  onData,
}: {
  onData: (data: ReturnType<typeof useLeaderboard>) => void;
}) {
  const result = useLeaderboard();
  onData(result);
  return null;
}

describe('useLeaderboard Hook', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  const mockRows: LeaderboardRow[] = [
    {
      team_id: 't-1',
      team_name: 'Team Alpha',
      team_code: 'ALPH-101',
      total_score: 95,
      published_rounds_count: 1,
      last_score_updated_at: '2026-10-24T10:00:00Z',
      rounds: [
        {
          id: 'r-1',
          round_name: 'Round 1: Architecture Review',
          score: 95,
          published: true,
          updated_at: '2026-10-24T10:00:00Z',
        },
      ],
      rank: 1,
    },
    {
      team_id: 't-2',
      team_name: 'Team Beta',
      team_code: 'BETA-202',
      total_score: 90,
      published_rounds_count: 1,
      last_score_updated_at: '2026-10-24T10:00:00Z',
      rounds: [
        {
          id: 'r-2',
          round_name: 'Round 1: Architecture Review',
          score: 90,
          published: true,
          updated_at: '2026-10-24T10:00:00Z',
        },
      ],
      rank: 2,
    },
  ];

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (tree) {
      renderer.act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    queryClient.clear();
  });

  it('subscribes to realtime updates for leaderboard_entries', () => {
    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <LeaderboardConsumer onData={() => {}} />
        </QueryClientProvider>
      );
    });

    expect(useTableRealtime).toHaveBeenCalledWith('leaderboard_entries');
  });

  it('provides ranked teams and available rounds from cached query data', () => {
    queryClient.setQueryData(QUERY_KEYS.leaderboard, mockRows);

    let hookData: ReturnType<typeof useLeaderboard> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <LeaderboardConsumer
            onData={(data) => {
              hookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(hookData).not.toBeNull();
    expect(hookData!.rankedTeams).toHaveLength(2);
    expect(hookData!.rankedTeams[0]?.team_name).toBe('Team Alpha');
    expect(hookData!.rankedTeams[0]?.rank).toBe(1);
    expect(hookData!.availableRounds).toEqual(['Round 1: Architecture Review']);
    expect(hookData!.isDataEmpty).toBe(false);
  });

  it('updates selected round and recalculates dense ranks', () => {
    queryClient.setQueryData(QUERY_KEYS.leaderboard, mockRows);

    let hookData: ReturnType<typeof useLeaderboard> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <LeaderboardConsumer
            onData={(data) => {
              hookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(hookData!.selectedRound).toBe('all');

    renderer.act(() => {
      hookData!.setSelectedRound('Round 1: Architecture Review');
    });

    expect(hookData!.selectedRound).toBe('Round 1: Architecture Review');
    expect(hookData!.rankedTeams).toHaveLength(2);
  });

  it('handles empty database response and sets isDataEmpty to true', () => {
    queryClient.setQueryData(QUERY_KEYS.leaderboard, []);

    let hookData: ReturnType<typeof useLeaderboard> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <LeaderboardConsumer
            onData={(data) => {
              hookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(hookData!.rankedTeams).toHaveLength(0);
    expect(hookData!.isDataEmpty).toBe(true);
  });

  it('handles refetch cleanly', async () => {
    (leaderboardApi.fetchLeaderboardView as jest.Mock).mockResolvedValue(mockRows);

    let hookData: ReturnType<typeof useLeaderboard> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <LeaderboardConsumer
            onData={(data) => {
              hookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    await renderer.act(async () => {
      await hookData!.refetch();
    });

    expect(leaderboardApi.fetchLeaderboardView).toHaveBeenCalled();
  });
});
