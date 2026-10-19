import { useQuery } from '@tanstack/react-query';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { STALE_TIMES } from '@/shared/lib/query-client';

import { problemsApi } from '../api/problems-api';
import { ProblemStatement } from '../types';

export interface UseProblemDetailReturn {
  problem: ProblemStatement | null;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve details of a specific problem statement by ID
 */
export function useProblemDetail(id: string): UseProblemDetailReturn {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<
    ProblemStatement | null,
    unknown
  >({
    queryKey: ['problems', id],
    queryFn: () => problemsApi.fetchProblemStatementById(id),
    staleTime: STALE_TIMES.problems,
    enabled: Boolean(id),
  });

  return {
    problem: data ?? null,
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
