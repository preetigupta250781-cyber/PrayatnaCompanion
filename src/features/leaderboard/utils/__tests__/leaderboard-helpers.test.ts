import { LeaderboardRow } from '../../types';
import {
  calculateDenseRanks,
  extractAvailableRounds,
  formatLastUpdated,
  isRoundDataEmpty,
} from '../leaderboard-helpers';

describe('leaderboard-helpers', () => {
  const mockRows: LeaderboardRow[] = [
    {
      team_id: 't-1111',
      team_name: 'Algorhythms',
      team_code: 'ALGO-2026',
      total_score: 175.0,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00.000Z',
      rounds: [
        {
          id: 'r-1',
          round_name: 'Round 1: Architecture Review',
          score: 85.0,
          published: true,
          updated_at: '2026-10-24T14:00:00.000Z',
        },
        {
          id: 'r-2',
          round_name: 'Round 2: Prototype Implementation',
          score: 90.0,
          published: true,
          updated_at: '2026-10-24T18:00:00.000Z',
        },
      ],
      rank: 1,
    },
    {
      team_id: 't-2222',
      team_name: 'ByteCoders',
      team_code: 'BYTE-4040',
      total_score: 175.0,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00.000Z',
      rounds: [
        {
          id: 'r-3',
          round_name: 'Round 1: Architecture Review',
          score: 90.0,
          published: true,
          updated_at: '2026-10-24T14:00:00.000Z',
        },
        {
          id: 'r-4',
          round_name: 'Round 2: Prototype Implementation',
          score: 85.0,
          published: true,
          updated_at: '2026-10-24T18:00:00.000Z',
        },
      ],
      rank: 1,
    },
    {
      team_id: 't-3333',
      team_name: 'NeuralKnights',
      team_code: 'NEUR-8080',
      total_score: 167.0,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00.000Z',
      rounds: [
        {
          id: 'r-5',
          round_name: 'Round 1: Architecture Review',
          score: 85.0,
          published: true,
          updated_at: '2026-10-24T14:00:00.000Z',
        },
        {
          id: 'r-6',
          round_name: 'Round 2: Prototype Implementation',
          score: 82.0,
          published: true,
          updated_at: '2026-10-24T18:00:00.000Z',
        },
      ],
      rank: 2,
    },
    {
      team_id: 't-4444',
      team_name: 'ZeroScoreTeam',
      team_code: 'ZERO-0000',
      total_score: 0,
      published_rounds_count: 0,
      last_score_updated_at: null,
      rounds: [],
      rank: 3,
    },
  ];

  describe('calculateDenseRanks', () => {
    it('handles exact ties with dense ranking (1, 1, 2) under all rounds', () => {
      const ranked = calculateDenseRanks(mockRows, 'all');

      expect(ranked).toHaveLength(4);

      // Algorhythms and ByteCoders tie for Rank 1 with 175.0 points
      const algo = ranked.find((t) => t.team_id === 't-1111');
      const byte = ranked.find((t) => t.team_id === 't-2222');
      const neural = ranked.find((t) => t.team_id === 't-3333');
      const zero = ranked.find((t) => t.team_id === 't-4444');

      expect(algo?.score).toBe(175.0);
      expect(algo?.rank).toBe(1);

      expect(byte?.score).toBe(175.0);
      expect(byte?.rank).toBe(1);

      // Dense rank does not skip 2; NeuralKnights receives Rank 2
      expect(neural?.score).toBe(167.0);
      expect(neural?.rank).toBe(2);

      // Team without scores placed at bottom
      expect(zero?.hasScore).toBe(false);
      expect(zero?.rank).toBe(3);
    });

    it('handles multiple consecutive ties properly (dense rank without gaps)', () => {
      const customRows: LeaderboardRow[] = [
        {
          ...mockRows[0]!,
          team_id: 'a',
          team_name: 'Team A',
          total_score: 100,
          published_rounds_count: 1,
        },
        {
          ...mockRows[1]!,
          team_id: 'b',
          team_name: 'Team B',
          total_score: 100,
          published_rounds_count: 1,
        },
        {
          ...mockRows[2]!,
          team_id: 'c',
          team_name: 'Team C',
          total_score: 90,
          published_rounds_count: 1,
        },
        {
          ...mockRows[3]!,
          team_id: 'd',
          team_name: 'Team D',
          total_score: 90,
          published_rounds_count: 1,
        },
        {
          ...mockRows[3]!,
          team_id: 'e',
          team_name: 'Team E',
          total_score: 80,
          published_rounds_count: 1,
        },
      ];

      const ranked = calculateDenseRanks(customRows, 'all');

      expect(ranked.map((t) => ({ name: t.team_name, rank: t.rank, score: t.score }))).toEqual([
        { name: 'Team A', rank: 1, score: 100 },
        { name: 'Team B', rank: 1, score: 100 },
        { name: 'Team C', rank: 2, score: 90 },
        { name: 'Team D', rank: 2, score: 90 },
        { name: 'Team E', rank: 3, score: 80 },
      ]);
    });

    it('correctly filters by a specific round and re-calculates dense ranks', () => {
      // In Round 1:
      // ByteCoders: 90.0 -> Rank 1
      // Algorhythms: 85.0 -> Rank 2 (Tie)
      // NeuralKnights: 85.0 -> Rank 2 (Tie)
      // ZeroScoreTeam: No score -> bottom
      const ranked = calculateDenseRanks(mockRows, 'Round 1: Architecture Review');

      expect(ranked[0]?.team_name).toBe('ByteCoders');
      expect(ranked[0]?.score).toBe(90.0);
      expect(ranked[0]?.rank).toBe(1);

      const rank2Teams = ranked.filter((t) => t.rank === 2);
      expect(rank2Teams).toHaveLength(2);
      expect(rank2Teams.map((t) => t.team_name).sort()).toEqual(['Algorhythms', 'NeuralKnights']);

      const zero = ranked.find((t) => t.team_id === 't-4444');
      expect(zero?.hasScore).toBe(false);
      expect(zero?.rank).toBe(3);
    });

    it('handles teams without scores for a specific round', () => {
      const rowsWithMissingRound: LeaderboardRow[] = [
        mockRows[0]!, // has Round 1 and Round 2
        {
          ...mockRows[1]!, // only has Round 1
          rounds: [mockRows[1]!.rounds[0]!],
        },
      ];

      const ranked = calculateDenseRanks(rowsWithMissingRound, 'Round 2: Prototype Implementation');

      // Algorhythms has score 90 in Round 2
      expect(ranked[0]?.team_name).toBe('Algorhythms');
      expect(ranked[0]?.hasScore).toBe(true);
      expect(ranked[0]?.rank).toBe(1);

      // ByteCoders has no entry for Round 2
      expect(ranked[1]?.team_name).toBe('ByteCoders');
      expect(ranked[1]?.hasScore).toBe(false);
      expect(ranked[1]?.score).toBe(0);
      expect(ranked[1]?.rank).toBe(2);
    });

    it('calculates rank delta when previous ranks are supplied', () => {
      // previous ranks:
      // t-1111 was rank 3, now rank 1 -> +2
      // t-2222 was rank 1, now rank 1 -> 0
      // t-3333 was rank 1, now rank 2 -> -1
      const previousRanks = {
        't-1111': 3,
        't-2222': 1,
        't-3333': 1,
      };

      const ranked = calculateDenseRanks(mockRows, 'all', previousRanks);

      const algo = ranked.find((t) => t.team_id === 't-1111');
      const byte = ranked.find((t) => t.team_id === 't-2222');
      const neural = ranked.find((t) => t.team_id === 't-3333');

      expect(algo?.rankDelta).toBe(2); // 3 - 1
      expect(byte?.rankDelta).toBe(0); // 1 - 1
      expect(neural?.rankDelta).toBe(-1); // 1 - 2
    });

    it('returns empty array when rows is empty', () => {
      expect(calculateDenseRanks([], 'all')).toEqual([]);
    });
  });

  describe('extractAvailableRounds', () => {
    it('extracts unique published round names in natural order', () => {
      const rounds = extractAvailableRounds(mockRows);

      expect(rounds).toEqual(['Round 1: Architecture Review', 'Round 2: Prototype Implementation']);
    });

    it('ignores unpublished rounds', () => {
      const rowsWithUnpublished: LeaderboardRow[] = [
        {
          ...mockRows[0]!,
          rounds: [
            {
              id: 'r-draft',
              round_name: 'Draft Secret Round',
              score: 50,
              published: false,
              updated_at: '2026-10-24T12:00:00Z',
            },
          ],
        },
      ];

      expect(extractAvailableRounds(rowsWithUnpublished)).toEqual([]);
    });

    it('returns empty array when no rows exist', () => {
      expect(extractAvailableRounds([])).toEqual([]);
    });
  });

  describe('isRoundDataEmpty', () => {
    it('returns true for empty array', () => {
      expect(isRoundDataEmpty([], 'all')).toBe(true);
      expect(isRoundDataEmpty([], 'Round 1')).toBe(true);
    });

    it('returns false when published data exists', () => {
      expect(isRoundDataEmpty(mockRows, 'all')).toBe(false);
      expect(isRoundDataEmpty(mockRows, 'Round 1: Architecture Review')).toBe(false);
    });

    it('returns true when selected round has no scores for any team', () => {
      expect(isRoundDataEmpty(mockRows, 'Round 3: Final Pitch')).toBe(true);
    });

    it('returns true for "all" when all teams have 0 published rounds', () => {
      const emptyScores: LeaderboardRow[] = [{ ...mockRows[3]! }];
      expect(isRoundDataEmpty(emptyScores, 'all')).toBe(true);
    });
  });

  describe('formatLastUpdated', () => {
    it('formats valid ISO date string with IST', () => {
      const result = formatLastUpdated('2026-10-24T12:30:00.000Z');
      expect(result).toContain('IST');
    });

    it('formats fallback numeric timestamp', () => {
      const result = formatLastUpdated(null, Date.now() - 60000);
      expect(result).toContain('IST');
    });

    it('returns "Just now" when neither is provided', () => {
      expect(formatLastUpdated(null, 0)).toBe('Just now');
    });
  });
});
