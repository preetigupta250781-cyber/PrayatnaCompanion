import { mapToAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { ScheduleEvent, scheduleEventListSchema, scheduleEventSchema } from '../types';

export const scheduleApi = {
  /**
   * Fetches all schedule events ordered chronologically by starts_at
   */
  async fetchScheduleEvents(): Promise<ScheduleEvent[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .order('starts_at', { ascending: true });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return [];
      }

      return scheduleEventListSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },

  /**
   * Fetches a single schedule event by its UUID
   */
  async fetchScheduleEventById(id: string): Promise<ScheduleEvent | null> {
    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return null;
      }

      return scheduleEventSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },
};
