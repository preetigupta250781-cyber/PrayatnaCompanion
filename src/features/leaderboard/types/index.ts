import { z } from 'zod';

export const leaderboardRoundItemSchema = z.object({
  id: z.string().uuid(),
  round_name: z.string(),
  score: z.number(),
  published: z.boolean(),
  updated_at: z.string(),
});

export const leaderboardEntrySchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  round_name: z.string(),
  score: z.number(),
  published: z.boolean(),
  updated_at: z.string(),
});

export const leaderboardRowSchema = z.object({
  team_id: z.string().uuid(),
  team_name: z.string(),
  team_code: z.string(),
  total_score: z.number(),
  published_rounds_count: z.number(),
  last_score_updated_at: z.string().nullable(),
  rounds: z.array(leaderboardRoundItemSchema).default([]),
  rank: z.number(),
});

export const leaderboardViewSchema = z.array(leaderboardRowSchema);

export type LeaderboardRoundItem = z.infer<typeof leaderboardRoundItemSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>;
