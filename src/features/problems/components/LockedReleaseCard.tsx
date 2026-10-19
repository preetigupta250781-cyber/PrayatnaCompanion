import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useServerNow } from '@/shared/hooks/use-server-now';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Badge, Card } from '@/shared/ui';
import { getCountdownParts } from '@/shared/utils/date';

export interface LockedReleaseCardProps {
  targetReleaseAt: string;
  onCountdownZero?: () => void;
  testID?: string;
}

/**
 * Locked card with live countdown to the next problem release using server-corrected clock.
 * Automatically triggers onCountdownZero and smooth transition when reaching zero.
 */
export function LockedReleaseCard({
  targetReleaseAt,
  onCountdownZero,
  testID,
}: LockedReleaseCardProps): React.JSX.Element | null {
  const theme = useAppTheme();
  const serverNow = useServerNow({ intervalMs: 1000 });
  const hasTriggeredRef = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();

  // Subtle pulsing glow animation for active countdown card
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      pulseOpacity.value = 1;
      return;
    }
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      true
    );
  }, [pulseOpacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const countdown = getCountdownParts(targetReleaseAt, serverNow);

  // Check if countdown reached zero while the screen is open
  useEffect(() => {
    if (countdown.isFinished) {
      if (hasTriggeredRef.current !== targetReleaseAt) {
        hasTriggeredRef.current = targetReleaseAt;
        onCountdownZero?.();
      }
    }
  }, [countdown.isFinished, targetReleaseAt, onCountdownZero]);

  // Format digital segments
  const daysStr = String(countdown.days).padStart(2, '0');
  const hoursStr = String(countdown.hours).padStart(2, '0');
  const minsStr = String(countdown.minutes).padStart(2, '0');
  const secsStr = String(countdown.seconds).padStart(2, '0');

  const accessibilityCountdown =
    countdown.days > 0
      ? `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`
      : `${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`;

  return (
    <Card
      variant="glow"
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.accent,
        },
      ]}
      accessibilityLabel={`Locked problem track. Next release in ${accessibilityCountdown}`}
      testID={testID}
    >
      {/* Header with Lock Indicator & Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.lockBadgeRow}>
          <Text style={styles.lockIcon} accessibilityElementsHidden>
            🔒
          </Text>
          <Badge label="LOCKED TRACK" variant="warning" size="sm" />
        </View>

        <Badge label="Auto-Revealing" variant="outline" size="sm" />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text }]} allowFontScaling>
        Next Problem Statement Unlocks In
      </Text>

      {/* Countdown Timer Display */}
      {countdown.isFinished ? (
        <View style={styles.revealingContainer}>
          <Text style={[styles.revealingText, { color: theme.colors.accent }]} allowFontScaling>
            ⚡ Unlocking new problem tracks now...
          </Text>
        </View>
      ) : (
        <Animated.View style={[styles.timerContainer, animatedStyle]}>
          {countdown.days > 0 ? (
            <>
              <View
                style={[
                  styles.timeBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.timeDigit, { color: theme.colors.text }]}>{daysStr}</Text>
                <Text style={[styles.timeLabel, { color: theme.colors.textMuted }]}>DAYS</Text>
              </View>
              <Text style={[styles.colon, { color: theme.colors.accent }]}>:</Text>
            </>
          ) : null}

          <View
            style={[
              styles.timeBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.timeDigit, { color: theme.colors.text }]}>{hoursStr}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textMuted }]}>HOURS</Text>
          </View>

          <Text style={[styles.colon, { color: theme.colors.accent }]}>:</Text>

          <View
            style={[
              styles.timeBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.timeDigit, { color: theme.colors.text }]}>{minsStr}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textMuted }]}>MINS</Text>
          </View>

          <Text style={[styles.colon, { color: theme.colors.accent }]}>:</Text>

          <View
            style={[
              styles.timeBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.timeDigit, { color: theme.colors.accent }]}>{secsStr}</Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textMuted }]}>SECS</Text>
          </View>
        </Animated.View>
      )}

      {/* Bottom informational guidance */}
      <Text style={[styles.note, { color: theme.colors.textSecondary }]} allowFontScaling>
        Problem tracks are securely locked until their designated schedule time. This screen updates
        instantly without reloading.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 6,
  },
  timeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 54,
  },
  timeDigit: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  colon: {
    fontSize: 20,
    fontWeight: '800',
    paddingBottom: 10,
  },
  revealingContainer: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  revealingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
  },
});
