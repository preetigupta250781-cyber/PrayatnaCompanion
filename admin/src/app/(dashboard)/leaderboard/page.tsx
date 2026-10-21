'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Trophy,
  Save,
  Eye,
  EyeOff,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Medal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/audit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatInIST } from '@/lib/date';
import { Database } from '@/types/database';

type Team = Database['public']['Tables']['teams']['Row'];
type LeaderboardEntry = Database['public']['Tables']['leaderboard_entries']['Row'];

interface TeamScoreRow {
  team_id: string;
  team_name: string;
  team_code: string;
  entry_id?: string;
  score: number;
  published: boolean;
  updated_at?: string;
  dense_rank?: number;
}

const DEFAULT_ROUNDS = ['Round 1', 'Round 2', 'Round 3', 'Finals'];

export default function LeaderboardAdminPage() {
  const supabase = createClient();

  const [teams, setTeams] = useState<Team[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableRounds, setAvailableRounds] = useState<string[]>(DEFAULT_ROUNDS);
  const [selectedRound, setSelectedRound] = useState<string>('Round 1');
  const [newRoundInput, setNewRoundInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable scores state: map of team_id -> score number
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teamsRes, entriesRes] = await Promise.all([
        supabase.from('teams').select('*').order('name', { ascending: true }),
        supabase.from('leaderboard_entries').select('*'),
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      const loadedTeams = teamsRes.data || [];
      const loadedEntries = entriesRes.data || [];

      setTeams(loadedTeams);
      setEntries(loadedEntries);

      // Extract unique rounds from entries and merge with defaults
      const existingRounds = Array.from(new Set(loadedEntries.map((e) => e.round_name))).filter(
        Boolean
      );

      const allRounds = Array.from(new Set([...DEFAULT_ROUNDS, ...existingRounds]));
      setAvailableRounds(allRounds);

      // Initialize score inputs for selected round
      const roundEntries = loadedEntries.filter((e) => e.round_name === selectedRound);
      const scoreMap: Record<string, number> = {};
      loadedTeams.forEach((t) => {
        const entry = roundEntries.find((e) => e.team_id === t.id);
        scoreMap[t.id] = entry ? Number(entry.score) : 0;
      });
      setEditedScores(scoreMap);
    } catch (err: unknown) {
      console.error('Error fetching leaderboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedRound]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When selected round changes, re-sync editedScores from current entries
  useEffect(() => {
    const roundEntries = entries.filter((e) => e.round_name === selectedRound);
    const scoreMap: Record<string, number> = {};
    teams.forEach((t) => {
      const entry = roundEntries.find((e) => e.team_id === t.id);
      scoreMap[t.id] = entry ? Number(entry.score) : 0;
    });
    setEditedScores(scoreMap);
  }, [selectedRound, entries, teams]);

  // Calculate whether the current selected round is considered published
  const roundEntries = useMemo(
    () => entries.filter((e) => e.round_name === selectedRound),
    [entries, selectedRound]
  );

  const isRoundPublished = useMemo(() => {
    if (roundEntries.length === 0) return false;
    // Considered published if at least one is published, or majority published
    return roundEntries.some((e) => e.published);
  }, [roundEntries]);

  // Build combined rows with dense rank calculation
  const rankedRows = useMemo(() => {
    // Build raw list
    const rows: TeamScoreRow[] = teams.map((team) => {
      const entry = roundEntries.find((e) => e.team_id === team.id);
      const localScore = editedScores[team.id];
      const currentScore: number =
        typeof localScore === 'number' ? localScore : entry ? Number(entry.score) : 0;

      return {
        team_id: team.id,
        team_name: team.name,
        team_code: team.team_code,
        entry_id: entry?.id,
        score: currentScore,
        published: entry?.published || false,
        updated_at: entry?.updated_at,
      };
    });

    // Sort descending by score for ranking preview
    rows.sort((a, b) => b.score - a.score || a.team_name.localeCompare(b.team_name));

    // Calculate Dense Rank (1, 1, 2, 3, 3, 4...)
    let currentRank = 0;
    let prevScore: number | null = null;
    rows.forEach((row) => {
      if (prevScore === null || row.score < prevScore) {
        currentRank += 1;
        prevScore = row.score;
      }
      row.dense_rank = currentRank;
    });

    return rows;
  }, [teams, roundEntries, editedScores]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rankedRows;
    return rankedRows.filter(
      (r) => r.team_name.toLowerCase().includes(q) || r.team_code.toLowerCase().includes(q)
    );
  }, [rankedRows, searchQuery]);

  const handleScoreChange = (teamId: string, value: string) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setEditedScores((prev) => ({
      ...prev,
      [teamId]: num,
    }));
  };

  const handleSaveSingleScore = async (row: TeamScoreRow) => {
    setSavingTeamId(row.team_id);
    setStatusMessage(null);
    try {
      const scoreVal = editedScores[row.team_id] ?? row.score;

      // Upsert entry
      const { data, error: upsertErr } = await supabase
        .from('leaderboard_entries')
        .upsert(
          {
            team_id: row.team_id,
            round_name: selectedRound,
            score: scoreVal,
            published: isRoundPublished, // maintain current round publication state
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'team_id,round_name' }
        )
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      await logAuditEvent({
        action: 'UPDATE_SCORE',
        resourceType: 'leaderboard_entries',
        resourceId: data.id,
        metadata: {
          team_id: row.team_id,
          team_name: row.team_name,
          round_name: selectedRound,
          score: scoreVal,
        },
      });

      setStatusMessage(`Saved score for ${row.team_name}`);
      setTimeout(() => setStatusMessage(null), 3000);
      await fetchData();
    } catch (err: unknown) {
      console.error('Error saving score:', err);
      alert(err instanceof Error ? err.message : 'Failed to save score.');
    } finally {
      setSavingTeamId(null);
    }
  };

  const handleSaveAllScores = async () => {
    setIsBulkSaving(true);
    setStatusMessage(null);
    try {
      const updates = teams.map((team) => ({
        team_id: team.id,
        round_name: selectedRound,
        score: editedScores[team.id] ?? 0,
        published: isRoundPublished,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('leaderboard_entries')
        .upsert(updates, { onConflict: 'team_id,round_name' });

      if (upsertErr) throw upsertErr;

      await logAuditEvent({
        action: 'BULK_UPDATE_SCORES',
        resourceType: 'leaderboard_entries',
        metadata: {
          round_name: selectedRound,
          teams_count: updates.length,
        },
      });

      setStatusMessage(`All scores saved successfully for ${selectedRound}.`);
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchData();
    } catch (err: unknown) {
      console.error('Error saving all scores:', err);
      alert(err instanceof Error ? err.message : 'Failed to bulk save scores.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleTogglePublishRound = async () => {
    setIsTogglingPublish(true);
    setStatusMessage(null);
    try {
      const targetState = !isRoundPublished;

      // 1. Ensure all teams have an entry in this round before publishing
      const upsertRows = teams.map((team) => ({
        team_id: team.id,
        round_name: selectedRound,
        score: editedScores[team.id] ?? 0,
        published: targetState,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('leaderboard_entries')
        .upsert(upsertRows, { onConflict: 'team_id,round_name' });

      if (upsertErr) throw upsertErr;

      await logAuditEvent({
        action: targetState ? 'PUBLISH_ROUND' : 'UNPUBLISH_ROUND',
        resourceType: 'leaderboard_entries',
        metadata: {
          round_name: selectedRound,
          published: targetState,
          affected_teams: upsertRows.length,
        },
      });

      setStatusMessage(
        targetState
          ? `Published ${selectedRound} to participant mobile devices!`
          : `Unpublished ${selectedRound}. It is now in draft mode.`
      );
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchData();
    } catch (err: unknown) {
      console.error('Error toggling round publish status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update round visibility.');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleAddRound = () => {
    const trimmed = newRoundInput.trim();
    if (!trimmed) return;
    if (!availableRounds.includes(trimmed)) {
      setAvailableRounds([...availableRounds, trimmed]);
    }
    setSelectedRound(trimmed);
    setNewRoundInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#00F0FF]" />
            Leaderboard & Score Entry
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Input round scores, preview live dense ranks, and publish rounds to participants with
            RLS security.
          </p>
        </div>

        {statusMessage && (
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {/* Round Selection & Controls Bar */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Round Pills */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Select Competition Round
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {availableRounds.map((round) => {
                const isSelected = round === selectedRound;
                // Check if this round has any published entries in cache
                const roundHasPublished = entries.some(
                  (e) => e.round_name === round && e.published
                );

                return (
                  <button
                    key={round}
                    type="button"
                    onClick={() => setSelectedRound(round)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#00F0FF] text-black shadow-lg shadow-[#00F0FF]/20'
                        : 'bg-[#0A0D14] text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{round}</span>
                    {roundHasPublished ? (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-black' : 'bg-emerald-400'
                        }`}
                        title="Published to participants"
                      />
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-black/40' : 'bg-zinc-600'
                        }`}
                        title="Draft / Unpublished"
                      />
                    )}
                  </button>
                );
              })}

              {/* Add custom round inline */}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="text"
                  placeholder="+ New Round"
                  value={newRoundInput}
                  onChange={(e) => setNewRoundInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRound()}
                  className="bg-[#0A0D14] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF] w-28"
                />
                {newRoundInput.trim() && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddRound}
                    className="px-2 py-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Round Publish Toggle & Bulk Save Button */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={isRoundPublished ? 'outline' : 'primary'}
              onClick={handleTogglePublishRound}
              disabled={isTogglingPublish || teams.length === 0}
              className={`flex items-center gap-2 text-xs font-medium ${
                isRoundPublished
                  ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                  : ''
              }`}
            >
              {isRoundPublished ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{isTogglingPublish ? 'Updating...' : `Published (${selectedRound})`}</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>{isTogglingPublish ? 'Updating...' : `Publish ${selectedRound}`}</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleSaveAllScores}
              disabled={isBulkSaving || teams.length === 0}
              variant="secondary"
              className="flex items-center gap-2 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isBulkSaving ? 'Saving...' : 'Save All Scores'}</span>
            </Button>
          </div>
        </div>

        {/* Round Status Info Banner */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Status:</span>
            {isRoundPublished ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live on participant mobile app
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Draft mode (Hidden by RLS from participants)
              </span>
            )}
          </div>
          <div>Total registered teams: {teams.length}</div>
        </div>
      </div>

      {/* Top 3 Podium Highlights for Selected Round */}
      {rankedRows.length >= 3 &&
        rankedRows[0] &&
        rankedRows[1] &&
        rankedRows[2] &&
        rankedRows[0].score > 0 &&
        (() => {
          const first = rankedRows[0];
          const second = rankedRows[1];
          const third = rankedRows[2];
          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rank 2 */}
              <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 flex items-center gap-3 order-2 sm:order-1">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center font-bold text-zinc-300">
                  #2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 truncate">{second.team_code}</p>
                  <h4 className="text-sm font-semibold text-white truncate">{second.team_name}</h4>
                  <p className="text-xs font-mono text-[#00F0FF]">{second.score} pts</p>
                </div>
              </div>

              {/* Rank 1 */}
              <div className="bg-[#12161F] border border-amber-500/40 rounded-xl p-4 flex items-center gap-3 order-1 sm:order-2 shadow-lg shadow-amber-500/10">
                <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Leader</span>
                  <h4 className="text-sm font-bold text-white truncate">{first.team_name}</h4>
                  <p className="text-xs font-mono font-bold text-[#00F0FF]">{first.score} pts</p>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="bg-[#12161F] border border-zinc-800 rounded-xl p-4 flex items-center gap-3 order-3">
                <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center font-bold text-amber-700">
                  #3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-400 truncate">{third.team_code}</p>
                  <h4 className="text-sm font-semibold text-white truncate">{third.team_name}</h4>
                  <p className="text-xs font-mono text-[#00F0FF]">{third.score} pts</p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Search & Score Table */}
      <div className="bg-[#12161F] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search team name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="text-xs text-zinc-400">
            Dense ranks auto-calculated: ties share same rank number.
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={6} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Trophy className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm">No teams found matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#0A0D14] text-xs uppercase font-medium text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 w-48">Score ({selectedRound})</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredRows.map((row) => {
                  const isSavingThis = savingTeamId === row.team_id;
                  const isTop3 = (row.dense_rank || 99) <= 3 && row.score > 0;

                  return (
                    <tr key={row.team_id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono ${
                            row.dense_rank === 1 && row.score > 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : row.dense_rank === 2 && row.score > 0
                                ? 'bg-zinc-700/50 text-zinc-200'
                                : row.dense_rank === 3 && row.score > 0
                                  ? 'bg-amber-900/30 text-amber-600'
                                  : 'text-zinc-500'
                          }`}
                        >
                          {row.dense_rank}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{row.team_name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {row.team_code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={editedScores[row.team_id] ?? row.score}
                            onChange={(e) => handleScoreChange(row.team_id, e.target.value)}
                            className="bg-[#0A0D14] border border-zinc-800 focus:border-[#00F0FF] rounded-lg px-3 py-1.5 text-sm font-mono text-white w-28 focus:outline-none"
                          />
                          <span className="text-xs text-zinc-500 font-mono">pts</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {row.updated_at ? formatInIST(row.updated_at) : '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveSingleScore(row)}
                          disabled={isSavingThis}
                          className="text-zinc-400 hover:text-[#00F0FF] text-xs"
                        >
                          <Save className="w-3.5 h-3.5 mr-1" />
                          {isSavingThis ? 'Saving...' : 'Save'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
