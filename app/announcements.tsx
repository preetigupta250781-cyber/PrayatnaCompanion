import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnnouncementCard,
  AnnouncementPriority,
  sortAnnouncementsByDate,
  useAnnouncements,
} from '@/features/announcements';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { AnnouncementListSkeleton, Chip, EmptyState, ScreenState, Text } from '@/shared/ui';

type FilterOption = 'all' | AnnouncementPriority;

export default function AnnouncementsScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();
  const { announcements, isLoading, isError, error, refetch, isRefetching } = useAnnouncements();

  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Newest first sorting
  const sortedAnnouncements = useMemo(() => {
    return sortAnnouncementsByDate(announcements);
  }, [announcements]);

  // Priority filtering
  const filteredAnnouncements = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedAnnouncements;
    }
    return sortedAnnouncements.filter((item) => item.priority === activeFilter);
  }, [sortedAnnouncements, activeFilter]);

  const renderAnnouncementItem = React.useCallback(
    ({ item }: { item: (typeof filteredAnnouncements)[0] }) => (
      <AnnouncementCard announcement={item} />
    ),
    []
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="h3" style={{ color: theme.colors.text }}>
              ←
            </Text>
          </TouchableOpacity>

          <Text variant="h2" style={styles.headerTitle}>
            Announcements
          </Text>
        </View>

        <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
          Official updates, emergency alerts, and organizer notices.
        </Text>

        {/* Priority Filter Chips */}
        <View style={styles.filtersRow}>
          <Chip
            label="All"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            style={styles.filterChip}
          />
          <Chip
            label="Urgent"
            selected={activeFilter === 'urgent'}
            onPress={() => setActiveFilter('urgent')}
            style={styles.filterChip}
          />
          <Chip
            label="Important"
            selected={activeFilter === 'important'}
            onPress={() => setActiveFilter('important')}
            style={styles.filterChip}
          />
        </View>
      </View>

      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        skeleton={<AnnouncementListSkeleton />}
        isEmpty={announcements.length === 0}
        emptyProps={{
          title: 'No Announcements Yet',
          message: 'Organizer broadcasts and live updates will be displayed here.',
        }}
        style={styles.screenStateContainer}
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title={`No ${activeFilter.toUpperCase()} Announcements`}
              message={`There are no announcements currently marked as ${activeFilter}.`}
            />
          </View>
        ) : (
          <FlatList
            data={filteredAnnouncements}
            keyExtractor={(item) => item.id}
            renderItem={renderAnnouncementItem}
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
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    minHeight: 44,
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
