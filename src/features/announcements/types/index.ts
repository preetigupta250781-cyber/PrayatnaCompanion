import { z } from 'zod';

export const announcementPrioritySchema = z.enum(['normal', 'important', 'urgent']);

export const announcementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  priority: announcementPrioritySchema,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

export const announcementListSchema = z.array(announcementSchema);

export type AnnouncementPriority = z.infer<typeof announcementPrioritySchema>;
export type Announcement = z.infer<typeof announcementSchema>;
