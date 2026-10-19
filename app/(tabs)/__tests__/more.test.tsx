import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform } from 'react-native';
import renderer from 'react-test-renderer';

import type { ProfileWithTeam } from '@/features/auth';
import { useAuthStore } from '@/features/auth';

import MoreScreen from '../more';

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

describe('MoreScreen (app/(tabs)/more.tsx)', () => {
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

  it('renders ProfileCard and app version when profile data is available', () => {
    const mockProfile: ProfileWithTeam = {
      id: 'usr-1',
      full_name: 'Aarav Sharma',
      email: 'aarav@medicaps.ac.in',
      college: 'Medi-Caps University',
      city: 'Indore',
      phone: null,
      team_id: 't-1',
      role: 'participant',
      created_at: '2026-10-18T00:00:00.000Z',
      team: {
        id: 't-1',
        name: 'Binary Beasts',
        team_code: 'BB100',
        created_at: '2026-10-18T00:00:00.000Z',
      },
    };

    useAuthStore.setState({
      profile: mockProfile,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <MoreScreen />
        </QueryClientProvider>
      );
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('More & Account');
    expect(json).toContain('Aarav Sharma');
    expect(json).toContain('Binary Beasts');
    expect(json).toContain('Prayatna Companion v1.0.0');
  });

  it('triggers confirmation dialog on native when Sign Out button is pressed', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const signOutSpy = jest.spyOn(useAuthStore.getState(), 'signOut').mockResolvedValue();

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <MoreScreen />
        </QueryClientProvider>
      );
    });

    const signOutBtn = tree?.root.findByProps({ accessibilityLabel: 'Sign out button' });
    renderer.act(() => {
      signOutBtn?.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out of Prayatna Companion?',
      expect.any(Array),
      expect.anything()
    );

    // Simulate clicking the "Sign Out" action button from the alert dialog
    const alertButtons = alertSpy.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    const confirmButton = alertButtons?.find((b) => b.text === 'Sign Out');
    expect(confirmButton).toBeDefined();

    renderer.act(() => {
      confirmButton?.onPress?.();
    });

    expect(signOutSpy).toHaveBeenCalled();
  });

  it('triggers sign out on web fallback', () => {
    const originalOS = Platform.OS;
    Platform.OS = 'web';
    const signOutSpy = jest.spyOn(useAuthStore.getState(), 'signOut').mockResolvedValue();

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <MoreScreen />
        </QueryClientProvider>
      );
    });

    const signOutBtn = tree?.root.findByProps({ accessibilityLabel: 'Sign out button' });
    renderer.act(() => {
      signOutBtn?.props.onPress();
    });

    expect(signOutSpy).toHaveBeenCalled();
    Platform.OS = originalOS;
  });

  it('navigates to bus routes screen when Bus Routes row is tapped', () => {
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <MoreScreen />
        </QueryClientProvider>
      );
    });

    const busBtn = tree?.root.findByProps({ accessibilityLabel: 'Bus Routes' });
    expect(busBtn).toBeDefined();

    renderer.act(() => {
      busBtn?.props.onPress();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/bus');
  });
});
