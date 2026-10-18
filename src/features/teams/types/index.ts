import { z } from 'zod';

export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Team name is required'),
  team_code: z.string().min(3, 'Team code must be at least 3 characters'),
  created_at: z.string(),
});

export const teamInsertSchema = teamSchema.omit({
  id: true,
  created_at: true,
});

export const teamUpdateSchema = teamInsertSchema.partial();

export type Team = z.infer<typeof teamSchema>;
export type TeamInsert = z.infer<typeof teamInsertSchema>;
export type TeamUpdate = z.infer<typeof teamUpdateSchema>;
