import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export type BadgeVariant =
  'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'muted';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: BadgeProps): React.JSX.Element {
  const theme = useAppTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'accent':
        return {
          container: {
            backgroundColor: theme.colors.accentMuted,
            borderColor: theme.colors.accent,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.accent,
          },
        };
      case 'success':
        return {
          container: {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: theme.colors.success,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.success,
          },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderColor: theme.colors.warning,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.warning,
          },
        };
      case 'error':
        return {
          container: {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderColor: theme.colors.error,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.error,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.textSecondary,
          },
        };
      case 'muted':
        return {
          container: {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.textMuted,
          },
        };
      case 'default':
      default:
        return {
          container: {
            backgroundColor: theme.colors.badge,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.text,
          },
        };
    }
  };

  const isSmall = size === 'sm';
  const variantStyles = getVariantStyles();

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `Badge: ${label}`}
      style={[
        styles.badge,
        {
          borderRadius: theme.radius.full,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
        },
        variantStyles.container,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            fontSize: isSmall ? 10 : 12,
            lineHeight: isSmall ? 14 : 16,
          },
          variantStyles.text,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
