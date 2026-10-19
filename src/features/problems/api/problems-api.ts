import { mapToAppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import {
  NextProblemRelease,
  nextProblemReleaseSchema,
  ProblemStatement,
  problemStatementListSchema,
  problemStatementSchema,
} from '../types';

export const problemsApi = {
  /**
   * Fetches all released problem statements (ordered alphabetically by code)
   */
  async fetchProblemStatements(): Promise<ProblemStatement[]> {
    try {
      const { data, error } = await supabase
        .from('problem_statements')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return [];
      }

      return problemStatementListSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },

  /**
   * Fetches a single problem statement by ID
   */
  async fetchProblemStatementById(id: string): Promise<ProblemStatement | null> {
    try {
      const { data, error } = await supabase
        .from('problem_statements')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return null;
      }

      return problemStatementSchema.parse(data);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },

  /**
   * Fetches the next upcoming problem release timestamp via RPC next_problem_release()
   */
  async fetchNextProblemRelease(): Promise<NextProblemRelease> {
    try {
      const { data, error } = await supabase.rpc('next_problem_release');

      if (error) {
        throw mapToAppError(error);
      }

      return nextProblemReleaseSchema.parse(data ?? null);
    } catch (err: unknown) {
      throw mapToAppError(err);
    }
  },
};
