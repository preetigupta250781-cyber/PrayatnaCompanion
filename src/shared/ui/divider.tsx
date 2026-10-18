import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Spacing } from '@/config/theme';
import { useAppTheme } from '@/shared/hooks/use-theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  thickness?: number;
  spacing?: keyof Spacing;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Divider({
  orientation = 'horizontal',
  label,
  thickness = 1,
  spacing = 'md',
  color,
  style,
}: DividerProps): React.JSX.Element {
  const theme = useAppTheme();
  const resolvedColor = color || theme.colors.border;
  const marginSize = theme.spacing[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        accessible={false}
        style={[
          styles.vertical,
          {
            width: thickness,
            backgroundColor: resolvedColor,
            marginHorizontal: marginSize,
          },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View
        accessible={true}
        accessibilityRole="none"
        style={[
          styles.labeledContainer,
          {
            marginVertical: marginSize,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.line,
            {
              height: thickness,
              backgroundColor: resolvedColor,
            },
          ]}
        />
        <Text style={[styles.labelText, { color: theme.colors.textMuted }]}>{label}</Text>
        <View
          style={[
            styles.line,
            {
              height: thickness,
              backgroundColor: resolvedColor,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      accessible={false}
      style={[
        styles.horizontal,
        {
          height: thickness,
          backgroundColor: resolvedColor,
          marginVertical: marginSize,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  labeledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
  },
  labelText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
