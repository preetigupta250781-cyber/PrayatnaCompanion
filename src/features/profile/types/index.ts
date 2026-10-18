import { z } from 'zod';

export const userRoleSchema = z.enum(['participant', 'organizer']);

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  college: z.string().nullable(),
  city: z.string().nullable(),
  phone: z.string().nullable(),
  team_id: z.string().uuid().nullable(),
  role: userRoleSchema,
  created_at: z.string(),
});

export const profileUpdateSchema = profileSchema
  .pick({
    full_name: true,
    college: true,
    city: true,
    phone: true,
  })
  .partial();

export type UserRole = z.infer<typeof userRoleSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
