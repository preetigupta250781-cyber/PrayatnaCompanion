import React from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/shared/hooks/use-theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  contentStyle,
  accessibilityLabel,
}: BottomSheetProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel={accessibilityLabel || title || 'Bottom sheet dialog'}
    >
      <View style={styles.overlayContainer}>
        {/* Backdrop tap to dismiss */}
        <Pressable
          style={[
            styles.backdrop,
            {
              backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.45)',
            },
          ]}
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close bottom sheet backdrop"
        />

        {/* Sheet Content Card */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
            },
            contentStyle,
          ]}
        >
          {/* Top Drag Handle Indicator */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handleBar,
                {
                  backgroundColor: theme.colors.border,
                },
              ]}
            />
          </View>

          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                {title ? (
                  <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                ) : null}
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.closeIcon, { color: theme.colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sheet Body */}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopWidth: 1,
    paddingBottom: 32,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
