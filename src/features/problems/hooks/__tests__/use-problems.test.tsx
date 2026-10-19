import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { QUERY_KEYS } from '@/shared/lib/query-client';

import { problemsApi } from '../../api/problems-api';
import { ProblemStatement } from '../../types';
import { NEXT_RELEASE_QUERY_KEY, useProblems } from '../use-problems';

jest.mock('../../api/problems-api');
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

function ProblemsConsumer({ onData }: { onData: (data: ReturnType<typeof useProblems>) => void }) {
  const result = useProblems();
  onData(result);
  return null;
}

describe('useProblems Hook', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

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

  it('returns cached problem statements and nextRelease and handles refetch', async () => {
    const mockProblems: ProblemStatement[] = [
      {
        id: 'b1111111-0001-4000-a000-000000000001',
        code: 'PRB-AI-01',
        title: 'Emergency Dispatch Coordinator',
        description: 'AI model',
        domain: 'AI',
        difficulty: 'Hard',
        release_at: '2026-10-18T10:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      },
    ];
    const mockNextRelease = '2026-10-25T14:00:00.000Z';

    queryClient.setQueryData(QUERY_KEYS.problems, mockProblems);
    queryClient.setQueryData(NEXT_RELEASE_QUERY_KEY, mockNextRelease);

    let latestHookData: ReturnType<typeof useProblems> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProblemsConsumer
            onData={(data) => {
              latestHookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(latestHookData).not.toBeNull();
    expect(latestHookData!.problems).toEqual(mockProblems);
    expect(latestHookData!.nextRelease).toBe(mockNextRelease);
    expect(latestHookData!.isLoading).toBe(false);

    (problemsApi.fetchProblemStatements as jest.Mock).mockResolvedValue(mockProblems);
    (problemsApi.fetchNextProblemRelease as jest.Mock).mockResolvedValue(mockNextRelease);

    await renderer.act(async () => {
      await latestHookData!.refetch();
    });

    expect(problemsApi.fetchProblemStatements).toHaveBeenCalled();
    expect(problemsApi.fetchNextProblemRelease).toHaveBeenCalled();
  });

  it('handleCountdownZero invalidates and refetches problems', async () => {
    (problemsApi.fetchProblemStatements as jest.Mock).mockResolvedValue([]);
    (problemsApi.fetchNextProblemRelease as jest.Mock).mockResolvedValue(null);

    let latestHookData: ReturnType<typeof useProblems> | null = null;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProblemsConsumer
            onData={(data) => {
              latestHookData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await renderer.act(async () => {
      await latestHookData!.handleCountdownZero();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.problems });
  });
});
