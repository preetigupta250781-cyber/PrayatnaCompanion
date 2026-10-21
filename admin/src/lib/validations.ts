import { z } from 'zod';

export const participantCsvRowSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  college: z.string().trim().optional().default(''),
  city: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  team_name: z.string().trim().optional().default(''),
});

export type ParticipantCsvRow = z.infer<typeof participantCsvRowSchema>;

export const scheduleEventSchema = z
  .object({
    title: z.string().trim().min(2, 'Title is required (min 2 chars)'),
    description: z.string().trim().optional().default(''),
    location: z.string().trim().optional().default(''),
    event_type: z.enum(['session', 'workshop', 'jamming', 'judging', 'meal', 'ceremony', 'other']),
    starts_at: z.string().datetime({ message: 'Invalid start time' }),
    ends_at: z.string().datetime({ message: 'Invalid end time' }),
  })
  .refine((data) => new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime(), {
    message: 'Event end time must be chronologically after start time',
    path: ['ends_at'],
  });

export type ScheduleEventInput = z.infer<typeof scheduleEventSchema>;

export const problemStatementSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must contain only letters, numbers, hyphens, and underscores'),
  title: z.string().trim().min(3, 'Title is required (min 3 chars)'),
  description: z.string().trim().min(5, 'Description is required (min 5 chars)'),
  domain: z.string().trim().min(2, 'Track/Domain is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  release_at: z.string().datetime({ message: 'Invalid release date/time' }),
});

export type ProblemStatementInput = z.infer<typeof problemStatementSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(2, 'Title is required (min 2 chars)'),
  body: z.string().trim().min(5, 'Announcement body must be at least 5 characters'),
  priority: z.enum(['normal', 'important', 'urgent']),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Team name must be at least 2 characters'),
  team_code: z
    .string()
    .trim()
    .min(3, 'Team code must be at least 3 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Team code must be alphanumeric'),
});

export type TeamInput = z.infer<typeof teamSchema>;

export const scoreEntrySchema = z.object({
  team_id: z.string().uuid('Invalid team ID'),
  round_name: z.string().trim().min(1, 'Round name is required'),
  score: z.number().min(0, 'Score must be non-negative'),
  published: z.boolean().default(false),
});

export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;

export const busRouteSchema = z.object({
  name: z.string().trim().min(2, 'Route name is required'),
  description: z.string().trim().optional().default(''),
  color: z.string().trim().optional().default('#00F0FF'),
  origin_city: z.string().trim().optional().default(''),
  departs_at: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
});

export type BusRouteInput = z.infer<typeof busRouteSchema>;

export const busStopSchema = z.object({
  route_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Stop name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  stop_order: z.number().int().min(1),
  scheduled_time: z.string().optional().nullable(),
  notes: z.string().trim().optional().default(''),
});

export type BusStopInput = z.infer<typeof busStopSchema>;
