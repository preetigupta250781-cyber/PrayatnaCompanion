import React from 'react';
import renderer from 'react-test-renderer';

import { RankedTeamItem } from '../../types';
import { LeaderboardPodium } from '../LeaderboardPodium';
import { LeaderboardPodiumSlot } from '../LeaderboardPodiumSlot';

describe('LeaderboardPodium', () => {
  const mockTeams: RankedTeamItem[] = [
    {
      team_id: 't-1',
      team_name: 'Algorhythms',
      team_code: 'ALGO-2026',
      score: 175,
      rank: 1,
      published_rounds_count: 2,
      last_score_updated_at: null,
      hasScore: true,
      rounds: [],
    },
    {
      team_id: 't-2',
      team_name: 'ByteCoders',
      team_code: 'BYTE-4040',
      score: 175,
      rank: 1,
      published_rounds_count: 2,
      last_score_updated_at: null,
      hasScore: true,
      rounds: [],
    },
    {
      team_id: 't-3',
      team_name: 'NeuralKnights',
      team_code: 'NEUR-8080',
      score: 167,
      rank: 2,
      published_rounds_count: 2,
      last_score_updated_at: null,
      hasScore: true,
      rounds: [],
    },
  ];

  it('renders top 3 podium slots with team names and scores', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardPodium teams={mockTeams} userTeamId="t-999" />);
    });

    const root = tree.root;
    const slots = root.findAllByType(LeaderboardPodiumSlot);
    expect(slots).toHaveLength(3);

    // Slot 1 (Position 2 / Left): ByteCoders
    expect(slots[0]?.props.position).toBe(2);
    expect(slots[0]?.props.team?.team_name).toBe('ByteCoders');

    // Slot 2 (Position 1 / Center): Algorhythms
    expect(slots[1]?.props.position).toBe(1);
    expect(slots[1]?.props.team?.team_name).toBe('Algorhythms');

    // Slot 3 (Position 3 / Right): NeuralKnights
    expect(slots[2]?.props.position).toBe(3);
    expect(slots[2]?.props.team?.team_name).toBe('NeuralKnights');
  });

  it('highlights current user team with isUserTeam on podium', () => {
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardPodium teams={mockTeams} userTeamId="t-1" />);
    });

    const root = tree.root;
    const slots = root.findAllByType(LeaderboardPodiumSlot);

    // Center slot (Position 1) is Algorhythms (t-1)
    expect(slots[1]?.props.isUserTeam).toBe(true);
    // Left slot (Position 2) is ByteCoders (t-2)
    expect(slots[0]?.props.isUserTeam).toBe(false);
  });

  it('renders gracefully with fewer than 3 teams', () => {
    const singleTeam: RankedTeamItem[] = [mockTeams[0]!];
    let tree!: renderer.ReactTestRenderer;

    renderer.act(() => {
      tree = renderer.create(<LeaderboardPodium teams={singleTeam} userTeamId={null} />);
    });

    const root = tree.root;
    const slots = root.findAllByType(LeaderboardPodiumSlot);
    expect(slots).toHaveLength(3);

    // Center has team
    expect(slots[1]?.props.team?.team_name).toBe('Algorhythms');
    // Left and right slots have null team
    expect(slots[0]?.props.team).toBeNull();
    expect(slots[2]?.props.team).toBeNull();
  });
});
