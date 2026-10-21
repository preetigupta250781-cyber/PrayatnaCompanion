import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card, Text } from '@/shared/ui';

import { ScheduleEvent } from '../types';
import { EVENT_TYPE_CONFIG, formatEventTimeRange } from '../utils/schedule-helpers';

export interface ScheduleTimelineItemProps {
  event: ScheduleEvent;
  isCurrent: boolean;
}

export function ScheduleTimelineItemComponent({
  event,
  isCurrent,
}: ScheduleTimelineItemProps): React.JSX.Element {
  const theme = useAppTheme();
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type];
  const timeRange = formatEventTimeRange(event.starts_at, event.ends_at);

  return (
    <Card
      variant={isCurrent ? 'elevated' : 'default'}
      style={[
        styles.card,
        {
          borderColor: isCurrent ? theme.colors.accent : theme.colors.cardBorder,
          borderWidth: isCurrent ? 2 : 1,
          backgroundColor: isCurrent
            ? theme.isDark
              ? 'rgba(0, 240, 255, 0.06)'
              : 'rgba(0, 150, 255, 0.05)'
            : theme.colors.card,
        },
      ]}
      accessibilityLabel={`${event.title}. ${timeRange}. Category: ${typeConfig.label}. ${isCurrent ? 'Currently happening now.' : ''}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <Badge
            label={typeConfig.label}
            variant={typeConfig.badgeVariant}
            size="sm"
            style={styles.typeBadge}
          />
          {isCurrent && (
            <Badge label="LIVE NOW" variant="accent" size="sm" style={styles.liveBadge} />
          )}
        </View>

        <Text
          variant="label"
          style={[
            styles.timeText,
            {
              color: isCurrent ? theme.colors.accent : theme.colors.textSecondary,
              fontWeight: isCurrent ? '800' : '600',
            },
          ]}
        >
          {timeRange}
        </Text>
      </View>

      <Text variant="h3" style={[styles.title, { color: theme.colors.text }]}>
        {event.title}
      </Text>

      {event.description ? (
        <Text variant="bodySm" style={[styles.description, { color: theme.colors.textSecondary }]}>
          {event.description}
        </Text>
      ) : null}

      {event.location ? (
        <View style={styles.locationRow}>
          <Text variant="caption" style={{ color: theme.colors.accent }}>
            📍
          </Text>
          <Text
            variant="caption"
            style={[styles.locationText, { color: theme.colors.textSecondary }]}
          >
            {event.location}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export const ScheduleTimelineItem = React.memo(ScheduleTimelineItemComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    marginRight: 4,
  },
  liveBadge: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    marginBottom: 6,
  },
  description: {
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontWeight: '600',
  },
});
