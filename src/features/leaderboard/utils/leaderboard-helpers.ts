import { formatDistanceToNow, parseISO } from 'date-fns';

import { DATE_FORMATS, formatInIST } from '@/shared/utils/date';

import { LeaderboardRow, RankedTeamItem, RoundFilter } from '../types';

/**
 * Extracts unique published round names across all teams in alphabetical/natural order.
 */
export function extractAvailableRounds(rows: LeaderboardRow[]): string[] {
  const roundSet = new Set<string>();

  for (const row of rows) {
    if (Array.isArray(row.rounds)) {
      for (const round of row.rounds) {
        if (round.published && round.round_name) {
          roundSet.add(round.round_name.trim());
        }
      }
    }
  }

  return Array.from(roundSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Checks whether leaderboard data or a specific round filter contains no published score entries.
 */
export function isRoundDataEmpty(rows: LeaderboardRow[], filter: RoundFilter): boolean {
  if (!rows || rows.length === 0) {
    return true;
  }

  if (filter === 'all') {
    // If no team has any published rounds or non-zero score
    return !rows.some((row) => row.published_rounds_count > 0 && row.total_score > 0);
  }

  // For a specific round, check if any team has a published score for it
  return !rows.some((row) =>
    row.rounds.some(
      (r) => r.round_name.trim() === filter.trim() && r.published && r.score !== undefined
    )
  );
}

/**
 * Computes dense rankings for teams under "all" rounds or a specific round filter.
 *
 * Dense Ranking Rule:
 * - Equal scores receive the exact same rank.
 * - The next distinct score receives the immediate subsequent integer rank (no rank numbers are skipped).
 * - Teams without scores are sorted to the bottom.
 */
export function calculateDenseRanks(
  rows: LeaderboardRow[],
  filter: RoundFilter,
  previousRanks?: Record<string, number>
): RankedTeamItem[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  // 1. Calculate each team's effective score for the chosen filter
  const teamsWithScores = rows.map((row) => {
    let score = 0;
    let hasScore = false;
    let roundScore: number | null = null;

    if (filter === 'all') {
      score = Number(row.total_score ?? 0);
      hasScore = row.published_rounds_count > 0;
    } else {
      const match = row.rounds.find((r) => r.round_name.trim() === filter.trim() && r.published);
      if (match) {
        score = Number(match.score ?? 0);
        roundScore = score;
        hasScore = true;
      } else {
        score = 0;
        roundScore = null;
        hasScore = false;
      }
    }

    return {
      team_id: row.team_id,
      team_name: row.team_name,
      team_code: row.team_code,
      score,
      hasScore,
      round_score: roundScore,
      published_rounds_count: row.published_rounds_count,
      last_score_updated_at: row.last_score_updated_at ?? null,
      rounds: row.rounds ?? [],
    };
  });

  // 2. Sort teams:
  // - Teams with published scores first, sorted by score descending.
  // - Tie-breaker: team_name ascending for deterministic order.
  // - Teams without scores at the bottom, sorted by team_name ascending.
  const sorted = teamsWithScores.sort((a, b) => {
    if (a.hasScore && !b.hasScore) return -1;
    if (!a.hasScore && b.hasScore) return 1;

    if (a.hasScore && b.hasScore) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.team_name.localeCompare(b.team_name);
    }

    return a.team_name.localeCompare(b.team_name);
  });

  // 3. Assign Dense Ranks
  let currentDenseRank = 0;
  let previousScore: number | null = null;
  const result: RankedTeamItem[] = [];

  for (const team of sorted) {
    let assignedRank: number;

    if (team.hasScore) {
      if (previousScore === null || team.score !== previousScore) {
        currentDenseRank += 1;
        previousScore = team.score;
      }
      assignedRank = currentDenseRank;
    } else {
      // Teams without scores receive rank after all scored teams
      assignedRank = currentDenseRank + 1;
    }

    // 4. Calculate Rank Delta (previousRank - currentRank)
    // Example: Was rank 3, now rank 1 -> 3 - 1 = +2 (moved up)
    // Example: Was rank 1, now rank 2 -> 1 - 2 = -1 (moved down)
    let rankDelta = 0;
    if (previousRanks && typeof previousRanks[team.team_id] === 'number') {
      const prev = previousRanks[team.team_id];
      if (typeof prev === 'number' && prev > 0) {
        rankDelta = prev - assignedRank;
      }
    }

    result.push({
      ...team,
      rank: assignedRank,
      rankDelta,
    });
  }

  return result;
}

/**
 * Formats the "Last updated" display string from the latest score timestamp or query dataUpdatedAt.
 */
export function formatLastUpdated(timestamp?: string | null, dataUpdatedAt?: number): string {
  if (timestamp) {
    try {
      const date = parseISO(timestamp);
      const timeIST = formatInIST(date, DATE_FORMATS.TIME);
      const relative = formatDistanceToNow(date, { addSuffix: true });
      return `${timeIST} IST (${relative})`;
    } catch {
      // Fallback to dataUpdatedAt
    }
  }

  if (dataUpdatedAt && dataUpdatedAt > 0) {
    try {
      const date = new Date(dataUpdatedAt);
      const timeIST = formatInIST(date, DATE_FORMATS.TIME);
      const relative = formatDistanceToNow(date, { addSuffix: true });
      return `${timeIST} IST (${relative})`;
    } catch {
      // Fallback
    }
  }

  return 'Just now';
}
