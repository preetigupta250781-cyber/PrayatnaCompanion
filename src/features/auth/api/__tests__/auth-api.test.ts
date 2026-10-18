import { AuthError, type Session, type User } from '@supabase/supabase-js';

import { AppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabase';

import { authApi } from '../auth-api';

describe('authApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithPassword', () => {
    it('returns session and user on successful sign in', async () => {
      const mockUser = {
        id: 'usr-1',
        email: 'participant@medicaps.ac.in',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const mockSession = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as unknown as Session;

      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: {
          session: mockSession,
          user: mockUser,
        },
        error: null,
      });

      const result = await authApi.signInWithPassword({
        email: 'participant@medicaps.ac.in',
        password: 'ValidPassword123!',
      });

      expect(result.session).toBeDefined();
      expect(result.user.id).toBe('usr-1');
    });

    it('throws AppError with AUTH_INVALID_CREDENTIALS for invalid credentials', async () => {
      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { session: null, user: null },
        error: new AuthError('Invalid login credentials', 400),
      });

      try {
        await authApi.signInWithPassword({
          email: 'wrong@medicaps.ac.in',
          password: 'wrongpassword',
        });
        fail('Should have thrown AppError');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe('AUTH_INVALID_CREDENTIALS');
        expect(appErr.userMessage).toContain('Invalid email or password');
      }
    });

    it('throws AppError with NETWORK_DISCONNECTED on network drops', async () => {
      jest
        .spyOn(supabase.auth, 'signInWithPassword')
        .mockRejectedValueOnce(new TypeError('Network request failed'));

      try {
        await authApi.signInWithPassword({
          email: 'participant@medicaps.ac.in',
          password: 'ValidPassword123!',
        });
        fail('Should have thrown AppError');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        const appErr = err as AppError;
        expect(appErr.code).toBe('NETWORK_DISCONNECTED');
        expect(appErr.retryable).toBe(true);
      }
    });
  });

  describe('fetchProfileWithTeam', () => {
    it('returns parsed profile joined with team when found', async () => {
      const mockProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Aarav Sharma',
        email: 'aarav@medicaps.ac.in',
        college: 'Medi-Caps University',
        city: 'Indore',
        phone: '+919876543210',
        team_id: '123e4567-e89b-12d3-a456-426614174001',
        role: 'participant',
        created_at: '2026-10-18T00:00:00.000Z',
        team: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Binary Beasts',
          team_code: 'BB100',
          created_at: '2026-10-18T00:00:00.000Z',
        },
      };

      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      } as unknown as ReturnType<typeof supabase.from>);

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });

      const result = await authApi.fetchProfileWithTeam('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBeDefined();
      expect(result?.full_name).toBe('Aarav Sharma');
      expect(result?.team?.name).toBe('Binary Beasts');
    });

    it('returns null when no profile row exists for the user', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null,
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      } as unknown as ReturnType<typeof supabase.from>);

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });

      const result = await authApi.fetchProfileWithTeam('missing-user-id');
      expect(result).toBeNull();
    });

    it('throws AppError when database query returns error', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({
        data: null,
        error: {
          message: 'permission denied for table profiles',
          code: '42501',
        },
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      } as unknown as ReturnType<typeof supabase.from>);

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });

      await expect(authApi.fetchProfileWithTeam('err-user')).rejects.toThrow(AppError);
    });
  });

  describe('getCurrentSession', () => {
    it('returns session if available', async () => {
      const mockSession = { user: { id: 'u1' } } as unknown as Session;
      jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const session = await authApi.getCurrentSession();
      expect(session).toEqual(mockSession);
    });

    it('returns null when session is null in getSession response', async () => {
      jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const session = await authApi.getCurrentSession();
      expect(session).toBeNull();
    });

    it('returns null when getSession encounters an error or throws', async () => {
      jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: null },
        error: new AuthError('Corrupted session token in secure store', 400),
      });

      const session = await authApi.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('signOutUser', () => {
    it('calls supabase.auth.signOut', async () => {
      const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: null,
      });

      await authApi.signOutUser();
      expect(signOutSpy).toHaveBeenCalled();
    });

    it('handles error from supabase.auth.signOut gracefully without throwing', async () => {
      jest.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: new AuthError('Sign out failed on remote', 500),
      });

      await expect(authApi.signOutUser()).resolves.toBeUndefined();
    });
  });
});
