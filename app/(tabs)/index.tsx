import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnnouncementCard,
  sortAnnouncementsByDate,
  useAnnouncements,
} from '@/features/announcements';
import { useProfile } from '@/features/auth';
import { EVENT_TYPE_CONFIG, useSchedule } from '@/features/schedule';
import { useServerNow } from '@/shared/hooks/use-server-now';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Avatar, Badge, Card, ErrorState, HomeSkeleton, OfflineBanner, Text } from '@/shared/ui';
import { formatCountdown, formatTimeIST, getNowAndNextEvents } from '@/shared/utils/date';

export default function HomeScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();

  // Load authoritative server time with 1-second ticking for live countdowns
  const serverNow = useServerNow({ intervalMs: 1000 });

  // Data queries
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();

  const {
    events,
    isLoading: isScheduleLoading,
    isError: isScheduleError,
    error: scheduleError,
    refetch: refetchSchedule,
    isRefetching: isScheduleRefetching,
  } = useSchedule();

  const {
    announcements,
    isLoading: isAnnouncementsLoading,
    isError: isAnnouncementsError,
    error: announcementsError,
    refetch: refetchAnnouncements,
    isRefetching: isAnnouncementsRefetching,
  } = useAnnouncements();

  const isInitialLoading = isProfileLoading || isScheduleLoading || isAnnouncementsLoading;
  const isRefreshing = isScheduleRefetching || isAnnouncementsRefetching;

  const handleRefresh = async (): Promise<void> => {
    await Promise.all([refetchProfile(), refetchSchedule(), refetchAnnouncements()]);
  };

  // User Greeting
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Hacker';
  const teamSubtitle = profile?.team
    ? `${profile.team.name} • #${profile.team.team_code}`
    : 'Prayatna 2026 Participant';

  // "Happening now / Up next" Calculation
  const { currentEvent, nextEvent } = useMemo(() => {
    return getNowAndNextEvents(events, serverNow, (e) => ({
      startsAt: e.starts_at,
      endsAt: e.ends_at,
    }));
  }, [events, serverNow]);

  // Latest 3 announcements sorted newest first
  const latestAnnouncements = useMemo(() => {
    const sorted = sortAnnouncementsByDate(announcements);
    return sorted.slice(0, 3);
  }, [announcements]);

  // Loading State -> HomeSkeleton (zero layout shift)
  if (isInitialLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  // Critical Error State (both primary datasets failed)
  if (isScheduleError && isAnnouncementsError) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <ErrorState
          message={
            scheduleError?.userMessage ??
            announcementsError?.userMessage ??
            profileError?.userMessage ??
            'Unable to load hackathon data.'
          }
          onRetry={() => {
            void handleRefresh();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <OfflineBanner />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
          />
        }
      >
        {/* Header Greeting & Profile Bar */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text variant="caption" style={{ color: theme.colors.accent, fontWeight: '700' }}>
              PRAYATNA 2026 DASHBOARD
            </Text>
            <Text variant="h1" style={styles.greetingTitle}>
              Hello, {firstName} 👋
            </Text>
            <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
              {teamSubtitle}
            </Text>
          </View>

          <Avatar
            name={firstName}
            size="lg"
            accessibilityLabel={`Profile avatar for ${firstName}`}
          />
        </View>

        {/* Hero Card: "Happening Now / Up Next" with Live Countdown */}
        <Card variant="elevated" style={styles.heroCard}>
          {currentEvent ? (
            <>
              <View style={styles.cardHeaderRow}>
                <Badge label="HAPPENING NOW" variant="accent" size="sm" />
                <Badge
                  label={EVENT_TYPE_CONFIG[currentEvent.event_type].label}
                  variant={EVENT_TYPE_CONFIG[currentEvent.event_type].badgeVariant}
                  size="sm"
                />
              </View>

              <Text variant="h2" style={styles.eventTitle}>
                {currentEvent.title}
              </Text>

              <View style={styles.eventMetaRow}>
                <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
                  🕒 {formatTimeIST(currentEvent.starts_at, false)} –{' '}
                  {formatTimeIST(currentEvent.ends_at, false)} IST
                </Text>
                {currentEvent.location && (
                  <Text
                    variant="bodySm"
                    style={{ color: theme.colors.textSecondary, marginLeft: 12 }}
                  >
                    📍 {currentEvent.location}
                  </Text>
                )}
              </View>

              {nextEvent ? (
                <View style={[styles.nextEventSubSection, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      variant="caption"
                      style={{ color: theme.colors.textMuted, fontWeight: '700' }}
                    >
                      UP NEXT: {nextEvent.title}
                    </Text>
                    <Text variant="label" style={{ color: theme.colors.accent }}>
                      in {formatCountdown(nextEvent.starts_at, serverNow)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : nextEvent ? (
            <>
              <View style={styles.cardHeaderRow}>
                <Badge label="UP NEXT" variant="warning" size="sm" />
                <Badge
                  label={EVENT_TYPE_CONFIG[nextEvent.event_type].label}
                  variant={EVENT_TYPE_CONFIG[nextEvent.event_type].badgeVariant}
                  size="sm"
                />
              </View>

              <Text variant="h2" style={styles.eventTitle}>
                {nextEvent.title}
              </Text>

              <View style={styles.eventMetaRow}>
                <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
                  🕒 Starts at {formatTimeIST(nextEvent.starts_at)}
                </Text>
                {nextEvent.location && (
                  <Text
                    variant="bodySm"
                    style={{ color: theme.colors.textSecondary, marginLeft: 12 }}
                  >
                    📍 {nextEvent.location}
                  </Text>
                )}
              </View>

              {/* Countdown Digits */}
              <View
                style={[
                  styles.countdownContainer,
                  { backgroundColor: theme.colors.surfaceElevated },
                ]}
              >
                <Text variant="caption" style={{ color: theme.colors.textMuted }}>
                  COUNTDOWN TO EVENT
                </Text>
                <Text variant="h1" style={[styles.countdownDigits, { color: theme.colors.accent }]}>
                  {formatCountdown(nextEvent.starts_at, serverNow)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.allFinishedContainer}>
              <Text variant="h2" style={{ color: theme.colors.text, marginBottom: 6 }}>
                🎉 Hackathon Active
              </Text>
              <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
                All scheduled events for today have concluded. Keep hacking and submit your projects
                before the deadline!
              </Text>
            </View>
          )}
        </Card>

        {/* Section: Latest Announcements */}
        <View style={styles.sectionHeader}>
          <Text variant="h2" style={styles.sectionTitle}>
            Latest Announcements
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/announcements')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View all announcements"
            style={styles.seeAllButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="label" style={{ color: theme.colors.accent }}>
              View all →
            </Text>
          </TouchableOpacity>
        </View>

        {latestAnnouncements.length === 0 ? (
          <Card variant="default" style={styles.emptyCard}>
            <Text
              variant="bodySm"
              style={{ color: theme.colors.textSecondary, textAlign: 'center' }}
            >
              No announcements published yet.
            </Text>
          </Card>
        ) : (
          latestAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} now={serverNow} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  greetingTitle: {
    marginTop: 2,
    marginBottom: 2,
  },
  heroCard: {
    marginBottom: 24,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  nextEventSubSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  countdownContainer: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  countdownDigits: {
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  allFinishedContainer: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
  },
  seeAllButton: {
    minHeight: 44, // Touch target >= 44px
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
