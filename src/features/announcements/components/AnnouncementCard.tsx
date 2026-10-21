import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useServerNow } from '@/shared/hooks/use-server-now';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card, Text } from '@/shared/ui';
import { formatRelativeTime } from '@/shared/utils/date';

import { Announcement } from '../types';
import { ANNOUNCEMENT_PRIORITY_CONFIG } from '../utils/announcement-helpers';

export interface AnnouncementCardProps {
  announcement: Announcement;
  now?: Date;
  defaultExpanded?: boolean;
}

export function AnnouncementCardComponent({
  announcement,
  now,
  defaultExpanded = false,
}: AnnouncementCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const serverNow = useServerNow({ intervalMs: 30000 });
  const referenceTime = now ?? serverNow;

  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const priorityConfig = ANNOUNCEMENT_PRIORITY_CONFIG[announcement.priority];
  const relativeTime = formatRelativeTime(announcement.created_at, referenceTime);
  const isLongBody = announcement.body.length > 120;
  const isUrgent = priorityConfig.isUrgent;

  return (
    <Card
      variant={isUrgent ? 'elevated' : 'default'}
      style={[
        styles.card,
        {
          borderColor: isUrgent ? theme.colors.error : theme.colors.cardBorder,
          borderLeftWidth: isUrgent ? 4 : 1,
          borderLeftColor: isUrgent ? theme.colors.error : theme.colors.cardBorder,
          backgroundColor: isUrgent
            ? theme.isDark
              ? 'rgba(239, 68, 68, 0.08)'
              : 'rgba(239, 68, 68, 0.04)'
            : theme.colors.card,
        },
      ]}
      accessibilityLabel={`${priorityConfig.label} announcement: ${announcement.title}. Published ${relativeTime}.`}
    >
      <View style={styles.headerRow}>
        <Badge
          label={priorityConfig.label}
          variant={priorityConfig.badgeVariant}
          size="sm"
          style={styles.badge}
        />
        <Text variant="caption" style={[styles.timeText, { color: theme.colors.textMuted }]}>
          {relativeTime}
        </Text>
      </View>

      <Text variant="h3" style={[styles.title, { color: theme.colors.text }]}>
        {announcement.title}
      </Text>

      <Text
        variant="body"
        numberOfLines={isExpanded ? undefined : 3}
        style={[styles.body, { color: theme.colors.textSecondary }]}
      >
        {announcement.body}
      </Text>

      {isLongBody && (
        <TouchableOpacity
          onPress={() => setIsExpanded((prev) => !prev)}
          accessible={true}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          accessibilityLabel={
            isExpanded ? 'Collapse announcement body text' : 'Expand full announcement body text'
          }
          style={styles.expandButton}
          activeOpacity={0.7}
        >
          <Text variant="label" style={[styles.expandText, { color: theme.colors.accent }]}>
            {isExpanded ? 'Show less ▲' : 'Read more ▼'}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

export const AnnouncementCard = React.memo(AnnouncementCardComponent);

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
  badge: {
    marginRight: 8,
  },
  timeText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    marginBottom: 6,
  },
  body: {
    lineHeight: 22,
  },
  expandButton: {
    minHeight: 44, // Touch target >= 44px
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  expandText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
