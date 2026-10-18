import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface SkeletonProps {
  width?: number | `${number}%` | '100%';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
}: SkeletonProps): React.JSX.Element {
  const theme = useAppTheme();
  const shouldReduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    if (shouldReduceMotion) {
      opacity.value = 0.5;
      return;
    }

    opacity.value = withRepeat(withTiming(0.85, { duration: 850 }), -1, true);
  }, [opacity, shouldReduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceHighlight,
        },
        animatedStyle,
        style,
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: 4,
  },
});
