import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

import { Card } from '@/shared/ui';

import { ProblemStatement } from '../../types';
import { ProblemCard } from '../ProblemCard';

describe('ProblemCard', () => {
  const mockProblem: ProblemStatement = {
    id: 'b1111111-0001-4000-a000-000000000001',
    code: 'PRB-AI-01',
    title: 'Autonomous Multi-Modal Emergency Dispatch Routing',
    description:
      'Design a real-time dispatch coordinator that prioritizes emergency calls based on acoustic analysis and computes dynamic traffic routes.',
    domain: 'Artificial Intelligence',
    difficulty: 'Hard',
    release_at: '2026-10-18T10:00:00.000Z',
    created_at: '2026-10-17T00:00:00.000Z',
  };

  it('renders code badge, domain chip, difficulty badge, title, and description excerpt', () => {
    const onPress = jest.fn();
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(
        <ProblemCard problem={mockProblem} onPress={onPress} testID="test-card" />
      );
    });

    const root = tree!.root;
    const textNodes = root.findAllByType(Text);
    const allText = textNodes
      .map((n) => n.props.children)
      .flat()
      .join(' ');

    expect(allText).toContain('PRB-AI-01');
    expect(allText).toContain('Artificial Intelligence');
    expect(allText).toContain('Hard');
    expect(allText).toContain('Autonomous Multi-Modal Emergency Dispatch Routing');
    expect(allText).toContain('Design a real-time dispatch coordinator');
    expect(allText).toContain('View Details & Requirements →');
  });

  it('invokes onPress callback with problem data when Card is pressed', () => {
    const onPress = jest.fn();
    let tree: renderer.ReactTestRenderer | null = null;
    renderer.act(() => {
      tree = renderer.create(
        <ProblemCard problem={mockProblem} onPress={onPress} testID="test-card" />
      );
    });

    const card = tree!.root.findByType(Card);
    card.props.onPress();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(mockProblem);
  });
});
