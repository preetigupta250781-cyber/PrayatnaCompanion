import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
}

const SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: '1',
    time: '09:00 AM',
    title: 'Registration & Team Check-In',
    description: 'Collect your hacker badge, Wi-Fi credentials, and swag bag at the front desk.',
    status: 'completed',
  },
  {
    id: '2',
    time: '10:30 AM',
    title: 'Opening Ceremony & Theme Reveal',
    description: 'Welcome keynote and presentation of problem statements by industry sponsors.',
    status: 'completed',
  },
  {
    id: '3',
    time: '11:30 AM',
    title: 'Hacking Commences',
    description: '24-hour hackathon timer starts. Teams begin building their solutions.',
    status: 'current',
  },
  {
    id: '4',
    time: '04:00 PM',
    title: 'Mentorship Checkpoint 1',
    description: 'Domain experts available for technical reviews and architectural feedback.',
    status: 'upcoming',
  },
  {
    id: '5',
    time: '09:00 PM',
    title: 'Midnight Energy & Mini-Games',
    description: 'Snacks, caffeine boost, and quick trivia challenges in the main arena.',
    status: 'upcoming',
  },
  {
    id: '6',
    time: '11:30 AM (Day 2)',
    title: 'Code Freeze & Project Submission',
    description: 'All repositories and project demo videos must be submitted via the portal.',
    status: 'upcoming',
  },
];

export default function ScheduleScreen(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Schedule</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Prayatna 2026 24-Hour Timeline. All times in Indian Standard Time (IST).
      </Text>

      <View style={styles.timeline}>
        {SCHEDULE_ITEMS.map((item) => {
          const isCurrent = item.status === 'current';
          const isCompleted = item.status === 'completed';

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: isCurrent ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: isCurrent
                        ? theme.colors.accent
                        : isCompleted
                          ? theme.colors.textMuted
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {item.time}
                </Text>
                {isCurrent && (
                  <View style={[styles.nowBadge, { backgroundColor: theme.colors.accentMuted }]}>
                    <Text style={[styles.nowBadgeText, { color: theme.colors.accent }]}>
                      LIVE NOW
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[styles.itemDesc, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
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
  timeline: {
    gap: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
