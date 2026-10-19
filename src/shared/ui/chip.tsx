import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export type ChipVariant = 'default' | 'accent' | 'outline';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  onClose,
  leftIcon,
  disabled = false,
  variant = 'default',
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ChipProps): React.JSX.Element {
  const theme = useAppTheme();

  const handlePress = (): void => {
    if (disabled || !onPress) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    onPress();
  };

  const handleClose = (): void => {
    if (disabled || !onClose) return;
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    onClose();
  };

  const getContainerStyle = (): ViewStyle => {
    if (selected) {
      return {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
      };
    }

    switch (variant) {
      case 'accent':
        return {
          backgroundColor: theme.colors.accentMuted,
          borderColor: theme.colors.accent,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        };
    }
  };

  const getTextColor = (): string => {
    if (selected) {
      return '#08090E'; // Dark text on bright accent
    }
    if (variant === 'accent') {
      return theme.colors.accent;
    }
    return theme.colors.text;
  };

  const isInteractive = Boolean(onPress);
  const containerStyles: StyleProp<ViewStyle> = [
    styles.chip,
    {
      borderRadius: theme.radius.full,
    },
    getContainerStyle(),
    disabled ? styles.disabled : undefined,
    style,
  ];

  const content = (
    <>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: getTextColor(),
          },
          selected && styles.selectedLabel,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {onClose ? (
        <TouchableOpacity
          onPress={handleClose}
          disabled={disabled}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.closeIcon, { color: getTextColor() }]}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{
          selected,
          disabled,
        }}
        accessibilityLabel={accessibilityLabel || `${label} filter`}
        style={containerStyles}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || label}
      style={containerStyles}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44, // Touch target >= 44px
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  selectedLabel: {
    fontWeight: '700',
  },
  leftIcon: {
    marginRight: 6,
  },
  closeButton: {
    marginLeft: 6,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
