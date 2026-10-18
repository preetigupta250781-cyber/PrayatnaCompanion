import React from 'react';
import renderer from 'react-test-renderer';

import { useAuthStore } from '../../model/auth-store';
import { useSession } from '../use-session';

function SessionConsumer({ onSession }: { onSession: (s: ReturnType<typeof useSession>) => void }) {
  const sessionData = useSession();
  onSession(sessionData);
  return null;
}

describe('useSession Hook', () => {
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isInitialized: false,
      authNotice: null,
    });
  });

  afterEach(() => {
    if (tree) {
      renderer.act(() => {
        tree?.unmount();
      });
      tree = null;
    }
  });

  it('returns unauthenticated state when not initialized', () => {
    let captured: ReturnType<typeof useSession> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <SessionConsumer
          onSession={(s) => {
            captured = s;
          }}
        />
      );
    });

    expect(captured?.isAuthenticated).toBe(false);
    expect(captured?.isLoading).toBe(true);
    expect(captured?.session).toBeNull();
  });

  it('returns authenticated state and user details when session exists', () => {
    const mockUser = {
      id: 'usr-1',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: mockUser,
    };

    useAuthStore.setState({
      session: mockSession,
      user: mockUser,
      isInitialized: true,
      authNotice: 'Notice text',
    });

    let captured: ReturnType<typeof useSession> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <SessionConsumer
          onSession={(s) => {
            captured = s;
          }}
        />
      );
    });

    expect(captured?.isAuthenticated).toBe(true);
    expect(captured?.isLoading).toBe(false);
    expect(captured?.user?.id).toBe('usr-1');
    expect(captured?.authNotice).toBe('Notice text');
  });
});
