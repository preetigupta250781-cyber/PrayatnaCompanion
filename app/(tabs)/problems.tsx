import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LockedReleaseCard, ProblemCard, ProblemStatement, useProblems } from '@/features/problems';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { EmptyState, ProblemCardSkeleton, ScreenState, Text } from '@/shared/ui';

export default function ProblemsScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();

  const {
    problems,
    nextRelease,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    handleCountdownZero,
  } = useProblems();

  const handleSelectProblem = useCallback(
    (problem: ProblemStatement) => {
      router.push({
        pathname: '/problems/[id]',
        params: { id: problem.id },
      });
    },
    [router]
  );

  const renderProblemItem = useCallback(
    ({ item }: { item: ProblemStatement }) => (
      <ProblemCard
        problem={item}
        onPress={handleSelectProblem}
        testID={`problem-card-${item.code}`}
      />
    ),
    [handleSelectProblem]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Problem Statements
        </Text>
        <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
          Choose your track, review requirements, and verify submission criteria.
        </Text>
      </View>

      {/* 5-State Screen Container */}
      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        skeleton={<ProblemCardSkeleton />}
        isEmpty={problems.length === 0}
        renderEmpty={() => (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
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
            {nextRelease ? (
              <LockedReleaseCard
                targetReleaseAt={nextRelease}
                onCountdownZero={handleCountdownZero}
                testID="locked-card-empty-state"
              />
            ) : null}
            <View testID="empty-problems-state">
              <EmptyState
                title="No Problems Released"
                message="Problem statements will appear here when released"
              />
            </View>
          </ScrollView>
        )}
        style={styles.screenStateContainer}
      >
        <FlatList
          data={problems}
          keyExtractor={(item) => item.id}
          renderItem={renderProblemItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            nextRelease ? (
              <LockedReleaseCard
                targetReleaseAt={nextRelease}
                onCountdownZero={handleCountdownZero}
                testID="locked-release-card"
              />
            ) : null
          }
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenStateContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
});
