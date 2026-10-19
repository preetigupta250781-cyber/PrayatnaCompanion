import { z } from 'zod';

export const leaderboardRoundItemSchema = z.object({
  id: z.string().uuid(),
  round_name: z.string(),
  score: z.coerce.number(),
  published: z.boolean(),
  updated_at: z.string(),
});

export const leaderboardEntrySchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  round_name: z.string(),
  score: z.coerce.number(),
  published: z.boolean(),
  updated_at: z.string(),
});

export const leaderboardRowSchema = z.object({
  team_id: z.string().uuid(),
  team_name: z.string(),
  team_code: z.string(),
  total_score: z.coerce.number(),
  published_rounds_count: z.coerce.number(),
  last_score_updated_at: z.string().nullable().optional().default(null),
  rounds: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val ?? [];
    }, z.array(leaderboardRoundItemSchema))
    .default([]),
  rank: z.coerce.number(),
});

export const leaderboardViewSchema = z.array(leaderboardRowSchema);

export type LeaderboardRoundItem = z.infer<typeof leaderboardRoundItemSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>;

export type RoundFilter = 'all' | string;

export interface RankedTeamItem {
  team_id: string;
  team_name: string;
  team_code: string;
  score: number;
  rank: number;
  published_rounds_count: number;
  last_score_updated_at: string | null;
  hasScore: boolean;
  round_score?: number | null;
  rounds: LeaderboardRoundItem[];
  rankDelta?: number; // > 0 moved up (e.g. from 3 to 1 is +2), < 0 moved down, 0 no change
}
