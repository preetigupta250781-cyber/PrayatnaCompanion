import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/shared/lib/supabase';

import { useAuthStore } from '../auth-store';

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
      isInitialized: false,
    });
    jest.clearAllMocks();
  });

  it('starts with initial unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isInitialized).toBe(false);
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

  it('sets user to null when setSession is called with null', () => {
    useAuthStore.getState().setSession(null);

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it('sets user to null when session user is missing or undefined', () => {
    const sessionWithoutUser = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
    } as unknown as Session;

    useAuthStore.getState().setSession(sessionWithoutUser);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('updates isInitialized state accurately', () => {
    useAuthStore.getState().setIsInitialized(true);
    expect(useAuthStore.getState().isInitialized).toBe(true);

    useAuthStore.getState().setIsInitialized(false);
    expect(useAuthStore.getState().isInitialized).toBe(false);
  });

  it('clears session and user on signOut', async () => {
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
      isInitialized: true,
    });

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it('handles signOut errors gracefully and still clears local state', async () => {
    (supabase.auth.signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it('handles non-Error objects thrown during signOut gracefully', async () => {
    (supabase.auth.signOut as jest.Mock).mockRejectedValueOnce('A raw string error occurred');

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });
});
