import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

import { ThemeColors } from '@/config/theme';
import { useAppTheme } from '@/shared/hooks/use-theme';

export type TextVariant =
  'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySm' | 'caption' | 'label' | 'code';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof ThemeColors | string;
  weight?: keyof typeof import('@/config/theme').typography.fontWeights;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Text({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  allowFontScaling = true,
  ...restProps
}: TextProps): React.JSX.Element {
  const theme = useAppTheme();

  const resolveColor = (): string => {
    if (!color) {
      if (variant === 'caption' || variant === 'bodySm') {
        return theme.colors.textSecondary;
      }
      if (variant === 'label') {
        return theme.colors.textMuted;
      }
      return theme.colors.text;
    }
    if (color in theme.colors) {
      return theme.colors[color as keyof ThemeColors];
    }
    return color;
  };

  const variantStyle = VARIANT_STYLES[variant];
  const customWeight = weight ? theme.typography.fontWeights[weight] : undefined;

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={restProps.maxFontSizeMultiplier ?? 2.0}
      style={[
        variantStyle,
        {
          color: resolveColor(),
          ...(customWeight ? { fontWeight: customWeight } : {}),
          ...(align ? { textAlign: align } : {}),
        },
        style,
      ]}
      {...restProps}
    >
      {children}
    </RNText>
  );
}

const VARIANT_STYLES: Record<TextVariant, TextStyle> = StyleSheet.create({
  h1: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
});
