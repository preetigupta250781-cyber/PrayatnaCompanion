import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card, Text } from '@/shared/ui';

import { RankedTeamItem } from '../types';

export interface LeaderboardRowItemProps {
  team: RankedTeamItem;
  isUserTeam?: boolean;
  testID?: string;
}

function LeaderboardRowItemComponent({
  team,
  isUserTeam = false,
  testID,
}: LeaderboardRowItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const shouldReduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  // Subtle rank change animation when delta changes
  useEffect(() => {
    if (shouldReduceMotion || !team.rankDelta) {
      scale.value = 1;
      return;
    }

    scale.value = withSequence(
      withTiming(1.12, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [team.rankDelta, shouldReduceMotion, scale]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rankLabel = `#${team.rank}`;
  const rankDelta = team.rankDelta ?? 0;

  return (
    <Card
      variant={isUserTeam ? 'glow' : 'default'}
      style={[
        styles.card,
        {
          borderColor: isUserTeam ? theme.colors.accent : theme.colors.cardBorder,
          backgroundColor: isUserTeam ? (theme.isDark ? '#142332' : '#F0F8FF') : theme.colors.card,
        },
      ]}
      testID={testID ?? `leaderboard-row-${team.team_id}`}
      accessibilityLabel={`Rank ${team.rank}, ${team.team_name}, ${team.score} points${
        isUserTeam ? ', Your team' : ''
      }${rankDelta > 0 ? `, Moved up ${rankDelta} places` : rankDelta < 0 ? `, Moved down ${Math.abs(rankDelta)} places` : ''}`}
    >
      <View style={styles.contentRow}>
        {/* Rank Circle with Rank Delta Badge */}
        <View style={styles.rankContainer}>
          <View
            style={[
              styles.rankCircle,
              {
                backgroundColor: isUserTeam
                  ? theme.colors.accentMuted
                  : theme.colors.surfaceElevated,
              },
            ]}
          >
            <Text
              variant="bodySm"
              weight="bold"
              style={[
                styles.rankNumber,
                { color: isUserTeam ? theme.colors.accent : theme.colors.textSecondary },
              ]}
            >
              {rankLabel}
            </Text>
          </View>

          {/* Delta Indicator (▲ / ▼) */}
          {rankDelta !== 0 && (
            <Animated.View style={[styles.deltaBadge, animatedBadgeStyle]}>
              <Text
                variant="caption"
                weight="bold"
                style={{
                  fontSize: 10,
                  color: rankDelta > 0 ? theme.colors.success : theme.colors.error,
                }}
                testID={`rank-delta-${team.team_id}`}
              >
                {rankDelta > 0 ? `▲ +${rankDelta}` : `▼ ${rankDelta}`}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Team Information */}
        <View style={styles.teamDetails}>
          <View style={styles.teamNameRow}>
            <Text
              variant="body"
              weight="bold"
              numberOfLines={1}
              style={[
                styles.teamNameText,
                { color: isUserTeam ? theme.colors.accent : theme.colors.text },
              ]}
            >
              {team.team_name}
            </Text>
            {isUserTeam && (
              <Badge
                label="YOU"
                variant="accent"
                size="sm"
                style={styles.youBadge}
                testID="row-you-badge"
              />
            )}
          </View>

          <View style={styles.teamSubRow}>
            <Text variant="caption" style={{ color: theme.colors.textMuted }}>
              {team.team_code}
            </Text>
            {team.hasScore ? (
              <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                • {team.published_rounds_count}{' '}
                {team.published_rounds_count === 1 ? 'round' : 'rounds'} scored
              </Text>
            ) : (
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                • No scores yet
              </Text>
            )}
          </View>
        </View>

        {/* Score Value */}
        <View style={styles.scoreContainer}>
          <Text
            variant="h3"
            weight="bold"
            style={[styles.scoreValue, { color: theme.colors.accent }]}
          >
            {team.score}
          </Text>
          <Text variant="caption" weight="semiBold" style={{ color: theme.colors.textMuted }}>
            pts
          </Text>
        </View>
      </View>
    </Card>
  );
}

export const LeaderboardRowItem = React.memo(LeaderboardRowItemComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    minWidth: 42,
  },
  rankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 13,
  },
  deltaBadge: {
    marginTop: 2,
    alignItems: 'center',
  },
  teamDetails: {
    flex: 1,
    marginRight: 12,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamNameText: {
    fontSize: 15,
    flexShrink: 1,
  },
  youBadge: {
    marginLeft: 2,
  },
  teamSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 55,
  },
  scoreValue: {
    fontSize: 18,
    lineHeight: 22,
  },
});
