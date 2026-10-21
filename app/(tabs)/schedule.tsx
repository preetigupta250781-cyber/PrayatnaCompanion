import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DayOption,
  DaySelector,
  filterEventsByDay,
  isEventActive,
  ScheduleTimelineItem,
  useSchedule,
} from '@/features/schedule';
import { useServerNow } from '@/shared/hooks/use-server-now';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { EmptyState, ScheduleSkeleton, ScreenState, Text } from '@/shared/ui';
import { groupEventsByDay } from '@/shared/utils/date';

export default function ScheduleScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { events, isLoading, isError, error, refetch, isRefetching } = useSchedule();
  // Auto-advance authoritative server-corrected time every 30 seconds
  const serverNow = useServerNow({ intervalMs: 30000 });

  const [selectedDayKey, setSelectedDayKey] = useState<string>('all');

  // Compute available days from loaded events
  const dayOptions: DayOption[] = useMemo(() => {
    if (events.length === 0) return [];
    const groups = groupEventsByDay(events, (e) => e.starts_at);
    const options: DayOption[] = [{ key: 'all', label: 'All Days' }];

    for (const group of groups) {
      options.push({
        key: group.dateKey,
        label: group.dayLabel,
      });
    }

    return options;
  }, [events]);

  // Filter events based on selected tab (handling midnight-crossing events)
  const filteredEvents = useMemo(() => {
    return filterEventsByDay(events, selectedDayKey);
  }, [events, selectedDayKey]);

  const renderTimelineItem = React.useCallback(
    ({ item }: { item: (typeof filteredEvents)[0] }) => (
      <ScheduleTimelineItem event={item} isCurrent={isEventActive(item, serverNow)} />
    ),
    [serverNow]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Schedule
        </Text>
        <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
          Prayatna 2026 Timeline • Indian Standard Time (IST)
        </Text>

        {dayOptions.length > 0 && (
          <DaySelector
            days={dayOptions}
            selectedKey={selectedDayKey}
            onSelectDay={setSelectedDayKey}
          />
        )}
      </View>

      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        skeleton={<ScheduleSkeleton />}
        isEmpty={events.length === 0}
        emptyProps={{
          title: 'No Events Scheduled',
          message: 'The hackathon schedule will be announced here shortly.',
        }}
        style={styles.screenStateContainer}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No Events On This Day"
              message="There are no sessions, workshops, or deadlines scheduled for this day."
            />
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderTimelineItem}
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
          />
        )}
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
    paddingBottom: 4,
  },
  title: {
    marginBottom: 4,
  },
  screenStateContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
});
