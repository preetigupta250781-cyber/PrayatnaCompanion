import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glow';

export interface CardProps {
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export function Card({
  variant = 'default',
  onPress,
  style,
  children,
  accessibilityLabel,
  testID,
}: CardProps): React.JSX.Element {
  const theme = useAppTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderWidth: 1,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme.isDark ? 0.4 : 0.08,
          shadowRadius: 8,
          elevation: 5,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          borderWidth: 1.5,
        };
      case 'glow':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.accent,
          borderWidth: 1,
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 6,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderWidth: 1,
        };
    }
  };

  const containerStyle: ViewStyle[] = [
    styles.card,
    {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    getVariantStyle(),
    style as ViewStyle,
  ];

  if (onPress) {
    const handlePress = (): void => {
      try {
        void Haptics.selectionAsync();
      } catch {
        // Haptics optional fallback
      }
      onPress();
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[containerStyle, styles.pressable]}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={containerStyle}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 44, // Touch target >= 44px
  },
});
