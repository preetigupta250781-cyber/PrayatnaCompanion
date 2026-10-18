import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

interface TeamScore {
  rank: number;
  teamName: string;
  track: string;
  score: number;
  commits: number;
}

const LEADERBOARD_DATA: TeamScore[] = [
  { rank: 1, teamName: 'BinaryNomads', track: 'TRK-01', score: 980, commits: 42 },
  { rank: 2, teamName: 'QuantumCoders', track: 'TRK-02', score: 940, commits: 38 },
  { rank: 3, teamName: 'KernelPanic', track: 'TRK-01', score: 915, commits: 29 },
  { rank: 4, teamName: 'ByteBrigade', track: 'TRK-03', score: 870, commits: 25 },
  { rank: 5, teamName: 'NullPointers', track: 'TRK-04', score: 830, commits: 31 },
  { rank: 6, teamName: 'SynthHacks', track: 'TRK-02', score: 790, commits: 21 },
];

export default function LeaderboardScreen(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Leaderboard</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Live evaluation metrics updated across checkpoint submissions.
      </Text>

      {/* Top 3 Podium Highlights */}
      <View style={styles.list}>
        {LEADERBOARD_DATA.map((team) => {
          const isTopThree = team.rank <= 3;

          return (
            <View
              key={team.rank}
              style={[
                styles.rowCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: isTopThree ? theme.colors.accentMuted : theme.colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.rankCircle,
                  {
                    backgroundColor: isTopThree
                      ? theme.colors.accentMuted
                      : theme.colors.surfaceElevated,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rankNumber,
                    {
                      color: isTopThree ? theme.colors.accent : theme.colors.textSecondary,
                    },
                  ]}
                >
                  #{team.rank}
                </Text>
              </View>

              <View style={styles.teamDetails}>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>{team.teamName}</Text>
                <Text style={[styles.teamTrack, { color: theme.colors.textMuted }]}>
                  {team.track} • {team.commits} commits
                </Text>
              </View>

              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreValue, { color: theme.colors.accent }]}>
                  {team.score}
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.colors.textMuted }]}>pts</Text>
              </View>
            </View>
          );
        })}
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
  list: {
    gap: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teamTrack: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
