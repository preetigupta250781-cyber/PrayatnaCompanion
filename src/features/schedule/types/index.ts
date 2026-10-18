import { z } from 'zod';

export const eventTypeSchema = z.enum([
  'session',
  'workshop',
  'jamming',
  'judging',
  'meal',
  'ceremony',
  'other',
]);

export const scheduleEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  location: z.string().nullable(),
  event_type: eventTypeSchema,
  starts_at: z.string(),
  ends_at: z.string(),
  created_at: z.string(),
});

export const scheduleEventListSchema = z.array(scheduleEventSchema);

export type EventType = z.infer<typeof eventTypeSchema>;
export type ScheduleEvent = z.infer<typeof scheduleEventSchema>;
