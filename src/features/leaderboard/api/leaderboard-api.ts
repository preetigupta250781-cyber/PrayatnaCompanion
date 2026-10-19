import { mapToAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { LeaderboardRow, leaderboardViewSchema } from '../types';

export const leaderboardApi = {
  /**
   * Fetches dynamic leaderboard view containing teams, scores, rounds, and dense ranks.
   */
  async fetchLeaderboardView(): Promise<LeaderboardRow[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('total_score', { ascending: false });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return [];
      }

      return leaderboardViewSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },
};
