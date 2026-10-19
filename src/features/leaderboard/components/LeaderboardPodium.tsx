import React from 'react';
import { StyleSheet, View } from 'react-native';

import { RankedTeamItem } from '../types';
import { LeaderboardPodiumSlot } from './LeaderboardPodiumSlot';

export interface LeaderboardPodiumProps {
  teams: RankedTeamItem[];
  userTeamId?: string | null;
  testID?: string;
}

export function LeaderboardPodium({
  teams,
  userTeamId,
  testID = 'leaderboard-podium',
}: LeaderboardPodiumProps): React.JSX.Element {
  // Top 3 positions:
  // teams[0] -> 1st Place (Center)
  // teams[1] -> 2nd Place (Left)
  // teams[2] -> 3rd Place (Right)
  const first = teams[0] ?? null;
  const second = teams[1] ?? null;
  const third = teams[2] ?? null;

  return (
    <View style={styles.container} testID={testID}>
      {/* 2nd Place (Silver - Left) */}
      <LeaderboardPodiumSlot
        team={second}
        position={2}
        isUserTeam={Boolean(second && userTeamId && second.team_id === userTeamId)}
        testID="podium-slot-2"
      />

      {/* 1st Place (Gold - Center) */}
      <LeaderboardPodiumSlot
        team={first}
        position={1}
        isUserTeam={Boolean(first && userTeamId && first.team_id === userTeamId)}
        testID="podium-slot-1"
      />

      {/* 3rd Place (Bronze - Right) */}
      <LeaderboardPodiumSlot
        team={third}
        position={3}
        isUserTeam={Boolean(third && userTeamId && third.team_id === userTeamId)}
        testID="podium-slot-3"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    minHeight: 220,
  },
});
