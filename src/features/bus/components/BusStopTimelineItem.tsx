import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Button, Text } from '@/shared/ui';

import { BusStop } from '../types';
import { formatStopScheduledTime, openInGoogleMaps } from '../utils/bus-helpers';

export interface BusStopTimelineItemProps {
  stop: BusStop;
  index: number;
  isSelected?: boolean;
  onSelect?: (stop: BusStop) => void;
  accentColor?: string;
  isLast?: boolean;
}

function BusStopTimelineItemComponent({
  stop,
  index,
  isSelected = false,
  onSelect,
  accentColor,
  isLast = false,
}: BusStopTimelineItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const color = accentColor || theme.colors.accent;
  const timeText = formatStopScheduledTime(stop.scheduled_time);

  const handleOpenMap = (e?: { stopPropagation?: () => void }): void => {
    e?.stopPropagation?.();
    void openInGoogleMaps(stop.latitude, stop.longitude);
  };

  return (
    <TouchableOpacity
      onPress={() => onSelect?.(stop)}
      activeOpacity={0.7}
      testID={`bus-stop-item-${stop.id}`}
      style={[
        styles.container,
        isSelected && {
          backgroundColor: theme.isDark ? 'rgba(32, 138, 239, 0.12)' : 'rgba(32, 138, 239, 0.06)',
          borderColor: color,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Stop ${index + 1}: ${stop.name}, scheduled arrival ${timeText}`}
      accessibilityHint="Centers this stop on the route map"
    >
      {/* Left indicator column: Numbered circle and timeline connector */}
      <View style={styles.leftColumn}>
        <View
          style={[
            styles.badgeCircle,
            {
              backgroundColor: isSelected ? color : theme.colors.surface,
              borderColor: color,
            },
          ]}
        >
          <Text
            variant="caption"
            style={[styles.badgeText, { color: isSelected ? '#FFFFFF' : color, fontWeight: '700' }]}
          >
            {index + 1}
          </Text>
        </View>

        {!isLast && (
          <View
            style={[
              styles.timelineBar,
              { backgroundColor: theme.isDark ? theme.colors.border : '#CBD5E1' },
            ]}
          />
        )}
      </View>

      {/* Right details column */}
      <View style={styles.detailsColumn}>
        <View style={styles.headerRow}>
          <Text variant="body" style={styles.stopName} numberOfLines={2}>
            {stop.name}
          </Text>
          <Text variant="label" style={{ color: color, fontWeight: '700' }}>
            {timeText}
          </Text>
        </View>

        {stop.notes ? (
          <Text variant="caption" style={[styles.notesText, { color: theme.colors.textSecondary }]}>
            📍 {stop.notes}
          </Text>
        ) : null}

        {/* Action: Open in Google Maps */}
        <View style={styles.actionRow}>
          <Button
            title="Open in Google Maps ↗"
            variant="outline"
            size="sm"
            onPress={handleOpenMap}
            accessibilityLabel={`Open ${stop.name} in Google Maps`}
            accessibilityHint="Opens external Google Maps app or website for navigation directions"
            style={styles.mapsButton}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const BusStopTimelineItem = React.memo(BusStopTimelineItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44, // Touch target >= 44px
  },
  leftColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
  },
  timelineBar: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  detailsColumn: {
    flex: 1,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stopName: {
    flex: 1,
    fontWeight: '700',
  },
  notesText: {
    marginTop: 4,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  mapsButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
