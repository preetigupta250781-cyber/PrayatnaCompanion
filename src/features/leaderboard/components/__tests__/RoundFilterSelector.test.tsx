import React from 'react';
import renderer from 'react-test-renderer';

import { Chip } from '@/shared/ui';

import { RoundFilterSelector } from '../RoundFilterSelector';

describe('RoundFilterSelector', () => {
  const availableRounds = ['Round 1: Architecture Review', 'Round 2: Prototype Implementation'];

  it('renders all rounds and "All Rounds" chip', () => {
    const onSelectMock = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(
        <RoundFilterSelector
          availableRounds={availableRounds}
          selectedRound="all"
          onSelectRound={onSelectMock}
        />
      );
    });

    const root = tree.root;
    const chips = root.findAllByType(Chip);
    expect(chips).toHaveLength(3);
    expect(chips[0]?.props.label).toBe('All Rounds');
    expect(chips[0]?.props.selected).toBe(true);
    expect(chips[1]?.props.label).toBe('Round 1: Architecture Review');
    expect(chips[1]?.props.selected).toBe(false);
  });

  it('calls onSelectRound with "all" when All Rounds is tapped', () => {
    const onSelectMock = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(
        <RoundFilterSelector
          availableRounds={availableRounds}
          selectedRound="Round 1: Architecture Review"
          onSelectRound={onSelectMock}
        />
      );
    });

    const root = tree.root;
    const allChip = root.findAllByType(Chip)[0];
    expect(allChip).toBeDefined();

    renderer.act(() => {
      allChip?.props.onPress();
    });

    expect(onSelectMock).toHaveBeenCalledWith('all');
  });

  it('calls onSelectRound with selected round name when a round chip is tapped', () => {
    const onSelectMock = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(
        <RoundFilterSelector
          availableRounds={availableRounds}
          selectedRound="all"
          onSelectRound={onSelectMock}
        />
      );
    });

    const root = tree.root;
    const round1Chip = root.findAllByType(Chip)[1];
    expect(round1Chip).toBeDefined();

    renderer.act(() => {
      round1Chip?.props.onPress();
    });

    expect(onSelectMock).toHaveBeenCalledWith('Round 1: Architecture Review');
  });
});
