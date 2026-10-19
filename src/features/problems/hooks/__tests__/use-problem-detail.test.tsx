import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { problemsApi } from '../../api/problems-api';
import { ProblemStatement } from '../../types';
import { useProblemDetail } from '../use-problem-detail';

jest.mock('../../api/problems-api');

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

function ProblemDetailConsumer({
  id,
  onData,
}: {
  id: string;
  onData: (data: ReturnType<typeof useProblemDetail>) => void;
}) {
  const result = useProblemDetail(id);
  onData(result);
  return null;
}

describe('useProblemDetail Hook', () => {
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

  it('fetches single problem statement and supports refetch', async () => {
    const mockProblem: ProblemStatement = {
      id: 'b1111111-0001-4000-a000-000000000001',
      code: 'PRB-AI-01',
      title: 'Emergency Dispatch Coordinator',
      description: 'Full problem description',
      domain: 'AI',
      difficulty: 'Hard',
      release_at: '2026-10-18T10:00:00.000Z',
      created_at: '2026-10-17T00:00:00.000Z',
    };

    (problemsApi.fetchProblemStatementById as jest.Mock).mockResolvedValue(mockProblem);
    queryClient.setQueryData(['problems', mockProblem.id], mockProblem);

    let latestData: ReturnType<typeof useProblemDetail> | null = null;

    await renderer.act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProblemDetailConsumer
            id={mockProblem.id}
            onData={(data) => {
              latestData = data;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(latestData).not.toBeNull();
    expect(latestData!.problem).toEqual(mockProblem);
    expect(latestData!.isLoading).toBe(false);

    await renderer.act(async () => {
      await latestData!.refetch();
    });

    expect(problemsApi.fetchProblemStatementById).toHaveBeenCalledWith(mockProblem.id);
  });
});
