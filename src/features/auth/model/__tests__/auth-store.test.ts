import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';

import { queryClient } from '@/shared/lib/query-client';
import { supabase } from '@/shared/lib/supabase';

import type { ProfileWithTeam } from '../../types';
import { PERSISTED_QUERY_CACHE_KEY, useAuthStore } from '../auth-store';

// Mock supabase client
jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('useAuthStore (Zustand Auth Store)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isInitialized: false,
      authNotice: null,
    });
    jest.clearAllMocks();
  });

  it('starts with initial unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isInitialized).toBe(false);
    expect(state.authNotice).toBeNull();
  });

  it('updates session and derives user when setSession is called', () => {
    const mockUser: User = {
      id: 'user-abc-123',
      app_metadata: {},
      user_metadata: { name: 'Hacker' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.user).toEqual(mockUser);
  });

  it('sets profile when setProfile is called', () => {
    const mockProfile: ProfileWithTeam = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'Test Hacker',
      email: 'hacker@medicaps.ac.in',
      college: 'Medi-Caps',
      city: 'Indore',
      phone: null,
      team_id: null,
      role: 'participant',
      created_at: '2026-10-18T00:00:00.000Z',
    };

    useAuthStore.getState().setProfile(mockProfile);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });

  it('updates isInitialized flag', () => {
    useAuthStore.getState().setIsInitialized(true);
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('manages authNotice state and clearing', () => {
    useAuthStore.getState().setAuthNotice('Session expired');
    expect(useAuthStore.getState().authNotice).toBe('Session expired');

    useAuthStore.getState().clearAuthNotice();
    expect(useAuthStore.getState().authNotice).toBeNull();
  });

  it('clears session, profile, and both in-memory and persisted query caches on signOut', async () => {
    const clearSpy = jest.spyOn(queryClient, 'clear');
    const removeItemSpy = jest.spyOn(AsyncStorage, 'removeItem').mockResolvedValueOnce();

    const mockUser: User = {
      id: 'user-xyz',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    useAuthStore.setState({
      session: {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      },
      user: mockUser,
      profile: {
        id: 'user-xyz',
        full_name: 'Hacker',
        email: 'hacker@medicaps.ac.in',
        college: null,
        city: null,
        phone: null,
        team_id: null,
        role: 'participant',
        created_at: '2026-10-18T00:00:00.000Z',
      },
      isInitialized: true,
    });

    await useAuthStore.getState().signOut('Forced logout notice');

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith(PERSISTED_QUERY_CACHE_KEY);

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.authNotice).toBe('Forced logout notice');
  });

  it('handles signOut errors gracefully and still clears state', async () => {
    (supabase.auth.signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.authNotice).toBeNull();
  });

  it('handles AsyncStorage error during signOut gracefully', async () => {
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Disk write error'));

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });
});
