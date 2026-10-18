import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  onPress,
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}: ButtonProps): React.JSX.Element {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const handlePress = (): void => {
    if (isDisabled) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional fallback
    }
    onPress();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; indicator: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: theme.colors.accent,
            borderColor: theme.colors.accent,
            borderWidth: 1,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          },
          text: {
            color: '#08090E', // Dark contrast on neon accent
            fontWeight: '700',
          },
          indicator: '#08090E',
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.text,
            fontWeight: '600',
          },
          indicator: theme.colors.text,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 1,
          },
          text: {
            color: theme.colors.text,
            fontWeight: '600',
          },
          indicator: theme.colors.text,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.accent,
            borderWidth: 1.5,
          },
          text: {
            color: theme.colors.accent,
            fontWeight: '700',
          },
          indicator: theme.colors.accent,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: theme.colors.error,
            borderColor: theme.colors.error,
            borderWidth: 1,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '700',
          },
          indicator: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            minHeight: 44, // Touch target >= 44px
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: theme.radius.sm,
          },
          text: {
            fontSize: 13,
            lineHeight: 18,
          },
        };
      case 'lg':
        return {
          container: {
            minHeight: 54,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: theme.radius.md,
          },
          text: {
            fontSize: 16,
            lineHeight: 22,
          },
        };
      case 'md':
      default:
        return {
          container: {
            minHeight: 48,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: theme.radius.md,
          },
          text: {
            fontSize: 15,
            lineHeight: 20,
          },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();
  const resolvedLabel =
    accessibilityLabel || title || (typeof children === 'string' ? children : 'Button');

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      style={[
        styles.baseButton,
        sizeStyle.container,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyle.indicator}
            style={styles.spinner}
            accessible={false}
          />
        ) : (
          <>
            {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
            {title ? (
              <Text
                numberOfLines={1}
                style={[styles.baseText, sizeStyle.text, variantStyle.text, textStyle]}
              >
                {title}
              </Text>
            ) : (
              children
            )}
            {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  spinner: {
    paddingVertical: 2,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
