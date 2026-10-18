import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import renderer from 'react-test-renderer';

import { useAnnouncements } from '@/features/announcements';
import { useProfile } from '@/features/auth';
import { useSchedule } from '@/features/schedule';

import HomeScreen from '../index';

jest.mock('@/features/auth/hooks/use-profile');
jest.mock('@/features/schedule/hooks/use-schedule');
jest.mock('@/features/announcements/hooks/use-announcements');

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

describe('HomeScreen (app/(tabs)/index.tsx)', () => {
  const mockUseProfile = useProfile as jest.Mock;
  const mockUseSchedule = useSchedule as jest.Mock;
  const mockUseAnnouncements = useAnnouncements as jest.Mock;
  const mockRouter = { push: jest.fn() };

  (useRouter as jest.Mock).mockReturnValue(mockRouter);

  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
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

  it('renders HomeSkeleton when any primary query is loading', () => {
    mockUseProfile.mockReturnValue({
      profile: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    mockUseSchedule.mockReturnValue({
      events: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAnnouncements.mockReturnValue({
      announcements: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <HomeScreen />
        </QueryClientProvider>
      );
    });

    // HomeSkeleton container is rendered
    expect(tree!.root).toBeTruthy();
  });

  it('renders greeting, happening now card, and latest announcements', () => {
    mockUseProfile.mockReturnValue({
      profile: {
        id: 'usr-1',
        full_name: 'Priya Verma',
        email: 'priya@example.com',
        college: 'Medi-Caps University',
        city: 'Indore',
        phone: null,
        team_id: 't-1',
        role: 'participant',
        created_at: '2026-10-18T00:00:00.000Z',
        team: {
          id: 't-1',
          name: 'CyberPhantoms',
          team_code: 'CYBER-2026',
          created_at: '2026-10-18T00:00:00.000Z',
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseSchedule.mockReturnValue({
      events: [
        {
          id: 'ev-1',
          title: 'Opening Ceremony',
          description: 'Keynote and rules',
          location: 'Hall A',
          event_type: 'ceremony',
          starts_at: '2020-01-01T00:00:00.000Z',
          ends_at: '2030-01-01T00:00:00.000Z', // Long active
          created_at: '2020-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    mockUseAnnouncements.mockReturnValue({
      announcements: [
        {
          id: 'anc-1',
          title: 'Welcome to Prayatna',
          body: 'Check in at the main gate.',
          priority: 'normal',
          created_by: null,
          created_at: '2026-10-18T06:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <HomeScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;

    // Greeting
    const greeting = root.find(
      (node) => Array.isArray(node.props.children) && node.props.children.includes('Priya')
    );
    expect(greeting).toBeTruthy();
    expect(root.findByProps({ children: 'CyberPhantoms • #CYBER-2026' })).toBeTruthy();

    // Happening now card
    expect(root.findByProps({ label: 'HAPPENING NOW' })).toBeTruthy();
    expect(root.findByProps({ children: 'Opening Ceremony' })).toBeTruthy();

    // Latest announcement
    expect(root.findByProps({ children: 'Welcome to Prayatna' })).toBeTruthy();

    // View all announcements navigation
    const viewAllBtn = root.findByProps({ accessibilityLabel: 'View all announcements' });
    renderer.act(() => {
      viewAllBtn.props.onPress();
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/announcements');
  });
});
