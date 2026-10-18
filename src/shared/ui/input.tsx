import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  helperText,
  errorText,
  leftElement,
  rightElement,
  disabled = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  style,
  placeholderTextColor,
  ...restProps
}: InputProps): React.JSX.Element {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(errorText);

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = (): string => {
    if (hasError) {
      return theme.colors.error;
    }
    if (isFocused) {
      return theme.colors.borderFocus;
    }
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: hasError ? theme.colors.error : theme.colors.textSecondary,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: getBorderColor(),
            borderRadius: theme.radius.md,
          },
          isFocused && {
            borderWidth: 1.5,
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: theme.isDark ? 0.25 : 0.1,
            shadowRadius: 4,
          },
          disabled && styles.disabled,
          style as ViewStyle,
        ]}
      >
        {leftElement ? <View style={styles.leftElement}>{leftElement}</View> : null}

        <TextInput
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderTextColor || theme.colors.textMuted}
          style={[
            styles.textInput,
            {
              color: theme.colors.text,
            },
            inputStyle,
          ]}
          accessible={true}
          accessibilityLabel={label || restProps.placeholder || 'Text input'}
          accessibilityHint={helperText || errorText}
          accessibilityState={{
            disabled,
          }}
          {...restProps}
        />

        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {hasError ? (
        <Text
          accessible={true}
          accessibilityRole="alert"
          style={[styles.feedbackText, { color: theme.colors.error }]}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={[styles.feedbackText, { color: theme.colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrapper: {
    minHeight: 48, // Accessible touch target >= 44px
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftElement: {
    marginRight: 8,
  },
  rightElement: {
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    paddingVertical: 10,
  },
  feedbackText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
