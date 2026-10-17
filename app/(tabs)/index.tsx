import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '@/shared/hooks/use-theme';

export default function HomeScreen(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hackathon Status Banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
        <Text style={[styles.bannerText, { color: theme.colors.text }]}>
          HACKATHON ACTIVE // ROUND 1
        </Text>
      </View>

      {/* Screen Title */}
      <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Welcome to Prayatna Companion. Monitor event status, your team progress, and announcements.
      </Text>

      {/* Quick Metrics Cards */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            COUNTDOWN
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.accent }]}>23:45:10</Text>
          <Text style={[styles.metricSub, { color: theme.colors.textMuted }]}>to submission</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            TRACK STATUS
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>Checked In</Text>
          <Text style={[styles.metricSub, { color: theme.colors.success }]}>● Ready to build</Text>
        </View>
      </View>

      {/* Placeholder Feed Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Latest Announcement</Text>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Mentoring slots for Problem Track A & B are now open. Head to the mentoring lounge on the
          3rd floor or check the Schedule tab for timeline details.
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>10 minutes ago</Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  metricSub: {
    fontSize: 11,
    marginTop: 4,
  },
  card: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 12,
  },
});
