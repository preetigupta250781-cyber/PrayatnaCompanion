import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { problemsApi } from '../api/problems-api';
import { NextProblemRelease, ProblemStatement } from '../types';

export const NEXT_RELEASE_QUERY_KEY = ['problems', 'next-release'] as const;

export interface UseProblemsReturn {
  problems: ProblemStatement[];
  nextRelease: NextProblemRelease;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
  handleCountdownZero: () => Promise<void>;
}

/**
 * Hook to retrieve released problem statements and the next upcoming release time.
 * Automatically synchronizes with Supabase Realtime table mutations.
 */
export function useProblems(): UseProblemsReturn {
  const queryClient = useQueryClient();

  // Subscribe to realtime database changes on problem_statements
  useTableRealtime('problem_statements');

  // Query 1: Released problem statements (RLS hides unreleased)
  const problemsQuery = useQuery<ProblemStatement[], unknown>({
    queryKey: QUERY_KEYS.problems,
    queryFn: problemsApi.fetchProblemStatements,
    staleTime: STALE_TIMES.problems,
  });

  // Query 2: Next upcoming problem release timestamp via RPC
  const nextReleaseQuery = useQuery<NextProblemRelease, unknown>({
    queryKey: NEXT_RELEASE_QUERY_KEY,
    queryFn: problemsApi.fetchNextProblemRelease,
    staleTime: STALE_TIMES.problems,
  });

  const refetch = useCallback(async () => {
    return Promise.all([problemsQuery.refetch(), nextReleaseQuery.refetch()]);
  }, [problemsQuery, nextReleaseQuery]);

  const handleCountdownZero = useCallback(async () => {
    // Invalidate and refetch immediately when countdown finishes
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.problems });
    await Promise.all([problemsQuery.refetch(), nextReleaseQuery.refetch()]);
  }, [queryClient, problemsQuery, nextReleaseQuery]);

  const isLoading = problemsQuery.isLoading || nextReleaseQuery.isLoading;
  const isError = problemsQuery.isError || nextReleaseQuery.isError;
  const rawError = problemsQuery.error ?? nextReleaseQuery.error;
  const error = rawError ? mapToAppError(rawError) : null;
  const isRefetching = problemsQuery.isRefetching || nextReleaseQuery.isRefetching;

  return {
    problems: problemsQuery.data ?? [],
    nextRelease: nextReleaseQuery.data ?? null,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    handleCountdownZero,
  };
}
