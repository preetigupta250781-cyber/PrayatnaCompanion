import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusNoticeBanner, BusRoute, BusRouteCard, useBusRoutes } from '@/features/bus';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { BusRouteListSkeleton, ScreenState, Text } from '@/shared/ui';

export default function BusRoutesListScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();
  const { routes, isLoading, isError, error, refetch, isRefetching } = useBusRoutes();

  const handleRoutePress = React.useCallback(
    (route: BusRoute): void => {
      router.push(`/bus/${route.id}` as any);
    },
    [router]
  );

  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/more');
    }
  };

  const renderRouteItem = React.useCallback(
    ({ item }: { item: BusRoute }) => <BusRouteCard route={item} onPress={handleRoutePress} />,
    [handleRoutePress]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Header Bar */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to More & Account screen"
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="h3" style={{ color: theme.colors.text }}>
              ←
            </Text>
          </TouchableOpacity>
          <Text variant="h2" style={styles.title}>
            Bus Routes & Transit
          </Text>
        </View>
        <Text variant="bodySm" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Scheduled pickup shuttles and routes to Prayatna Campus
        </Text>
      </View>

      {/* Static Logistics Disclaimer Banner */}
      <BusNoticeBanner />

      {/* 5-State Screen Container */}
      <ScreenState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        isEmpty={routes.length === 0}
        skeleton={<BusRouteListSkeleton />}
        emptyProps={{
          title: 'No Bus Routes',
          message: 'Transit schedules will appear here once published by organizers.',
          actionLabel: 'Refresh Routes',
          onAction: () => {
            void refetch();
          },
        }}
      >
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
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
      </ScreenState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
