import type { Session, User } from '@supabase/supabase-js';

import { AppError, mapToAppError } from '@/shared/lib/errors';
import { logger } from '@/shared/lib/logger';
import { supabase } from '@/shared/lib/supabase';

import { LoginFormValues, ProfileWithTeam, profileWithTeamSchema } from '../types';

export const authApi = {
  /**
   * Signs in a user with email and password credentials.
   */
  async signInWithPassword({
    email,
    password,
  }: LoginFormValues): Promise<{ session: Session; user: User }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw mapToAppError(error);
      }

      if (!data.session || !data.user) {
        throw new AppError({
          code: 'AUTH_INVALID_CREDENTIALS',
          userMessage: 'Invalid email or password. Please verify your credentials.',
          retryable: false,
        });
      }

      logger.info('User successfully authenticated', { userId: data.user.id });
      return { session: data.session, user: data.user };
    } catch (err) {
      const appErr = mapToAppError(err);
      logger.warn('Sign in failed', { code: appErr.code, message: appErr.userMessage });
      throw appErr;
    }
  },

  /**
   * Signs out the current user session from Supabase.
   */
  async signOutUser(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('Supabase sign out reported an error', { message: error.message });
      }
    } catch (err) {
      logger.warn('Exception during Supabase sign out', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  /**
   * Fetches the user profile joined with team details.
   * Returns null if no profile row exists for the user.
   */
  async fetchProfileWithTeam(userId: string): Promise<ProfileWithTeam | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, team:teams(*)')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw mapToAppError(error);
      }

      if (!data) {
        return null;
      }

      return profileWithTeamSchema.parse(data);
    } catch (err) {
      const appErr = mapToAppError(err);
      logger.warn('Failed to fetch profile with team', {
        userId,
        code: appErr.code,
      });
      throw appErr;
    }
  },

  /**
   * Retrieves the current Supabase session from storage.
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw mapToAppError(error);
      }
      return data.session ?? null;
    } catch (err) {
      logger.warn('Failed to retrieve current session', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },
};
