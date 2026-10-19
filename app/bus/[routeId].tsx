import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BusNoticeBanner,
  BusStop,
  BusStopTimelineItem,
  formatBusDepartureTime,
  formatStopScheduledTime,
  openInGoogleMaps,
  useBusRouteDetail,
} from '@/features/bus';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { logger } from '@/shared/lib/logger';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  OfflineBanner,
  Skeleton,
  Text,
} from '@/shared/ui';

function BusRouteDetailSkeleton(): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={180} height={24} borderRadius={6} />
        <Skeleton width={80} height={20} borderRadius={theme.radius.full} />
      </View>
      <Skeleton width="100%" height={260} borderRadius={12} style={styles.skeletonMap} />
      <View style={styles.skeletonStops}>
        <Skeleton width="100%" height={64} borderRadius={8} style={styles.skeletonStopItem} />
        <Skeleton width="100%" height={64} borderRadius={8} style={styles.skeletonStopItem} />
        <Skeleton width="100%" height={64} borderRadius={8} style={styles.skeletonStopItem} />
      </View>
    </View>
  );
}

export default function BusRouteDetailScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const router = useRouter();
  const { routeId } = useLocalSearchParams<{ routeId?: string }>();
  const id = typeof routeId === 'string' ? routeId : '';

  const { routeDetail, isLoading, isError, error, refetch } = useBusRouteDetail(id);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const mapRef = useRef<MapView | null>(null);

  const route = routeDetail?.route;
  const stops = useMemo(() => routeDetail?.stops ?? [], [routeDetail?.stops]);
  const validStops = useMemo(() => routeDetail?.validStops ?? [], [routeDetail?.validStops]);
  const validPathCoordinates = useMemo(
    () => routeDetail?.validPathCoordinates ?? [],
    [routeDetail?.validPathCoordinates]
  );

  const routeColor = route?.color || theme.colors.accent;
  const departureText = formatBusDepartureTime(route?.departs_at);

  // Consolidated coordinates for fitting map view
  const fitCoordinates = useMemo(() => {
    if (validPathCoordinates.length > 0) {
      return validPathCoordinates;
    }
    return validStops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
  }, [validPathCoordinates, validStops]);

  // Center / Fit map bounds when map is ready or route changes
  const fitRouteBounds = useCallback(() => {
    if (!isMapReady || !mapRef.current || fitCoordinates.length === 0) {
      return;
    }

    try {
      mapRef.current.fitToCoordinates(fitCoordinates, {
        edgePadding: { top: 60, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
    } catch (err: unknown) {
      logger.warn('Error calling fitToCoordinates on MapView', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [isMapReady, fitCoordinates]);

  useEffect(() => {
    if (isMapReady && fitCoordinates.length > 0) {
      fitRouteBounds();
    }
  }, [isMapReady, fitCoordinates, fitRouteBounds]);

  // Initial region centered on the first valid stop or campus
  const initialRegion = useMemo(() => {
    const firstStop = validStops[0];
    if (firstStop) {
      return {
        latitude: firstStop.latitude,
        longitude: firstStop.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: 22.7196,
      longitude: 75.8577,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [validStops]);

  // Handle stop selection to pan/zoom map
  const handleSelectStop = (stop: BusStop): void => {
    setSelectedStopId(stop.id);

    if (mapRef.current && !mapFailed) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: stop.latitude,
            longitude: stop.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          400
        );
      } catch (err: unknown) {
        logger.warn('Failed to animate to stop region', { stopId: stop.id, err });
      }
    }
  };

  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/bus');
    }
  };

  // Find currently selected stop object
  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) ?? null,
    [stops, selectedStopId]
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <OfflineBanner />

      {/* Screen Header Bar */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to Bus Routes list"
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="h3" style={{ color: theme.colors.text }}>
              ←
            </Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text variant="h2" style={styles.headerTitle} numberOfLines={1}>
              {route?.name ?? 'Bus Route'}
            </Text>
            {route?.origin_city && (
              <Chip
                label={route.origin_city}
                variant="outline"
                style={[styles.originChip, { borderColor: routeColor }]}
                textStyle={{ color: routeColor }}
              />
            )}
          </View>
        </View>
        <Text variant="bodySm" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {`🕒 ${departureText}`}
        </Text>
      </View>

      {/* Static Logistics Disclaimer Banner */}
      <BusNoticeBanner />

      {/* 5-State Content Handling */}
      {isLoading ? (
        <BusRouteDetailSkeleton />
      ) : isError ? (
        <ErrorState
          message={error?.userMessage ?? 'Unable to load bus route details.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !route ? (
        <EmptyState
          title="Route Not Found"
          message="The requested bus transit route could not be found."
          actionLabel="View All Routes"
          onAction={handleBack}
        />
      ) : (
        <View style={styles.mainContainer}>
          {/* Map Section or Fallback */}
          {mapFailed || Platform.OS === 'web' ? (
            /* Fallback when MapView fails to load or on web */
            <View style={styles.mapFallbackContainer}>
              <Card variant="outlined" style={styles.fallbackCard}>
                <Text variant="label" style={{ color: theme.colors.accent }}>
                  TRANSIT MAP UNAVAILABLE
                </Text>
                <Text variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                  Interactive map could not be loaded. Displaying complete scheduled stop list
                  below.
                </Text>
              </Card>
            </View>
          ) : (
            <View style={styles.mapWrapper}>
              {/* Test / fallback simulator trigger */}
              <Pressable
                testID="bus-map-error-trigger"
                onPress={() => {
                  logger.warn('MapView reported error; falling back to stop list only');
                  setMapFailed(true);
                }}
                accessible={false}
              />
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={initialRegion}
                onMapReady={() => {
                  setIsMapReady(true);
                }}
                testID="bus-route-map-view"
                accessible={true}
                accessibilityLabel={`Transit map for ${route.name}`}
              >
                {/* Route Path Polyline */}
                {validPathCoordinates.length > 1 && (
                  <Polyline
                    coordinates={validPathCoordinates}
                    strokeColor={routeColor}
                    strokeWidth={4}
                    testID="bus-route-polyline"
                  />
                )}

                {/* Numbered Stops Markers */}
                {validStops.map((stop, index) => {
                  const isSelected = stop.id === selectedStopId;
                  const stopNumber = index + 1;
                  const stopScheduled = formatStopScheduledTime(stop.scheduled_time);

                  return (
                    <Marker
                      key={stop.id}
                      coordinate={{
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                      }}
                      title={`Stop #${stopNumber}: ${stop.name}`}
                      description={`Arrival: ${stopScheduled}`}
                      onPress={() => handleSelectStop(stop)}
                      testID={`bus-stop-marker-${stop.id}`}
                    >
                      {/* Numbered custom pin marker */}
                      <View
                        style={[
                          styles.markerContainer,
                          {
                            backgroundColor: isSelected ? routeColor : theme.colors.surface,
                            borderColor: routeColor,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={[
                            styles.markerText,
                            { color: isSelected ? '#FFFFFF' : routeColor },
                          ]}
                        >
                          {stopNumber}
                        </Text>
                      </View>

                      {/* Callout on marker tap */}
                      <Callout
                        onPress={() => {
                          void openInGoogleMaps(stop.latitude, stop.longitude);
                        }}
                        style={styles.callout}
                      >
                        <View style={styles.calloutInner}>
                          <Text variant="bodySm" style={styles.calloutTitle}>
                            {stopNumber}. {stop.name}
                          </Text>
                          <Text variant="caption" style={{ color: '#0B64C4', marginTop: 2 }}>
                            🕒 {stopScheduled}
                          </Text>
                          {stop.notes ? (
                            <Text variant="caption" style={styles.calloutNotes}>
                              📍 {stop.notes}
                            </Text>
                          ) : null}
                          <Text variant="caption" style={styles.calloutAction}>
                            Tap to open in Google Maps ↗
                          </Text>
                        </View>
                      </Callout>
                    </Marker>
                  );
                })}
              </MapView>

              {/* Floating Bottom Sheet Trigger Button */}
              <View style={styles.floatingActionRow}>
                <Button
                  title={`View All Stops (${stops.length})`}
                  variant="primary"
                  size="md"
                  onPress={() => setIsBottomSheetVisible(true)}
                  accessibilityLabel="View all stops list"
                  accessibilityHint="Opens bottom sheet containing all pickup stops and times"
                  style={styles.floatingButton}
                />
                {fitCoordinates.length > 0 && (
                  <Button
                    title="Fit Route"
                    variant="outline"
                    size="md"
                    onPress={fitRouteBounds}
                    accessibilityLabel="Fit map to full route"
                    accessibilityHint="Adjusts zoom to show all stops and paths"
                  />
                )}
              </View>
            </View>
          )}

          {/* Selected Stop Quick Preview (when marker is tapped) */}
          {selectedStop && !mapFailed && (
            <Card variant="outlined" style={styles.selectedStopCard}>
              <View style={styles.selectedStopHeader}>
                <View style={styles.flex1}>
                  <Text variant="label" style={{ color: routeColor }}>
                    SELECTED STOP
                  </Text>
                  <Text variant="body" style={styles.boldText} numberOfLines={1}>
                    {selectedStop.name}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Scheduled arrival: {formatStopScheduledTime(selectedStop.scheduled_time)}
                  </Text>
                  {selectedStop.notes ? (
                    <Text
                      variant="caption"
                      style={{ color: theme.colors.textSecondary, marginTop: 2 }}
                    >
                      📍 {selectedStop.notes}
                    </Text>
                  ) : null}
                </View>
                <Button
                  title="Open in Maps ↗"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    void openInGoogleMaps(selectedStop.latitude, selectedStop.longitude);
                  }}
                  accessibilityLabel={`Open ${selectedStop.name} in Google Maps`}
                />
              </View>
            </Card>
          )}

          {/* In-screen Stops List (rendered when map fails or under map on smaller layouts) */}
          <View style={styles.stopsSection}>
            <View style={styles.stopsSectionHeader}>
              <Text variant="h3">Scheduled Stops ({stops.length})</Text>
              <Pressable
                onPress={() => setIsBottomSheetVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open stops in full view"
              >
                <Text variant="caption" style={{ color: theme.colors.accent, fontWeight: '700' }}>
                  EXPAND LIST
                </Text>
              </Pressable>
            </View>

            {stops.length === 0 ? (
              <Card variant="default" style={styles.emptyStopsCard}>
                <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
                  No scheduled stops have been configured for this route yet.
                </Text>
              </Card>
            ) : (
              <FlatList
                data={stops}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <BusStopTimelineItem
                    stop={item}
                    index={index}
                    isSelected={item.id === selectedStopId}
                    onSelect={handleSelectStop}
                    accentColor={routeColor}
                    isLast={index === stops.length - 1}
                  />
                )}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stopsListContent}
              />
            )}
          </View>
        </View>
      )}

      {/* BottomSheet list of stops */}
      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        title={`${route?.name ?? 'Bus'} Stops`}
        subtitle={`${stops.length} scheduled stops • ${departureText}`}
        accessibilityLabel="Bus Stops Sheet"
      >
        <ScrollView style={styles.bottomSheetScroll} showsVerticalScrollIndicator={false}>
          {stops.length === 0 ? (
            <Text variant="body" style={styles.emptySheetText}>
              No scheduled stops available for this route.
            </Text>
          ) : (
            stops.map((stop, index) => (
              <BusStopTimelineItem
                key={stop.id}
                stop={stop}
                index={index}
                isSelected={stop.id === selectedStopId}
                onSelect={(selected) => {
                  handleSelectStop(selected);
                  setIsBottomSheetVisible(false);
                }}
                accentColor={routeColor}
                isLast={index === stops.length - 1}
              />
            ))
          )}
        </ScrollView>
      </BottomSheet>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  originChip: {
    marginLeft: 4,
  },
  subtitle: {
    marginTop: 4,
    marginLeft: 4,
  },
  mainContainer: {
    flex: 1,
  },
  mapWrapper: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  markerContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  callout: {
    width: 220,
  },
  calloutInner: {
    padding: 6,
  },
  calloutTitle: {
    fontWeight: '700',
  },
  calloutNotes: {
    marginTop: 4,
    color: '#475569',
  },
  calloutAction: {
    marginTop: 6,
    color: '#0B64C4',
    fontWeight: '700',
  },
  floatingActionRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  floatingButton: {
    flex: 1,
  },
  mapFallbackContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fallbackCard: {
    padding: 14,
  },
  selectedStopCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
  },
  selectedStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    marginTop: 2,
  },
  stopsSection: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  stopsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  emptyStopsCard: {
    padding: 16,
    alignItems: 'center',
  },
  stopsListContent: {
    paddingBottom: 24,
  },
  bottomSheetScroll: {
    maxHeight: 400,
    paddingHorizontal: 8,
  },
  emptySheetText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#64748B',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonMap: {
    marginBottom: 16,
  },
  skeletonStops: {
    gap: 10,
  },
  skeletonStopItem: {
    marginBottom: 8,
  },
});
