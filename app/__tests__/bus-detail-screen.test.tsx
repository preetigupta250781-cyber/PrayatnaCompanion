import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { useBusRouteDetail } from '@/features/bus';
import { EmptyState, ErrorState } from '@/shared/ui';

import BusRouteDetailScreen from '../bus/[routeId]';

jest.mock('@/features/bus/hooks/use-bus-route-detail');

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

describe('BusRouteDetailScreen (app/bus/[routeId].tsx)', () => {
  const mockUseBusRouteDetail = useBusRouteDetail as jest.Mock;
  const mockBack = jest.fn();
  const mockRefetch = jest.fn();

  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  const mockRoute = {
    id: 'b1111111-0001-4000-a000-000000000001',
    name: 'Indore City Transit Express',
    description: 'High-frequency circuit',
    color: '#00F0FF',
    origin_city: 'Indore',
    departs_at: '2026-10-24T02:00:00.000Z',
    sort_order: 1,
  };

  const mockStops = [
    {
      id: 'c1111111-0001-4000-a000-000000000001',
      route_id: 'b1111111-0001-4000-a000-000000000001',
      name: 'Rajwada Historical Gate',
      latitude: 22.7186,
      longitude: 75.855,
      stop_order: 1,
      scheduled_time: '2026-10-24T02:00:00.000Z',
      notes: 'Opposite palace arch',
    },
    {
      id: 'c1111111-0002-4000-a000-000000000002',
      route_id: 'b1111111-0001-4000-a000-000000000001',
      name: 'Indore Junction Circle',
      latitude: 22.7195,
      longitude: 75.867,
      stop_order: 2,
      scheduled_time: '2026-10-24T02:15:00.000Z',
      notes: 'Platform 1 portico',
    },
  ];

  const mockPath = {
    id: 'd1111111-0001-4000-a000-000000000001',
    route_id: 'b1111111-0001-4000-a000-000000000001',
    points: [
      { lat: 22.7186, lng: 75.855 },
      { lat: 22.7195, lng: 75.867 },
    ],
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      canGoBack: jest.fn().mockReturnValue(true),
      replace: jest.fn(),
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      routeId: 'b1111111-0001-4000-a000-000000000001',
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

  it('renders loading skeleton while fetching route detail', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    // Skeleton should be active and no main map view rendered yet
    expect(tree!.root.findAllByProps({ testID: 'bus-route-map-view' })).toHaveLength(0);
  });

  it('renders ErrorState with retry callback when query fails', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: null,
      isLoading: false,
      isError: true,
      error: { userMessage: 'Failed to retrieve route details' },
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const errorState = tree!.root.findByType(ErrorState);
    expect(errorState).toBeDefined();
    expect(errorState.props.message).toBe('Failed to retrieve route details');

    act(() => {
      errorState.props.onRetry();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders EmptyState when route is null / not found', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const emptyState = tree!.root.findByType(EmptyState);
    expect(emptyState).toBeDefined();
    expect(emptyState.props.title).toBe('Route Not Found');
  });

  it('handles route with ZERO stops safely without crashing', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: [],
        path: null,
        validStops: [],
        validPathCoordinates: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'Indore City Transit Express' })).toBeTruthy();
    expect(
      root.findByProps({
        children: 'No scheduled stops have been configured for this route yet.',
      })
    ).toBeTruthy();

    // MapView is rendered without crashing
    const mapView = root.findByProps({ testID: 'bus-route-map-view' });
    expect(mapView).toBeDefined();
  });

  it('filters invalid coordinates so only valid stop markers are rendered on MapView', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: mockStops, // 2 total stops
        path: mockPath,
        validStops: [mockStops[0]], // only 1 stop has valid coordinates
        validPathCoordinates: [{ latitude: 22.7186, longitude: 75.855 }],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const firstStop = mockStops[0]!;
    const secondStop = mockStops[1]!;

    // Valid stop marker is rendered
    const marker = tree!.root.findByProps({ testID: `bus-stop-marker-${firstStop.id}` });
    expect(marker).toBeDefined();

    // Invalid stop marker was filtered out and is not rendered
    const invalidMarker = tree!.root.findAllByProps({
      testID: `bus-stop-marker-${secondStop.id}`,
    });
    expect(invalidMarker).toHaveLength(0);
  });

  it('animates map to stop region when a stop is selected in timeline', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: mockStops,
        path: mockPath,
        validStops: mockStops,
        validPathCoordinates: [
          { latitude: 22.7186, longitude: 75.855 },
          { latitude: 22.7195, longitude: 75.867 },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const firstStop = mockStops[0]!;
    const stopItem = tree!.root.findByProps({
      testID: `bus-stop-item-${firstStop.id}`,
    });

    act(() => {
      stopItem.props.onPress();
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'SELECTED STOP' })).toBeTruthy();
    expect(root.findAllByProps({ children: 'Rajwada Historical Gate' }).length).toBeGreaterThan(0);
  });

  it('opens Google Maps when "Open in Google Maps" button is pressed', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: mockStops,
        path: mockPath,
        validStops: mockStops,
        validPathCoordinates: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const firstStop = mockStops[0]!;
    const mapsButton = tree!.root.findByProps({
      accessibilityLabel: `Open ${firstStop.name} in Google Maps`,
    });

    await act(async () => {
      mapsButton.props.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith(
      `https://www.google.com/maps/search/?api=1&query=${firstStop.latitude},${firstStop.longitude}`
    );
  });

  it('falls back to stop list only when MapView reports error', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: mockStops,
        path: mockPath,
        validStops: mockStops,
        validPathCoordinates: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const errorTrigger = tree!.root.findByProps({ testID: 'bus-map-error-trigger' });

    // Trigger error fallback on MapView
    act(() => {
      errorTrigger.props.onPress();
    });

    const root = tree!.root;
    expect(root.findByProps({ children: 'TRANSIT MAP UNAVAILABLE' })).toBeTruthy();
    expect(
      root.findByProps({
        children:
          'Interactive map could not be loaded. Displaying complete scheduled stop list below.',
      })
    ).toBeTruthy();
    // Stops list remains available
    expect(root.findByProps({ children: 'Rajwada Historical Gate' })).toBeTruthy();
  });

  it('toggles bottom sheet stops list', () => {
    mockUseBusRouteDetail.mockReturnValue({
      routeDetail: {
        route: mockRoute,
        stops: mockStops,
        path: mockPath,
        validStops: mockStops,
        validPathCoordinates: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    act(() => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <BusRouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const viewStopsBtn = tree!.root.findByProps({
      accessibilityLabel: 'View all stops list',
    });

    act(() => {
      viewStopsBtn.props.onPress();
    });

    const bottomSheet = tree!.root.findByProps({
      accessibilityLabel: 'Bus Stops Sheet',
    });
    expect(bottomSheet.props.visible).toBe(true);

    // Close bottom sheet
    act(() => {
      bottomSheet.props.onClose();
    });
    expect(bottomSheet.props.visible).toBe(false);
  });
});
