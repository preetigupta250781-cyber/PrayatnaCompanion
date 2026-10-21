import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

import { Card } from './card';
import { Skeleton } from './skeleton';

export interface ComposedSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * 1. HomeSkeleton: Matches the Hackathon Home Overview layout
 */
export function HomeSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.homeContainer, style]} accessible={false}>
      {/* Header Profile Bar */}
      <View style={styles.rowBetween}>
        <View style={styles.flex1}>
          <Skeleton width={120} height={14} borderRadius={4} />
          <Skeleton width={180} height={22} borderRadius={6} style={styles.mt4} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Hero Event Banner */}
      <Card variant="elevated" style={styles.cardSpacing}>
        <Skeleton width={90} height={20} borderRadius={theme.radius.full} />
        <Skeleton width="85%" height={26} borderRadius={6} style={styles.mt8} />
        <Skeleton width="60%" height={16} borderRadius={4} style={styles.mt4} />
        <View style={[styles.row, styles.mt12]}>
          <Skeleton width={80} height={36} borderRadius={theme.radius.sm} style={styles.mr8} />
          <Skeleton width={80} height={36} borderRadius={theme.radius.sm} style={styles.mr8} />
          <Skeleton width={80} height={36} borderRadius={theme.radius.sm} />
        </View>
      </Card>

      {/* Section: Live Announcements */}
      <View style={styles.sectionHeader}>
        <Skeleton width={140} height={20} borderRadius={4} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </View>

      <Card variant="default" style={styles.cardSpacing}>
        <View style={styles.rowBetween}>
          <Skeleton width={70} height={18} borderRadius={theme.radius.full} />
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>
        <Skeleton width="90%" height={18} borderRadius={4} style={styles.mt8} />
        <Skeleton width="100%" height={14} borderRadius={4} style={styles.mt4} />
      </Card>

      {/* Section: Problem Tracks */}
      <View style={styles.sectionHeader}>
        <Skeleton width={130} height={20} borderRadius={4} />
      </View>
      <View style={styles.rowBetween}>
        <Skeleton width="48%" height={90} borderRadius={theme.radius.md} />
        <Skeleton width="48%" height={90} borderRadius={theme.radius.md} />
      </View>
    </View>
  );
}

/**
 * 2. ScheduleSkeleton: Matches the Timeline and Schedule layout
 */
export function ScheduleSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]} accessible={false}>
      {/* Day Selector Pills */}
      <View style={styles.pillsRow}>
        <Skeleton width={80} height={38} borderRadius={theme.radius.full} style={styles.mr8} />
        <Skeleton width={80} height={38} borderRadius={theme.radius.full} style={styles.mr8} />
        <Skeleton width={80} height={38} borderRadius={theme.radius.full} />
      </View>

      {/* Timeline Event Cards */}
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.timelineRow}>
          <View style={styles.timeColumn}>
            <Skeleton width={48} height={16} borderRadius={4} />
            <Skeleton width={36} height={12} borderRadius={4} style={styles.mt4} />
          </View>
          <View style={styles.timelineTrack}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
          </View>
          <Card variant="default" style={styles.timelineCard}>
            <View style={styles.rowBetween}>
              <Skeleton width={70} height={16} borderRadius={theme.radius.full} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </View>
            <Skeleton width="85%" height={18} borderRadius={4} style={styles.mt8} />
            <Skeleton width="65%" height={14} borderRadius={4} style={styles.mt4} />
          </Card>
        </View>
      ))}
    </View>
  );
}

/**
 * 3. AnnouncementListSkeleton: Matches Announcements feed layout
 */
