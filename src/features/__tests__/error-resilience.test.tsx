import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import renderer from 'react-test-renderer';
import { z } from 'zod';

import LeaderboardScreen from '@/../app/(tabs)/leaderboard';
import ProblemsScreen from '@/../app/(tabs)/problems';
import ScheduleScreen from '@/../app/(tabs)/schedule';
import AnnouncementsScreen from '@/../app/announcements';
import BusRoutesListScreen from '@/../app/bus/index';
import ProblemDetailScreen from '@/../app/problems/[id]';
import { useAnnouncements } from '@/features/announcements';
import { useProfile } from '@/features/auth';
import { useBusRoutes } from '@/features/bus';
import { useLeaderboard } from '@/features/leaderboard';
import { useProblemDetail, useProblems } from '@/features/problems';
import { useSchedule } from '@/features/schedule';
import { AppError, mapToAppError } from '@/shared/lib/errors';
import { ErrorState } from '@/shared/ui';

// Mock feature hooks
jest.mock('@/features/schedule/hooks/use-schedule');
jest.mock('@/features/problems/hooks/use-problems');
jest.mock('@/features/problems/hooks/use-problem-detail');
jest.mock('@/features/leaderboard/hooks/use-leaderboard');
jest.mock('@/features/announcements/hooks/use-announcements');
jest.mock('@/features/bus/hooks/use-bus-routes');
jest.mock('@/features/auth/hooks/use-profile');

// Mock router navigation
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'mock-problem-id' }),
  useSegments: () => ['(tabs)'],
}));

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

describe('App-Wide Error Resilience & Fault Tolerance', () => {
  let queryClient: QueryClient;
  let tree: renderer.ReactTestRenderer | null = null;

  const mockUseSchedule = useSchedule as jest.Mock;
  const mockUseProblems = useProblems as jest.Mock;
  const mockUseProblemDetail = useProblemDetail as jest.Mock;
  const mockUseLeaderboard = useLeaderboard as jest.Mock;
  const mockUseAnnouncements = useAnnouncements as jest.Mock;
  const mockUseBusRoutes = useBusRoutes as jest.Mock;
  const mockUseProfile = useProfile as jest.Mock;

  // Error simulation factories
  const create500Error = (): AppError =>
    mapToAppError({ status: 500, message: 'Internal Server Error' });

  const createTimeoutError = (): AppError =>
    mapToAppError(new Error('Connection timed out while fetching from Supabase'));

  const createMalformedPayloadError = (): AppError => {
    const TestSchema = z.object({
      id: z.string().uuid(),
      expectedField: z.string(),
    });
    try {
      TestSchema.parse({ id: 'invalid-uuid', unexpected: 123 });
      throw new Error('Should have failed parsing');
    } catch (err) {
      return mapToAppError(err);
    }
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue({
      profile: { id: 'user-1', full_name: 'Test Participant', role: 'participant', team_id: null },
      team: null,
      isLoading: false,
      isError: false,
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

  describe('Schedule Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseSchedule.mockReturnValue({
          events: [],
          isLoading: false,
          isError: true,
          error,
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
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        // Verify message is populated without crashing
        expect(root.findByProps({ children: error.userMessage })).toBeTruthy();

        // Verify working retry button
        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Problems Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseProblems.mockReturnValue({
          problems: [],
          nextRelease: null,
          isLoading: false,
          isError: true,
          error,
          refetch: mockRefetch,
          isRefetching: false,
          handleCountdownZero: jest.fn(),
        });

        renderer.act(() => {
          tree = renderer.create(
            <QueryClientProvider client={queryClient}>
              <ProblemsScreen />
            </QueryClientProvider>
          );
        });

        const root = tree!.root;
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Problem Detail Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseProblemDetail.mockReturnValue({
          problem: null,
          isLoading: false,
          isError: true,
          error,
          refetch: mockRefetch,
          isRefetching: false,
        });

        renderer.act(() => {
          tree = renderer.create(
            <QueryClientProvider client={queryClient}>
              <ProblemDetailScreen />
            </QueryClientProvider>
          );
        });

        const root = tree!.root;
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Leaderboard Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseLeaderboard.mockReturnValue({
          rankedTeams: [],
          availableRounds: [],
          selectedRound: 'all',
          setSelectedRound: jest.fn(),
          isDataEmpty: false,
          lastUpdatedText: 'Never',
          isLoading: false,
          isError: true,
          error,
          refetch: mockRefetch,
          isRefetching: false,
        });

        renderer.act(() => {
          tree = renderer.create(
            <QueryClientProvider client={queryClient}>
              <LeaderboardScreen />
            </QueryClientProvider>
          );
        });

        const root = tree!.root;
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Announcements Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseAnnouncements.mockReturnValue({
          announcements: [],
          isLoading: false,
          isError: true,
          error,
          refetch: mockRefetch,
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
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Bus Routes Screen Fault Resilience', () => {
    const failureScenarios = [
      { name: 'Supabase 500 Server Error', error: create500Error() },
      { name: 'Supabase Network Timeout', error: createTimeoutError() },
      { name: 'Malformed Schema Payload', error: createMalformedPayloadError() },
    ];

    failureScenarios.forEach(({ name, error }) => {
      it(`gracefully recovers from ${name} and provides working retry`, () => {
        const mockRefetch = jest.fn();
        mockUseBusRoutes.mockReturnValue({
          routes: [],
          isLoading: false,
          isError: true,
          error,
          refetch: mockRefetch,
          isRefetching: false,
        });

        renderer.act(() => {
          tree = renderer.create(
            <QueryClientProvider client={queryClient}>
              <BusRoutesListScreen />
            </QueryClientProvider>
          );
        });

        const root = tree!.root;
        const errorState = root.findByType(ErrorState);
        expect(errorState).toBeDefined();

        const retryButton = errorState.findByType(TouchableOpacity);
        renderer.act(() => {
          retryButton.props.onPress();
        });
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
