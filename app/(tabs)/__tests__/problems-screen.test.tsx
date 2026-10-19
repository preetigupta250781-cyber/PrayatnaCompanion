import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { useProblems } from '@/features/problems';
import { EmptyState, ErrorState, ProblemCardSkeleton } from '@/shared/ui';

import ProblemsScreen from '../problems';

jest.mock('@/shared/hooks/use-server-now', () => ({
  useServerNow: jest.fn(() => new Date('2026-10-25T10:00:00.000Z')),
}));

jest.mock('@/features/problems', () => {
  const actual = jest.requireActual('@/features/problems');
  return {
    ...actual,
    useProblems: jest.fn(),
  };
});

describe('ProblemsScreen (Tabs)', () => {
  const mockUseProblems = useProblems as jest.Mock;
  const mockPush = jest.fn();
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
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

  it('renders ProblemCardSkeleton when loading', () => {
    mockUseProblems.mockReturnValue({
      problems: [],
      nextRelease: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      handleCountdownZero: jest.fn(),
    });

    renderer.act(() => {
      tree = renderer.create(<ProblemsScreen />);
    });

    const skeleton = tree!.root.findAllByType(ProblemCardSkeleton);
    expect(skeleton.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry button when error occurs', () => {
    const mockRefetch = jest.fn().mockResolvedValue([]);
    mockUseProblems.mockReturnValue({
      problems: [],
      nextRelease: null,
      isLoading: false,
      isError: true,
      error: {
        code: 'NETWORK_TIMEOUT',
        userMessage: 'Failed to load tracks. Please retry.',
        retryable: true,
      },
      refetch: mockRefetch,
      isRefetching: false,
      handleCountdownZero: jest.fn(),
    });

    renderer.act(() => {
      tree = renderer.create(<ProblemsScreen />);
    });

    const errorState = tree!.root.findByType(ErrorState);
    expect(errorState).toBeDefined();

    renderer.act(() => {
      errorState.props.onRetry();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  describe('No problems released handling', () => {
    it('renders EmptyState with message "Problem statements will appear here when released" when no problems released', () => {
      mockUseProblems.mockReturnValue({
        problems: [],
        nextRelease: null, // No upcoming release either
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        handleCountdownZero: jest.fn(),
      });

      renderer.act(() => {
        tree = renderer.create(<ProblemsScreen />);
      });

      const emptyState = tree!.root.findByType(EmptyState);
      expect(emptyState).toBeDefined();
      expect(emptyState.props.message).toBe('Problem statements will appear here when released');
      expect(emptyState.props.title).toBe('No Problems Released');
    });

    it('renders Locked countdown card above EmptyState when no problems released yet but next release is scheduled', () => {
      const nextReleaseTimestamp = '2026-10-25T18:00:00.000Z';
      mockUseProblems.mockReturnValue({
        problems: [],
        nextRelease: nextReleaseTimestamp,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        handleCountdownZero: jest.fn(),
      });

      renderer.act(() => {
        tree = renderer.create(<ProblemsScreen />);
      });

      // Locked countdown card must be rendered in empty state view
      const textNodes = tree!.root.findAllByType(Text);
      const allText = textNodes
        .map((n) => n.props.children)
        .flat()
        .join(' ');

      expect(allText).toContain('Next Problem Statement Unlocks In');
      expect(allText).toContain('Problem statements will appear here when released');
    });
  });

  it('renders released problem cards and navigates to detail screen when card is pressed', () => {
    const mockProblems = [
      {
        id: 'b1111111-0001-4000-a000-000000000001',
        code: 'PRB-AI-01',
        title: 'Emergency Dispatch Coordinator',
        description: 'AI model',
        domain: 'AI',
        difficulty: 'Hard',
        release_at: '2026-10-18T10:00:00.000Z',
        created_at: '2026-10-17T00:00:00.000Z',
      },
    ];

    mockUseProblems.mockReturnValue({
      problems: mockProblems,
      nextRelease: '2026-10-25T20:00:00.000Z',
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      handleCountdownZero: jest.fn(),
    });

    renderer.act(() => {
      tree = renderer.create(<ProblemsScreen />);
    });

    const textNodes = tree!.root.findAllByType(Text);
    const allText = textNodes
      .map((n) => n.props.children)
      .flat()
      .join(' ');

    expect(allText).toContain('PRB-AI-01');
    expect(allText).toContain('Emergency Dispatch Coordinator');
    expect(allText).toContain('Next Problem Statement Unlocks In');

    // Find ProblemCard and trigger navigation
    const problemCard = tree!.root.findByProps({ testID: 'problem-card-PRB-AI-01' });
    expect(problemCard).toBeDefined();

    renderer.act(() => {
      problemCard.props.onPress(mockProblems[0]);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/problems/[id]',
      params: { id: mockProblems[0]!.id },
    });
  });
});
