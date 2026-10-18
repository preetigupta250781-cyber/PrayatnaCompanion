import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface OfflineBannerProps {
  message?: string;
}

export function OfflineBanner({
  message = 'You are currently offline. Showing cached event data.',
}: OfflineBannerProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderBottomColor: theme.colors.warning,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
