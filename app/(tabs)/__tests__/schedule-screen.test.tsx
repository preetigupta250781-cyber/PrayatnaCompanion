import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import renderer from 'react-test-renderer';

import { useSchedule } from '@/features/schedule';

import ScheduleScreen from '../schedule';

jest.mock('@/features/schedule/hooks/use-schedule');

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

describe('ScheduleScreen (app/(tabs)/schedule.tsx)', () => {
  const mockUseSchedule = useSchedule as jest.Mock;
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

  it('renders ScheduleSkeleton while loading', () => {
    mockUseSchedule.mockReturnValue({
      events: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'Schedule' })).toBeTruthy();
  });

  it('renders ErrorState with retry button when query fails', () => {
    const mockRefetch = jest.fn();
    mockUseSchedule.mockReturnValue({
      events: [],
      isLoading: false,
      isError: true,
      error: {
        code: 'NETWORK_ERROR',
        userMessage: 'Failed to fetch schedule events',
        retryable: true,
      },
      refetch: mockRefetch,
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'Something went wrong' })).toBeTruthy();

    const retryBtn = root.findByProps({ accessibilityRole: 'button' });
    expect(retryBtn).toBeTruthy();
    renderer.act(() => {
      retryBtn.props.onPress();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders EmptyState when no events exist at all', () => {
    mockUseSchedule.mockReturnValue({
      events: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'No Events Scheduled' })).toBeTruthy();
  });

  it('renders timeline events and day selector tabs', () => {
    const mockEvents = [
      {
        id: 'ev-1',
        title: 'Opening Ceremony',
        description: 'Welcome keynote',
        location: 'Hall A',
        event_type: 'ceremony',
        starts_at: '2026-10-18T04:00:00.000Z',
        ends_at: '2026-10-18T05:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      },
      {
        id: 'ev-2',
        title: 'Day 2 Judging',
        description: 'Final review',
        location: 'Lab 1',
        event_type: 'judging',
        starts_at: '2026-10-19T06:00:00.000Z',
        ends_at: '2026-10-19T08:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      },
    ];

    mockUseSchedule.mockReturnValue({
      events: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ScheduleScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    // Both events should be present in 'All Days'
    expect(root.findByProps({ children: 'Opening Ceremony' })).toBeTruthy();
    expect(root.findByProps({ children: 'Day 2 Judging' })).toBeTruthy();

    // Day tabs should be present
    expect(root.findByProps({ label: 'All Days' })).toBeTruthy();
    expect(root.findByProps({ label: 'Day 1' })).toBeTruthy();
    expect(root.findByProps({ label: 'Day 2' })).toBeTruthy();
  });
});
