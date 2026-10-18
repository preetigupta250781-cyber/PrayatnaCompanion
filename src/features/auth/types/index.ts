import { z } from 'zod';

import { profileSchema, teamSchema } from '@/shared/types';

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const profileWithTeamSchema = profileSchema.extend({
  team: teamSchema.nullable().optional(),
});

export type ProfileWithTeam = z.infer<typeof profileWithTeamSchema>;
