import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (parts[0]?.[0] ?? 'P').toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = 'md',
  status,
  style,
  accessibilityLabel,
}: AvatarProps): React.JSX.Element {
  const theme = useAppTheme();
  const [hasImageError, setHasImageError] = useState(false);

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size];
  const radius = dimension / 2;
  const initials = getInitials(name);

  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
        return theme.colors.success;
      case 'busy':
        return theme.colors.error;
      case 'away':
        return theme.colors.warning;
      case 'offline':
      default:
        return theme.colors.textMuted;
    }
  };

  const statusDotSize = Math.max(8, Math.round(dimension * 0.25));

  const shouldRenderImage = Boolean(uri && !hasImageError);

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || name ? `Avatar of ${name}` : 'Avatar'}
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius,
        },
        style,
      ]}
    >
      {shouldRenderImage && uri ? (
        <Image
          source={{ uri }}
          onError={() => setHasImageError(true)}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: radius,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius: radius,
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                color: theme.colors.accent,
                fontSize: Math.round(dimension * 0.4),
                lineHeight: Math.round(dimension * 0.48),
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              width: statusDotSize,
              height: statusDotSize,
              borderRadius: statusDotSize / 2,
              backgroundColor: getStatusColor(),
              borderColor: theme.colors.surface,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    fontWeight: '700',
    textAlign: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
