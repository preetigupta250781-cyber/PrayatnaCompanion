import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Card, Chip, Text } from '@/shared/ui';

import { BusRoute } from '../types';
import { formatBusDepartureTime } from '../utils/bus-helpers';

export interface BusRouteCardProps {
  route: BusRoute;
  onPress: (route: BusRoute) => void;
}

export function BusRouteCard({ route, onPress }: BusRouteCardProps): React.JSX.Element {
  const theme = useAppTheme();
  const routeColor = route.color || theme.colors.accent;
  const departureText = formatBusDepartureTime(route.departs_at);

  return (
    <TouchableOpacity
      onPress={() => onPress(route)}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Route ${route.name}, originating from ${route.origin_city ?? 'City'}, ${departureText}`}
      accessibilityHint="Navigates to route details, stops list, and interactive transit map"
      testID={`bus-route-card-${route.id}`}
      style={styles.touchable}
    >
      <Card variant="default" style={styles.card}>
        <View style={styles.headerRow}>
          {/* Color Dot and Route Name */}
          <View style={styles.titleGroup}>
            <View
              style={[styles.colorDot, { backgroundColor: routeColor }]}
              accessible={false}
              testID="bus-route-color-dot"
            />
            <Text variant="h3" style={styles.routeName} numberOfLines={1}>
              {route.name}
            </Text>
          </View>

          {/* Origin City Chip */}
          {route.origin_city && (
            <Chip
              label={route.origin_city}
              variant="outline"
              style={[styles.cityChip, { borderColor: routeColor }]}
              textStyle={{ color: routeColor }}
            />
          )}
        </View>

        {/* Departure Time */}
        <View style={styles.metaRow}>
          <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
            {`🕒 ${departureText}`}
          </Text>
        </View>

        {/* Description snippet */}
        {route.description ? (
          <Text
            variant="caption"
            numberOfLines={2}
            style={[styles.description, { color: theme.colors.textSecondary }]}
          >
            {route.description}
          </Text>
        ) : null}

        {/* Action footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Text variant="caption" style={{ color: theme.colors.accent, fontWeight: '700' }}>
            VIEW MAP & STOPS →
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: 44,
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  routeName: {
    flex: 1,
    fontSize: 17,
  },
  cityChip: {
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  description: {
    marginTop: 8,
    lineHeight: 18,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
});
