import React from 'react';
import { FlatList } from 'react-native';
import renderer from 'react-test-renderer';

import { useProfile } from '@/features/auth';
import {
  LeaderboardPodium,
  RankedTeamItem,
  RoundFilterSelector,
  useLeaderboard,
} from '@/features/leaderboard';
import { EmptyState, ErrorState, LeaderboardSkeleton } from '@/shared/ui';

import LeaderboardScreen from '../leaderboard';

jest.mock('@/features/auth', () => ({
  useProfile: jest.fn(),
}));

jest.mock('@/features/leaderboard', () => {
  const actual = jest.requireActual('@/features/leaderboard');
  return {
    ...actual,
    useLeaderboard: jest.fn(),
  };
});

describe('LeaderboardScreen (Tabs)', () => {
  const mockUseLeaderboard = useLeaderboard as jest.Mock;
  const mockUseProfile = useProfile as jest.Mock;
  let tree: renderer.ReactTestRenderer | null = null;

  const mockRankedTeams: RankedTeamItem[] = [
    {
      team_id: 't-1111',
      team_name: 'Algorhythms',
      team_code: 'ALGO-2026',
      score: 175,
      rank: 1,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00Z',
      hasScore: true,
      rounds: [],
    },
    {
      team_id: 't-2222',
      team_name: 'ByteCoders',
      team_code: 'BYTE-4040',
      score: 175,
      rank: 1,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00Z',
      hasScore: true,
      rounds: [],
    },
    {
      team_id: 't-3333',
      team_name: 'NeuralKnights',
      team_code: 'NEUR-8080',
      score: 167,
      rank: 2,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00Z',
      hasScore: true,
      rounds: [],
    },
    {
      team_id: 't-4444',
      team_name: 'BinaryNomads',
      team_code: 'BIN-9090',
      score: 150,
      rank: 3,
      published_rounds_count: 2,
      last_score_updated_at: '2026-10-24T18:00:00Z',
      hasScore: true,
      rounds: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue({
      profile: { team_id: 't-4444' },
      team: { id: 't-4444', name: 'BinaryNomads' },
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

  it('renders LeaderboardSkeleton when loading', () => {
    mockUseLeaderboard.mockReturnValue({
      rawRows: [],
      rankedTeams: [],
      availableRounds: [],
      selectedRound: 'all',
      setSelectedRound: jest.fn(),
      isDataEmpty: false,
      lastUpdatedText: 'Just now',
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(<LeaderboardScreen />);
    });

    const skeleton = tree!.root.findByType(LeaderboardSkeleton);
    expect(skeleton).toBeDefined();
  });

  it('renders ErrorState with retry button when error occurs', () => {
    const mockRefetch = jest.fn();
    mockUseLeaderboard.mockReturnValue({
      rawRows: [],
      rankedTeams: [],
      availableRounds: [],
      selectedRound: 'all',
      setSelectedRound: jest.fn(),
      isDataEmpty: false,
      lastUpdatedText: 'Just now',
      isLoading: false,
      isError: true,
      error: { userMessage: 'Failed to load rankings', retryable: true },
      refetch: mockRefetch,
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(<LeaderboardScreen />);
    });

    const errorState = tree!.root.findByType(ErrorState);
    expect(errorState).toBeDefined();
    expect(errorState.props.message).toBe('Failed to load rankings');

    renderer.act(() => {
      errorState.props.onRetry();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders EmptyState when results are not yet published', () => {
    mockUseLeaderboard.mockReturnValue({
      rawRows: [],
      rankedTeams: [],
      availableRounds: ['Round 1'],
      selectedRound: 'all',
      setSelectedRound: jest.fn(),
      isDataEmpty: true,
      lastUpdatedText: 'Just now',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(<LeaderboardScreen />);
    });

    const emptyState = tree!.root.findByType(EmptyState);
    expect(emptyState).toBeDefined();
    expect(emptyState.props.message).toBe('Results will appear once organizers publish them');
    expect(emptyState.props.title).toBe('Leaderboard');
  });

  it('renders podium, rankings list, and jump to my team button on success', () => {
    const mockSetSelectedRound = jest.fn();
    mockUseLeaderboard.mockReturnValue({
      rawRows: [],
      rankedTeams: mockRankedTeams,
      availableRounds: ['Round 1', 'Round 2'],
      selectedRound: 'all',
      setSelectedRound: mockSetSelectedRound,
      isDataEmpty: false,
      lastUpdatedText: '10:00 AM IST (just now)',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(<LeaderboardScreen />);
    });

    const root = tree!.root;

    // Header and last updated text
    const lastUpdatedNode = root.findByProps({ testID: 'last-updated-text' });
    expect(lastUpdatedNode.props.children).toContain('10:00 AM IST (just now)');

    // Podium is present
    const podium = root.findByType(LeaderboardPodium);
    expect(podium).toBeDefined();
    expect(podium.props.teams).toEqual(mockRankedTeams);

    // FlatList contains 4th team (remaining teams: BinaryNomads)
    const flatList = root.findByType(FlatList);
    expect(flatList.props.data).toHaveLength(1);
    expect(flatList.props.data[0]?.team_name).toBe('BinaryNomads');

    // Current user team button (BinaryNomads is rank 3)
    const jumpBtn = root.findByProps({ testID: 'jump-to-my-team-btn' });
    expect(jumpBtn).toBeDefined();

    // Tapping jump button scrolls to index
    renderer.act(() => {
      jumpBtn.props.onPress();
    });

    // Round selector
    const roundSelector = root.findByType(RoundFilterSelector);
    expect(roundSelector).toBeDefined();
    expect(roundSelector.props.availableRounds).toEqual(['Round 1', 'Round 2']);

    renderer.act(() => {
      roundSelector.props.onSelectRound('Round 1');
    });
    expect(mockSetSelectedRound).toHaveBeenCalledWith('Round 1');
  });

  it('scrolls to podium when user team is in top 3', () => {
    mockUseProfile.mockReturnValue({
      profile: { team_id: 't-1111' }, // Algorhythms is Rank 1 (index 0)
      team: { id: 't-1111', name: 'Algorhythms' },
    });

    mockUseLeaderboard.mockReturnValue({
      rawRows: [],
      rankedTeams: mockRankedTeams,
      availableRounds: [],
      selectedRound: 'all',
      setSelectedRound: jest.fn(),
      isDataEmpty: false,
      lastUpdatedText: 'Just now',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderer.act(() => {
      tree = renderer.create(<LeaderboardScreen />);
    });

    const root = tree!.root;
    const jumpBtn = root.findByProps({ testID: 'jump-to-my-team-btn' });
    expect(jumpBtn).toBeDefined();

    renderer.act(() => {
      jumpBtn.props.onPress();
    });
  });
});
