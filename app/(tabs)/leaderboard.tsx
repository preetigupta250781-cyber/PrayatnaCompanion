import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/features/auth';
import {
  LeaderboardPodium,
  LeaderboardRowItem,
  RankedTeamItem,
  RoundFilterSelector,
  useLeaderboard,
} from '@/features/leaderboard';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, EmptyState, LeaderboardSkeleton, ScreenState, Text } from '@/shared/ui';

export default function LeaderboardScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { profile, team: userTeam } = useProfile();
  const flatListRef = useRef<FlatList<RankedTeamItem>>(null);

  const {
    rankedTeams,
    availableRounds,
    selectedRound,
    setSelectedRound,
    isDataEmpty,
    lastUpdatedText,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useLeaderboard();

  const userTeamId = profile?.team_id ?? userTeam?.id ?? null;
  const userTeamIndex = rankedTeams.findIndex((t) => t.team_id === userTeamId);
  const userRankedTeam = userTeamIndex !== -1 ? rankedTeams[userTeamIndex] : null;

  // Smoothly scroll to the current user's team
  const handleScrollToMyTeam = useCallback(() => {
    if (userTeamIndex === -1 || !flatListRef.current) return;

    if (userTeamIndex < 3) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    } else {
      flatListRef.current.scrollToIndex({
        index: userTeamIndex - 3,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [userTeamIndex]);

  const remainingTeams = rankedTeams.slice(3);

  const renderLeaderboardRow = useCallback(
    ({ item }: { item: RankedTeamItem }) => (
      <LeaderboardRowItem
        team={item}
        isUserTeam={Boolean(userTeamId && item.team_id === userTeamId)}
      />
    ),
    [userTeamId]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text variant="h1" style={styles.title}>
            Leaderboard
          </Text>

          {/* Jump to My Team Button */}
          {userRankedTeam && (
            <TouchableOpacity
              onPress={handleScrollToMyTeam}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.myTeamButton,
                {
                  backgroundColor: theme.colors.accentMuted,
                  borderColor: theme.colors.accent,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Scroll to your team: ${userRankedTeam.team_name}, Rank ${userRankedTeam.rank}`}
              testID="jump-to-my-team-btn"
            >
              <Text variant="caption" weight="bold" style={{ color: theme.colors.accent }}>
                My Team #{userRankedTeam.rank}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
          Live evaluation metrics updated across checkpoint submissions.
        </Text>

        {/* Authoritative Server / Last Updated Information */}
        <View style={styles.statusRow}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
            <Text variant="caption" weight="semiBold" style={{ color: theme.colors.textSecondary }}>
              LIVE
            </Text>
          </View>
          <Text
            variant="caption"
            style={{ color: theme.colors.textMuted }}
            testID="last-updated-text"
          >
            Last updated: {lastUpdatedText}
          </Text>
        </View>
      </View>

      {/* 5-State Screen Container */}
      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        skeleton={<LeaderboardSkeleton />}
        isEmpty={isDataEmpty || rankedTeams.length === 0}
        renderEmpty={() => (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => {
                  void refetch();
                }}
                tintColor={theme.colors.accent}
                colors={[theme.colors.accent]}
              />
            }
          >
            {/* Round Filter available even when current round has no data */}
            <RoundFilterSelector
              availableRounds={availableRounds}
              selectedRound={selectedRound}
              onSelectRound={setSelectedRound}
            />

            <View style={styles.emptyInner} testID="leaderboard-empty-state">
              <EmptyState
                title="Leaderboard"
                message="Results will appear once organizers publish them"
              />
            </View>
          </ScrollView>
        )}
        style={styles.screenStateContainer}
      >
        <FlatList
          ref={flatListRef}
          data={remainingTeams}
          keyExtractor={(item) => item.team_id}
          renderItem={renderLeaderboardRow}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Round Filter Chips */}
              <RoundFilterSelector
                availableRounds={availableRounds}
                selectedRound={selectedRound}
                onSelectRound={setSelectedRound}
              />

              {/* Top 3 Podium Display */}
              <LeaderboardPodium
                teams={rankedTeams}
                userTeamId={userTeamId}
                testID="leaderboard-top-podium"
              />

              {/* Full Standings Header (if remaining teams exist) */}
              {remainingTeams.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text variant="h3" style={styles.sectionTitle}>
                    Rankings
                  </Text>
                  <Badge label={`${rankedTeams.length} Teams`} variant="muted" size="sm" />
                </View>
              )}
            </View>
          }
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, info.highestMeasuredFrameIndex * 80),
              animated: true,
            });
          }}
        />
      </ScreenState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  myTeamButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  screenStateContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyScroll: {
    flexGrow: 1,
  },
  emptyInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
