import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { AppError } from '@/shared/lib/errors';

import { authApi } from '../../api/auth-api';
import { useAuthStore } from '../../model/auth-store';
import { PROFILE_MISSING_MESSAGE, SESSION_EXPIRED_MESSAGE, useProfile } from '../use-profile';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function ProfileConsumer({ onProfile }: { onProfile: (p: ReturnType<typeof useProfile>) => void }) {
  const profileData = useProfile();
  onProfile(profileData);
  return null;
}

describe('useProfile Hook', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isInitialized: true,
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
    queryClient.clear();
  });

  it('returns null profile and team when not authenticated', () => {
    let captured: ReturnType<typeof useProfile> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileConsumer
            onProfile={(p) => {
              captured = p;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(captured?.profile).toBeNull();
    expect(captured?.team).toBeNull();
  });

  it('fetches and returns profile with team on success', () => {
    const mockUser = {
      id: 'usr-123',
      email: 'aarav@medicaps.ac.in',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockProfileWithTeam = {
      id: 'usr-123',
      full_name: 'Aarav Sharma',
      email: 'aarav@medicaps.ac.in',
      college: 'Medi-Caps University',
      city: 'Indore',
      phone: '+919876543210',
      team_id: 'team-1',
      role: 'participant' as const,
      created_at: '2026-10-18T00:00:00.000Z',
      team: {
        id: 'team-1',
        name: 'Binary Beasts',
        team_code: 'BB100',
        created_at: '2026-10-18T00:00:00.000Z',
      },
    };

    jest.spyOn(authApi, 'fetchProfileWithTeam').mockResolvedValue(mockProfileWithTeam);
    queryClient.setQueryData(['profile', 'usr-123'], mockProfileWithTeam);

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

    let captured: ReturnType<typeof useProfile> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileConsumer
            onProfile={(p) => {
              captured = p;
            }}
          />
        </QueryClientProvider>
      );
    });

    expect(captured?.profile?.full_name).toBe('Aarav Sharma');
    expect(captured?.team?.name).toBe('Binary Beasts');
    expect(captured?.team?.team_code).toBe('BB100');
  });

  it('triggers graceful signOut when session exists but no profile row in database', () => {
    const signOutSpy = jest.spyOn(useAuthStore.getState(), 'signOut');
    jest.spyOn(authApi, 'fetchProfileWithTeam').mockResolvedValue(null);
    queryClient.setQueryData(['profile', 'ghost-user'], null);

    const mockUser = {
      id: 'ghost-user',
      email: 'ghost@medicaps.ac.in',
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

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileConsumer onProfile={() => {}} />
        </QueryClientProvider>
      );
    });

    expect(signOutSpy).toHaveBeenCalledWith(PROFILE_MISSING_MESSAGE);
  });

  it('triggers forced signOut when token is invalid or account removed (401/AUTH_SESSION_EXPIRED)', async () => {
    const signOutSpy = jest.spyOn(useAuthStore.getState(), 'signOut');
    const authError = new AppError({
      code: 'AUTH_SESSION_EXPIRED',
      userMessage: 'Session expired',
      retryable: false,
    });
    jest.spyOn(authApi, 'fetchProfileWithTeam').mockRejectedValue(authError);

    queryClient.setQueryDefaults(['profile', 'deleted-user'], {
      retry: false,
      staleTime: 60000,
    });

    try {
      await queryClient.fetchQuery({
        queryKey: ['profile', 'deleted-user'],
        queryFn: () => Promise.reject(authError),
      });
    } catch {
      // Expected rejection
    }

    const mockUser = {
      id: 'deleted-user',
      email: 'deleted@medicaps.ac.in',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    useAuthStore.setState({
      session: {
        access_token: 'expired-token',
        refresh_token: 'invalid-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      },
      user: mockUser,
      isInitialized: true,
    });

    await renderer.act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileConsumer onProfile={() => {}} />
        </QueryClientProvider>
      );
    });

    await renderer.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(signOutSpy).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  });
});
