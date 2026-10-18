import React from 'react';
import renderer from 'react-test-renderer';

import type { ProfileWithTeam } from '../../types';
import { ProfileCard } from '../ProfileCard';

describe('ProfileCard Component', () => {
  let root: renderer.ReactTestRenderer | null = null;

  afterEach(() => {
    if (root) {
      renderer.act(() => {
        root?.unmount();
      });
      root = null;
    }
  });

  const sampleParticipant: ProfileWithTeam = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    full_name: 'Aarav Sharma',
    email: 'aarav@medicaps.ac.in',
    college: 'Medi-Caps University',
    city: 'Indore',
    phone: '+919876543210',
    team_id: 'team-1',
    role: 'participant',
    created_at: '2026-10-18T00:00:00.000Z',
    team: {
      id: 'team-1',
      name: 'Binary Beasts',
      team_code: 'BB100',
      created_at: '2026-10-18T00:00:00.000Z',
    },
  };

  it('renders participant profile information and team details accurately', () => {
    renderer.act(() => {
      root = renderer.create(<ProfileCard profile={sampleParticipant} />);
    });

    const treeStr = JSON.stringify(root?.toJSON());
    expect(treeStr).toContain('Aarav Sharma');
    expect(treeStr).toContain('PARTICIPANT');
    expect(treeStr).toContain('Medi-Caps University');
    expect(treeStr).toContain('Indore');
    expect(treeStr).toContain('Binary Beasts');
    expect(treeStr).toContain('CODE: BB100');
  });

  it('renders organizer badge and handles profile without team', () => {
    const organizerProfile: ProfileWithTeam = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      full_name: 'Professor Rao',
      email: 'rao@medicaps.ac.in',
      college: 'Medi-Caps University',
      city: null,
      phone: null,
      team_id: null,
      role: 'organizer',
      created_at: '2026-10-18T00:00:00.000Z',
      team: null,
    };

    renderer.act(() => {
      root = renderer.create(<ProfileCard profile={organizerProfile} />);
    });

    const treeStr = JSON.stringify(root?.toJSON());
    expect(treeStr).toContain('Professor Rao');
    expect(treeStr).toContain('ORGANIZER');
    expect(treeStr).toContain('No Team Assigned');
  });

  it('handles profile with missing optional fields gracefully', () => {
    const minimalProfile: ProfileWithTeam = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      full_name: null,
      email: null,
      college: null,
      city: null,
      phone: null,
      team_id: 'team-2',
      role: 'participant',
      created_at: '2026-10-18T00:00:00.000Z',
      team: {
        id: 'team-2',
        name: 'Byte Force',
        team_code: 'BF200',
        created_at: '2026-10-18T00:00:00.000Z',
      },
    };

    renderer.act(() => {
      root = renderer.create(<ProfileCard profile={minimalProfile} />);
    });

    const treeStr = JSON.stringify(root?.toJSON());
    expect(treeStr).toContain('Participant');
    expect(treeStr).toContain('Byte Force');
  });
});
