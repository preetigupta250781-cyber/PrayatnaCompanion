import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';
import { Text } from '@/shared/ui';

export const BUS_NOTICE_TEXT =
  'Routes are updated manually by organizers. Live tracking is not available.';

export function BusNoticeBanner(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.isDark ? 'rgba(32, 138, 239, 0.12)' : 'rgba(32, 138, 239, 0.08)',
          borderColor: theme.isDark ? 'rgba(32, 138, 239, 0.3)' : 'rgba(32, 138, 239, 0.25)',
        },
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={BUS_NOTICE_TEXT}
    >
      <Text variant="caption" style={styles.icon}>
        ℹ️
      </Text>
      <Text
        variant="caption"
        style={[styles.text, { color: theme.isDark ? '#70B8FF' : '#0B64C4' }]}
      >
        {BUS_NOTICE_TEXT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
});
