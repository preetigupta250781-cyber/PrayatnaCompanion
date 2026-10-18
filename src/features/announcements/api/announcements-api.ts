import { mapToAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { Announcement, announcementListSchema, announcementSchema } from '../types';

export const announcementsApi = {
  /**
   * Fetches all announcements ordered with newest first
   */
  async fetchAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return [];
      }

      return announcementListSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },

  /**
   * Fetches a single announcement by its UUID
   */
  async fetchAnnouncementById(id: string): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return null;
      }

      return announcementSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },
};