export function AnnouncementListSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]} accessible={false}>
      {/* Category Filter Chips */}
      <View style={styles.pillsRow}>
        <Skeleton width={60} height={34} borderRadius={theme.radius.full} style={styles.mr8} />
        <Skeleton width={80} height={34} borderRadius={theme.radius.full} style={styles.mr8} />
        <Skeleton width={90} height={34} borderRadius={theme.radius.full} />
      </View>

      {/* Announcement Cards */}
      {[1, 2, 3].map((index) => (
        <Card key={index} variant="default" style={styles.cardSpacing}>
          <View style={styles.rowBetween}>
            <Skeleton width={75} height={20} borderRadius={theme.radius.full} />
            <Skeleton width={65} height={14} borderRadius={4} />
          </View>
          <Skeleton width="80%" height={20} borderRadius={4} style={styles.mt8} />
          <Skeleton width="100%" height={14} borderRadius={4} style={styles.mt6} />
          <Skeleton width="92%" height={14} borderRadius={4} style={styles.mt4} />
          <View style={[styles.row, styles.mt12]}>
            <Skeleton width={20} height={20} borderRadius={10} style={styles.mr8} />
            <Skeleton width={110} height={12} borderRadius={4} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/**
 * 4. ProblemCardSkeleton: Matches Problem Statements list layout
 */
export function ProblemCardSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]} accessible={false}>
      {[1, 2].map((index) => (
        <Card key={index} variant="default" style={styles.cardSpacing}>
          <View style={styles.rowBetween}>
            <Skeleton width={80} height={20} borderRadius={theme.radius.full} />
            <Skeleton width={60} height={20} borderRadius={theme.radius.full} />
          </View>
          <Skeleton width="90%" height={22} borderRadius={6} style={styles.mt8} />
          <Skeleton width="100%" height={14} borderRadius={4} style={styles.mt6} />
          <Skeleton width="85%" height={14} borderRadius={4} style={styles.mt4} />
          <View style={[styles.rowBetween, styles.mt16]}>
            <Skeleton width={120} height={16} borderRadius={4} />
            <Skeleton width={100} height={38} borderRadius={theme.radius.sm} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/**
 * 5. LeaderboardSkeleton: Matches Podium (top 3) + Ranking Rows layout
 */
export function LeaderboardSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={styles.container} accessible={false}>
      {/* Podium Top 3 Section */}
      <View style={styles.podiumContainer}>
        {/* Rank 2 (Silver - Left) */}
        <View style={styles.podiumColumn}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width={60} height={14} borderRadius={4} style={styles.mt4} />
          <Skeleton width={45} height={12} borderRadius={4} style={styles.mt4} />
          <View
            style={[
              styles.podiumBlock,
              styles.podiumRank2,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>

        {/* Rank 1 (Gold - Center) */}
        <View style={styles.podiumColumn}>
          <Skeleton width={54} height={54} borderRadius={27} />
          <Skeleton width={75} height={16} borderRadius={4} style={styles.mt4} />
          <Skeleton width={50} height={14} borderRadius={4} style={styles.mt4} />
          <View
            style={[
              styles.podiumBlock,
              styles.podiumRank1,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <Skeleton width={28} height={28} borderRadius={14} />
          </View>
        </View>

        {/* Rank 3 (Bronze - Right) */}
        <View style={styles.podiumColumn}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <Skeleton width={60} height={14} borderRadius={4} style={styles.mt4} />
          <Skeleton width={45} height={12} borderRadius={4} style={styles.mt4} />
          <View
            style={[
              styles.podiumBlock,
              styles.podiumRank3,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Remaining Leaderboard Rows */}
      <View style={styles.mt16}>
        {[4, 5, 6].map((rank) => (
          <Card key={rank} variant="default" style={styles.rankingRow}>
            <View style={styles.row}>
              <Skeleton width={24} height={18} borderRadius={4} style={styles.mr12} />
              <Skeleton width={36} height={36} borderRadius={18} style={styles.mr12} />
              <View>
                <Skeleton width={110} height={16} borderRadius={4} />
                <Skeleton width={70} height={12} borderRadius={4} style={styles.mt4} />
              </View>
            </View>
            <Skeleton width={45} height={20} borderRadius={6} />
          </Card>
        ))}
      </View>
    </View>
  );
}

/**
 * 6. BusRouteListSkeleton: Matches Campus Transit logistics layout
 */
export function BusRouteListSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]} accessible={false}>
      {/* Route Switcher Pills */}
      <View style={styles.pillsRow}>
        <Skeleton width={130} height={38} borderRadius={theme.radius.full} style={styles.mr8} />
        <Skeleton width={130} height={38} borderRadius={theme.radius.full} />
      </View>

      {/* Route Details Card */}
      <Card variant="elevated" style={styles.cardSpacing}>
        <View style={styles.rowBetween}>
          <Skeleton width={110} height={20} borderRadius={theme.radius.full} />
          <Skeleton width={70} height={14} borderRadius={4} />
        </View>
        <Skeleton width="85%" height={22} borderRadius={6} style={styles.mt8} />
        <Skeleton width="60%" height={14} borderRadius={4} style={styles.mt4} />
      </Card>

      {/* Sequenced Bus Stops Timeline */}
      <View style={styles.mt12}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.stopItem}>
            <View style={styles.stopTrack}>
              <View style={[styles.stopDot, { borderColor: theme.colors.accent }]} />
              {index < 4 && (
                <View style={[styles.stopLine, { backgroundColor: theme.colors.border }]} />
              )}
            </View>
            <View style={styles.stopContent}>
              <View style={styles.rowBetween}>
                <Skeleton width={140} height={16} borderRadius={4} />
                <Skeleton width={60} height={14} borderRadius={4} />
              </View>
              <Skeleton width="75%" height={12} borderRadius={4} style={styles.mt4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 7. ProfileCardSkeleton: Matches Profile and Team details layout
 */
export function ProfileCardSkeleton({ style }: ComposedSkeletonProps = {}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={[styles.profileSkeletonContainer, style]} accessible={false}>
      {/* Profile Header Card */}
      <Card variant="elevated" style={[styles.cardSpacing, styles.alignCenter]}>
        <Skeleton width={72} height={72} borderRadius={36} />
        <Skeleton width={150} height={22} borderRadius={6} style={styles.mt12} />
        <Skeleton width={180} height={14} borderRadius={4} style={styles.mt4} />
        <Skeleton width={90} height={22} borderRadius={theme.radius.full} style={styles.mt8} />
      </Card>

      {/* Team Details Card */}
      <Card variant="default" style={styles.cardSpacing}>
        <View style={styles.rowBetween}>
          <Skeleton width={100} height={16} borderRadius={4} />
          <Skeleton width={65} height={16} borderRadius={theme.radius.full} />
        </View>
        <Skeleton width="75%" height={20} borderRadius={6} style={styles.mt8} />
        <View style={[styles.row, styles.mt12]}>
          <Skeleton width={32} height={32} borderRadius={16} style={styles.mr6} />
          <Skeleton width={32} height={32} borderRadius={16} style={styles.mr6} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </Card>

      {/* Academic / Contact Info Card */}
      <Card variant="default">
        <Skeleton width={120} height={14} borderRadius={4} />
        <Skeleton width="90%" height={16} borderRadius={4} style={styles.mt8} />
        <Skeleton width="60%" height={14} borderRadius={4} style={styles.mt8} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  homeContainer: {
    padding: 20,
    width: '100%',
  },
  profileSkeletonContainer: {
    width: '100%',
  },
  cardSpacing: {
    marginBottom: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  alignCenter: {
    alignItems: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timeColumn: {
    width: 52,
    paddingTop: 8,
  },
  timelineTrack: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 12,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 6,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  podiumColumn: {
    alignItems: 'center',
    width: '30%',
  },
  podiumBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 8,
  },
  podiumRank1: {
    height: 110,
  },
  podiumRank2: {
    height: 80,
  },
  podiumRank3: {
    height: 60,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stopTrack: {
    width: 24,
    alignItems: 'center',
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  stopLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
  stopContent: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 8,
  },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mr6: { marginRight: 6 },
  mr8: { marginRight: 8 },
  mr12: { marginRight: 12 },
});
