import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Text } from '@/shared/ui';

import { RankedTeamItem } from '../types';

export interface LeaderboardPodiumSlotProps {
  team: RankedTeamItem | null;
  position: 1 | 2 | 3; // 1 = Gold/Center, 2 = Silver/Left, 3 = Bronze/Right
  isUserTeam?: boolean;
  testID?: string;
}

const PODIUM_CONFIG = {
  1: {
    height: 125,
    avatarSize: 52,
    badgeBg: '#FFD700',
    badgeText: '#000000',
    label: '1st',
    order: 2, // flex order in column
  },
  2: {
    height: 95,
    avatarSize: 44,
    badgeBg: '#C0C0C0',
    badgeText: '#000000',
    label: '2nd',
    order: 1,
  },
  3: {
    height: 75,
    avatarSize: 44,
    badgeBg: '#CD7F32',
    badgeText: '#FFFFFF',
    label: '3rd',
    order: 3,
  },
} as const;

export function LeaderboardPodiumSlot({
  team,
  position,
  isUserTeam = false,
  testID,
}: LeaderboardPodiumSlotProps): React.JSX.Element {
  const theme = useAppTheme();
  const config = PODIUM_CONFIG[position];

  const assignedRank = team ? team.rank : position;
  const rankLabel = `#${assignedRank}`;

  return (
    <View
      style={styles.container}
      testID={testID ?? `podium-slot-${position}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        team
          ? `${config.label} place: ${team.team_name}, Rank ${team.rank}, Score: ${team.score} points${
              isUserTeam ? ', Your team' : ''
            }`
          : `Empty ${config.label} place slot`
      }
    >
      {/* Team Details on Top of Podium */}
      <View style={styles.avatarSection}>
        {isUserTeam && (
          <Badge
            label="YOU"
            variant="accent"
            size="sm"
            style={styles.youBadge}
            testID={`podium-you-badge-${position}`}
          />
        )}

        {/* Circular Medal / Rank Avatar */}
        <View
          style={[
            styles.avatarCircle,
            {
              width: config.avatarSize,
              height: config.avatarSize,
              borderRadius: config.avatarSize / 2,
              backgroundColor: isUserTeam ? theme.colors.accentMuted : theme.colors.surfaceElevated,
              borderColor: isUserTeam ? theme.colors.accent : config.badgeBg,
              borderWidth: 2,
            },
          ]}
        >
          <Text
            variant="caption"
            weight="bold"
            style={[
              styles.avatarRankText,
              { color: isUserTeam ? theme.colors.accent : config.badgeBg },
            ]}
          >
            {rankLabel}
          </Text>
        </View>

        {/* Team Name */}
        <Text
          variant="caption"
          weight="bold"
          numberOfLines={1}
          style={[styles.teamName, { color: isUserTeam ? theme.colors.accent : theme.colors.text }]}
        >
          {team ? team.team_name : '—'}
        </Text>

        {/* Team Score */}
        <Text variant="caption" weight="semiBold" style={{ color: theme.colors.accent }}>
          {team ? `${team.score} pts` : '—'}
        </Text>
      </View>

      {/* Solid Pillar Block */}
      <View
        style={[
          styles.pillarBlock,
          {
            height: config.height,
            backgroundColor: isUserTeam
              ? theme.isDark
                ? '#1A2938'
                : '#E6F4FE'
              : theme.colors.surfaceElevated,
            borderColor: isUserTeam ? theme.colors.accent : theme.colors.border,
          },
        ]}
      >
        <View style={[styles.pillarRankBadge, { backgroundColor: config.badgeBg }]}>
          <Text variant="caption" weight="bold" style={{ color: config.badgeText, fontSize: 13 }}>
            {assignedRank}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    paddingHorizontal: 4,
  },
  youBadge: {
    marginBottom: 4,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarRankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  teamName: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  pillarBlock: {
    width: '92%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    alignItems: 'center',
    paddingTop: 12,
  },
  pillarRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
