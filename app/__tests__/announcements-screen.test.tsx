import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import renderer from 'react-test-renderer';

import { useAnnouncements } from '@/features/announcements';

import AnnouncementsScreen from '../announcements';

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

describe('AnnouncementsScreen (app/announcements.tsx)', () => {
  const mockUseAnnouncements = useAnnouncements as jest.Mock;
  const mockRouter = {
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    replace: jest.fn(),
  };

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

  it('renders AnnouncementListSkeleton while loading', () => {
    mockUseAnnouncements.mockReturnValue({
      announcements: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <AnnouncementsScreen />
        </QueryClientProvider>
      );
    });

    expect(tree!.root.findByProps({ children: 'Announcements' })).toBeTruthy();
  });

  it('renders announcements feed and responds to back button', () => {
    const mockAnnouncements = [
      {
        id: 'anc-1',
        title: 'Snacks Available',
        body: 'Grab your drinks at the snack table in Wing B.',
        priority: 'normal',
        created_by: null,
        created_at: '2026-10-18T05:00:00.000Z',
      },
      {
        id: 'anc-2',
        title: 'Emergency Wi-Fi switch',
        body: 'Please reconnect to Prayatna_Guest if Prayatna_Hacks disconnects.',
        priority: 'urgent',
        created_by: null,
        created_at: '2026-10-18T06:00:00.000Z',
      },
    ];

    mockUseAnnouncements.mockReturnValue({
      announcements: mockAnnouncements,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <AnnouncementsScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    // Both items rendered
    expect(root.findByProps({ children: 'Emergency Wi-Fi switch' })).toBeTruthy();
    expect(root.findByProps({ children: 'Snacks Available' })).toBeTruthy();

    // Back button
    const backBtn = root.findByProps({ accessibilityLabel: 'Go back' });
    renderer.act(() => {
      backBtn.props.onPress();
    });
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('filters announcements when Urgent chip is selected', () => {
    const mockAnnouncements = [
      {
        id: 'anc-1',
        title: 'Snacks Available',
        body: 'Grab your drinks at the snack table in Wing B.',
        priority: 'normal',
        created_by: null,
        created_at: '2026-10-18T05:00:00.000Z',
      },
      {
        id: 'anc-2',
        title: 'Emergency Wi-Fi switch',
        body: 'Please reconnect to Prayatna_Guest.',
        priority: 'urgent',
        created_by: null,
        created_at: '2026-10-18T06:00:00.000Z',
      },
    ];

    mockUseAnnouncements.mockReturnValue({
      announcements: mockAnnouncements,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <AnnouncementsScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    // Find Urgent chip and select it
    const urgentChip = root.findByProps({ label: 'Urgent' });
    renderer.act(() => {
      urgentChip.props.onPress();
    });

    // Only urgent announcement should be rendered
    expect(root.findByProps({ children: 'Emergency Wi-Fi switch' })).toBeTruthy();
    expect(root.findAllByProps({ children: 'Snacks Available' })).toHaveLength(0);
  });
});
