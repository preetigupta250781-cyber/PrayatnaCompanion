import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

interface ProblemTrack {
  id: string;
  code: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
}

const PROBLEM_TRACKS: ProblemTrack[] = [
  {
    id: '1',
    code: 'TRK-01',
    title: 'Autonomous Campus Navigation & Safety',
    category: 'AI & GeoSpatial',
    difficulty: 'Advanced',
    description:
      'Design an intelligent routing system using live mapping and spatial anchors to guide visitors across complex multi-building campuses.',
  },
  {
    id: '2',
    code: 'TRK-02',
    title: 'Offline-First Emergency Response Mesh',
    category: 'Edge Computing & Networking',
    difficulty: 'Advanced',
    description:
      'Build a peer-to-peer communication system that operates reliably when cellular infrastructure or power connectivity is impaired.',
  },
  {
    id: '3',
    code: 'TRK-03',
    title: 'Community Micro-Finance & Transparent Grants',
    category: 'FinTech & Web3',
    difficulty: 'Intermediate',
    description:
      'Develop a fraud-resistant escrow and milestone tracking system for distributing localized grants with real-time auditability.',
  },
  {
    id: '4',
    code: 'TRK-04',
    title: 'Predictive Medical Equipment Maintenance',
    category: 'HealthTech & IoT',
    difficulty: 'Intermediate',
    description:
      'Leverage telemetry logs and anomaly detection to alert clinic administrators before vital biomedical gear experiences failure.',
  },
];

export default function ProblemsScreen(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Problem Statements</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Choose your track, review requirements, and verify submission criteria.
      </Text>

      <View style={styles.trackList}>
        {PROBLEM_TRACKS.map((track) => (
          <View
            key={track.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.codeBadge,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.codeText, { color: theme.colors.accent }]}>{track.code}</Text>
              </View>
              <Text style={[styles.categoryText, { color: theme.colors.textMuted }]}>
                {track.category}
              </Text>
            </View>

            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{track.title}</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              {track.description}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.difficultyLabel, { color: theme.colors.textMuted }]}>
                Level:{' '}
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '700' }}>
                  {track.difficulty}
                </Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 24,
  },
  trackList: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A2133',
    paddingTop: 10,
  },
  difficultyLabel: {
    fontSize: 12,
  },
});
