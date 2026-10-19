import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { useProblemDetail } from '@/features/problems';
import { EmptyState, ErrorState } from '@/shared/ui';

import ProblemDetailScreen from '../problems/[id]';

jest.mock('@/features/problems', () => {
  const actual = jest.requireActual('@/features/problems');
  return {
    ...actual,
    useProblemDetail: jest.fn(),
  };
});

describe('ProblemDetailScreen', () => {
  const mockUseProblemDetail = useProblemDetail as jest.Mock;
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: jest.fn(),
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'b1111111-0001-4000-a000-000000000001',
    });
  });

  it('renders problem details, metadata badges, and markdown description', () => {
    const mockProblem = {
      id: 'b1111111-0001-4000-a000-000000000001',
      code: 'PRB-AI-01',
      title: 'Autonomous Multi-Modal Emergency Dispatch Routing',
      description:
        '### System Objective\nBuild a decentralized dispatch engine with **50ms latency**.',
      domain: 'Artificial Intelligence',
      difficulty: 'Hard',
      release_at: '2026-10-18T10:00:00.000Z',
      created_at: '2026-10-17T00:00:00.000Z',
    };

    mockUseProblemDetail.mockReturnValue({
      problem: mockProblem,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(<ProblemDetailScreen />);
    });

    const root = tree!.root;
    const textNodes = root.findAllByType(Text);
    const allText = textNodes
      .map((n) => n.props.children)
      .flat()
      .join(' ');

    expect(allText).toContain('PRB-AI-01');
    expect(allText).toContain('Autonomous Multi-Modal Emergency Dispatch Routing');
    expect(allText).toContain('Artificial Intelligence');
    expect(allText).toContain('Hard');
    expect(allText).toContain('Released:');
    expect(allText).toContain('System Objective');
    expect(allText).toContain('50ms latency');
  });

  it('invokes router.back() when Back button is tapped', () => {
    mockUseProblemDetail.mockReturnValue({
      problem: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(<ProblemDetailScreen />);
    });

    const backButton = tree!.root.findByProps({ accessibilityLabel: 'Go back' });
    expect(backButton).toBeDefined();

    act(() => {
      backButton.props.onPress();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState when problem is not found', () => {
    mockUseProblemDetail.mockReturnValue({
      problem: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(<ProblemDetailScreen />);
    });

    const emptyState = tree!.root.findByType(EmptyState);
    expect(emptyState).toBeDefined();
    expect(emptyState.props.title).toBe('Problem Not Found');
  });

  it('renders ErrorState with retry when query fails', () => {
    const mockRefetch = jest.fn();
    mockUseProblemDetail.mockReturnValue({
      problem: null,
      isLoading: false,
      isError: true,
      error: { code: 'NETWORK_TIMEOUT', userMessage: 'Failed to load details' },
      refetch: mockRefetch,
      isRefetching: false,
    });

    let tree: renderer.ReactTestRenderer | null = null;
    act(() => {
      tree = renderer.create(<ProblemDetailScreen />);
    });

    const errorState = tree!.root.findByType(ErrorState);
    expect(errorState).toBeDefined();

    act(() => {
      errorState.props.onRetry();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
