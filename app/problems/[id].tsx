import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatDifficulty,
  getDifficultyBadgeVariant,
  MarkdownRenderer,
  useProblemDetail,
} from '@/features/problems';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card, Chip, ScreenState, Skeleton, Text } from '@/shared/ui';
import { DATE_FORMATS, formatInIST } from '@/shared/utils/date';

function ProblemDetailSkeleton(): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.metaRow}>
        <Skeleton width={80} height={24} borderRadius={theme.radius.full} />
        <Skeleton width={110} height={24} borderRadius={theme.radius.full} />
        <Skeleton width={70} height={24} borderRadius={theme.radius.full} />
      </View>
      <Skeleton width="90%" height={28} borderRadius={6} style={styles.mt16} />
      <Skeleton width="60%" height={20} borderRadius={4} style={styles.mt8} />
      <Skeleton width="100%" height={1} borderRadius={0} style={styles.mt16} />
      <Skeleton width="100%" height={16} borderRadius={4} style={styles.mt16} />
      <Skeleton width="95%" height={16} borderRadius={4} style={styles.mt8} />
      <Skeleton width="75%" height={16} borderRadius={4} style={styles.mt8} />
      <Skeleton width="100%" height={80} borderRadius={8} style={styles.mt16} />
    </View>
  );
}

export default function ProblemDetailScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const problemId = typeof id === 'string' ? id : '';

  const { problem, isLoading, isError, error, refetch } = useProblemDetail(problemId);

  const difficultyVariant = getDifficultyBadgeVariant(problem?.difficulty);
  const formattedDifficulty = formatDifficulty(problem?.difficulty);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Top Navigation Bar with Accessible Back Button */}
      <View style={[styles.navBar, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the problem statements list"
          hitSlop={10}
        >
          <Text style={[styles.backIcon, { color: theme.colors.accent }]}>← Back</Text>
        </Pressable>

        <Text variant="label" style={{ color: theme.colors.textMuted }}>
          Track Details
        </Text>
      </View>

      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        skeleton={<ProblemDetailSkeleton />}
        isEmpty={!problem}
        emptyProps={{
          title: 'Problem Not Found',
          message: 'The requested problem statement could not be located or has not been released.',
        }}
        style={styles.container}
      >
        {problem ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Metadata Chips: Code, Domain, Difficulty */}
            <View style={styles.metaRow}>
              <Badge label={problem.code} variant="accent" size="md" />

              {problem.domain ? <Chip label={problem.domain} selected={false} /> : null}

              <Badge label={formattedDifficulty} variant={difficultyVariant} size="md" />
            </View>

            {/* Title */}
            <Text variant="h1" style={[styles.title, { color: theme.colors.text }]}>
              {problem.title}
            </Text>

            {/* Release Date Info */}
            <View style={styles.releaseInfoRow}>
              <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                Released: {formatInIST(problem.release_at, DATE_FORMATS.DATETIME_FULL)} (IST)
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Problem Description Card with Safe Markdown Renderer */}
            <Card variant="default" style={styles.descriptionCard}>
              <Text variant="h3" style={[styles.sectionHeading, { color: theme.colors.text }]}>
                Description & Requirements
              </Text>

              <MarkdownRenderer
                content={problem.description ?? 'No detailed description provided for this track.'}
                testID="problem-detail-markdown"
              />
            </Card>
          </ScrollView>
        ) : null}
      </ScreenState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  backButton: {
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 8,
  },
  releaseInfoRow: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  descriptionCard: {
    padding: 18,
    borderRadius: 14,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  skeletonContainer: {
    padding: 20,
  },
  mt8: {
    marginTop: 8,
  },
  mt16: {
    marginTop: 16,
  },
});
