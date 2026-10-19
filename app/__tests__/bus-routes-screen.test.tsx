import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { BUS_NOTICE_TEXT, BusRouteCard, useBusRoutes } from '@/features/bus';
import { BusRouteListSkeleton, EmptyState, ErrorState } from '@/shared/ui';

import BusRoutesListScreen from '../bus/index';

jest.mock('@/features/bus/hooks/use-bus-routes');

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

describe('BusRoutesListScreen (app/bus/index.tsx)', () => {
  const mockUseBusRoutes = useBusRoutes as jest.Mock;
  const mockBack = jest.fn();
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();

  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
      canGoBack: jest.fn().mockReturnValue(true),
      replace: jest.fn(),
    });
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    queryClient.clear();
  });

  it('renders BusRouteListSkeleton while loading', () => {
    mockUseBusRoutes.mockReturnValue({
      routes: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const skeleton = tree!.root.findAllByType(BusRouteListSkeleton);
    expect(skeleton.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry button on error', () => {
    mockUseBusRoutes.mockReturnValue({
      routes: [],
      isLoading: false,
      isError: true,
      error: { userMessage: 'Could not connect to bus routes database' },
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const errorState = tree!.root.findByType(ErrorState);
    expect(errorState).toBeDefined();

    // Trigger retry
    act(() => {
      errorState.props.onRetry();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders EmptyState when 0 routes exist', () => {
    mockUseBusRoutes.mockReturnValue({
      routes: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const emptyState = tree!.root.findByType(EmptyState);
    expect(emptyState).toBeDefined();
    expect(emptyState.props.title).toBe('No Bus Routes');
  });

  it('renders route list with name, origin city, departure time, and static notice banner', () => {
    const mockRoutes = [
      {
        id: 'b1111111-0001-4000-a000-000000000001',
        name: 'Indore City Transit Express',
        description: 'Connecting central Indore',
        color: '#00F0FF',
        origin_city: 'Indore',
        departs_at: '2026-10-24T02:00:00.000Z',
        sort_order: 1,
      },
    ];

    mockUseBusRoutes.mockReturnValue({
      routes: mockRoutes,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;

    // Verify static disclaimer banner
    expect(root.findByProps({ children: BUS_NOTICE_TEXT })).toBeTruthy();

    // Verify route card components
    const routeCards = root.findAllByType(BusRouteCard);
    expect(routeCards).toHaveLength(1);
    expect(routeCards[0]?.props.route.name).toBe('Indore City Transit Express');

    // Verify elements rendered
    expect(root.findByProps({ children: 'Indore City Transit Express' })).toBeTruthy();
    expect(root.findByProps({ children: '🕒 Departs at 07:30 AM' })).toBeTruthy();
  });

  it('navigates to route detail on card press', () => {
    const mockRoutes = [
      {
        id: 'b1111111-0001-4000-a000-000000000001',
        name: 'Indore City Transit Express',
        description: 'Connecting central Indore',
        color: '#00F0FF',
        origin_city: 'Indore',
        departs_at: '2026-10-24T02:00:00.000Z',
        sort_order: 1,
      },
    ];

    mockUseBusRoutes.mockReturnValue({
      routes: mockRoutes,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const routeCard = tree!.root.findByProps({
      testID: 'bus-route-card-b1111111-0001-4000-a000-000000000001',
    });

    act(() => {
      routeCard.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/bus/b1111111-0001-4000-a000-000000000001');
  });

  it('navigates back when back button is pressed', () => {
    mockUseBusRoutes.mockReturnValue({
      routes: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRoutesListScreen />
        </QueryClientProvider>
      );
    });

    const backButton = tree!.root.findByProps({ accessibilityLabel: 'Go back' });
    act(() => {
      backButton.props.onPress();
    });

    expect(mockBack).toHaveBeenCalled();
  });
});
