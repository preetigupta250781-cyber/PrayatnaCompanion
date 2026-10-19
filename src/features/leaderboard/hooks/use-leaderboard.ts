import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { QUERY_KEYS, STALE_TIMES } from '@/shared/lib/query-client';
import { useTableRealtime } from '@/shared/lib/realtime';

import { leaderboardApi } from '../api/leaderboard-api';
import { LeaderboardRow, RankedTeamItem, RoundFilter } from '../types';
import {
  calculateDenseRanks,
  extractAvailableRounds,
  formatLastUpdated,
  isRoundDataEmpty,
} from '../utils/leaderboard-helpers';

export interface UseLeaderboardReturn {
  rawRows: LeaderboardRow[];
  rankedTeams: RankedTeamItem[];
  availableRounds: string[];
  selectedRound: RoundFilter;
  setSelectedRound: (round: RoundFilter) => void;
  isDataEmpty: boolean;
  lastUpdatedText: string;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
}

/**
 * Hook to retrieve leaderboard entries, compute dense ranking, handle round filters,
 * and synchronize live score updates via Supabase Realtime.
 */
export function useLeaderboard(): UseLeaderboardReturn {
  // Subscribe to real-time table mutations on leaderboard_entries
  useTableRealtime('leaderboard_entries');

  const [selectedRound, setSelectedRound] = useState<RoundFilter>('all');

  const { data, isLoading, isError, error, refetch, isRefetching, dataUpdatedAt } = useQuery<
    LeaderboardRow[],
    unknown
  >({
    queryKey: QUERY_KEYS.leaderboard,
    queryFn: leaderboardApi.fetchLeaderboardView,
    staleTime: STALE_TIMES.leaderboard,
  });

  const rawRows = useMemo(() => data ?? [], [data]);

  // Extract all distinct published round names
  const availableRounds = useMemo(() => extractAvailableRounds(rawRows), [rawRows]);

  // Check if round data is empty
  const isDataEmpty = useMemo(
    () => isRoundDataEmpty(rawRows, selectedRound),
    [rawRows, selectedRound]
  );

  const [prevTrackedTeams, setPrevTrackedTeams] = useState<LeaderboardRow[]>(rawRows);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});

  if (rawRows !== prevTrackedTeams) {
    setPrevTrackedTeams(rawRows);
    const ranks: Record<string, number> = {};
    const priorRanked = calculateDenseRanks(prevTrackedTeams, selectedRound);
    for (const t of priorRanked) {
      ranks[t.team_id] = t.rank;
    }
    setPreviousRanks(ranks);
  }

  // Compute dense ranks for selected round filter and track rank changes
  const rankedTeams = useMemo(() => {
    return calculateDenseRanks(rawRows, selectedRound, previousRanks);
  }, [rawRows, selectedRound, previousRanks]);

  // Determine latest updated timestamp across all rows
  const latestTimestamp = useMemo(() => {
    let latest: string | null = null;
    for (const row of rawRows) {
      if (row.last_score_updated_at) {
        if (!latest || new Date(row.last_score_updated_at) > new Date(latest)) {
          latest = row.last_score_updated_at;
        }
      }
    }
    return latest;
  }, [rawRows]);

  const lastUpdatedText = useMemo(
    () => formatLastUpdated(latestTimestamp, dataUpdatedAt),
    [latestTimestamp, dataUpdatedAt]
  );

  return {
    rawRows,
    rankedTeams,
    availableRounds,
    selectedRound,
    setSelectedRound,
    isDataEmpty,
    lastUpdatedText,
    isLoading,
    isError,
    error: error ? mapToAppError(error) : null,
    refetch,
    isRefetching,
  };
}
