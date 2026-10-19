import React from 'react';
import renderer from 'react-test-renderer';

import { Badge, Text } from '@/shared/ui';

import { RankedTeamItem } from '../../types';
import { LeaderboardRowItem } from '../LeaderboardRowItem';

describe('LeaderboardRowItem', () => {
  const mockTeam: RankedTeamItem = {
    team_id: 't-4',
    team_name: 'BinaryNomads',
    team_code: 'BIN-101',
    score: 150,
    rank: 4,
    published_rounds_count: 2,
    last_score_updated_at: null,
    hasScore: true,
    rounds: [],
    rankDelta: 2,
  };

  it('renders rank, team name, team code, and score', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardRowItem team={mockTeam} isUserTeam={false} />);
    });

    const root = tree.root;
    const allTexts = root.findAllByType(Text);
    const textContents = allTexts.map((t) => t.props.children).flat();

    expect(textContents).toContain('#4');
    expect(textContents).toContain('BinaryNomads');
    expect(textContents).toContain('BIN-101');
    expect(textContents).toContain(150);
  });

  it('displays rank increase delta indicator (▲ +2)', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardRowItem team={mockTeam} isUserTeam={false} />);
    });

    const root = tree.root;
    const deltaElement = root.findByProps({ testID: 'rank-delta-t-4' });
    expect(deltaElement.props.children).toBe('▲ +2');
  });

  it('displays rank decrease delta indicator (▼ -1)', () => {
    const demotedTeam: RankedTeamItem = {
      ...mockTeam,
      rankDelta: -1,
    };

    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardRowItem team={demotedTeam} isUserTeam={false} />);
    });

    const root = tree.root;
    const deltaElement = root.findByProps({ testID: 'rank-delta-t-4' });
    expect(deltaElement.props.children).toBe('▼ -1');
  });

  it('renders YOU badge when isUserTeam is true', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardRowItem team={mockTeam} isUserTeam={true} />);
    });

    const root = tree.root;
    const youBadge = root.findByType(Badge);
    expect(youBadge.props.label).toBe('YOU');
  });

  it('omits YOU badge when isUserTeam is false', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardRowItem team={mockTeam} isUserTeam={false} />);
    });

    const root = tree.root;
    const badges = root.findAllByType(Badge);
    expect(badges).toHaveLength(0);
  });
});
