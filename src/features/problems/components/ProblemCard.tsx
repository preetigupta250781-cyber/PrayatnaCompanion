import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card, Chip } from '@/shared/ui';

import { ProblemStatement } from '../types';
import {
  formatDifficulty,
  getDifficultyBadgeVariant,
  truncateText,
} from '../utils/problem-helpers';

export interface ProblemCardProps {
  problem: ProblemStatement;
  onPress: (problem: ProblemStatement) => void;
  testID?: string;
}

/**
 * Interactive card displaying a released problem statement summary
 */
export function ProblemCard({ problem, onPress, testID }: ProblemCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const difficultyVariant = getDifficultyBadgeVariant(problem.difficulty);
  const formattedDifficulty = formatDifficulty(problem.difficulty);
  const excerpt = truncateText(problem.description, 140);

  return (
    <Card
      variant="default"
      style={styles.card}
      onPress={() => onPress(problem)}
      accessibilityLabel={`Problem statement ${problem.code}: ${problem.title}. Difficulty: ${formattedDifficulty}`}
      testID={testID}
    >
      {/* Top Metadata Row: Code, Domain, and Difficulty */}
      <View style={styles.headerRow}>
        <View style={styles.tagsContainer}>
          <Badge label={problem.code} variant="accent" size="sm" />

          {problem.domain ? (
            <Chip label={problem.domain} selected={false} style={styles.domainChip} />
          ) : null}
        </View>

        <Badge label={formattedDifficulty} variant={difficultyVariant} size="sm" />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2} allowFontScaling>
        {problem.title}
      </Text>

      {/* Description Excerpt */}
      {excerpt ? (
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={3}
          allowFontScaling
        >
          {excerpt}
        </Text>
      ) : null}

      {/* Footer Call-to-Action */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerActionText, { color: theme.colors.accent }]}>
          View Details & Requirements →
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  domainChip: {
    height: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    minHeight: 24,
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
