import Constants from 'expo-constants';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileCard, useAuthStore, useProfile } from '@/features/auth';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { Button, Card, ErrorState, OfflineBanner, ProfileCardSkeleton, Text } from '@/shared/ui';

export default function MoreScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { profile, isLoading, isError, error, refetch } = useProfile();
  const { signOut } = useAuthStore();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Constants.expoConfig?.android?.versionCode?.toString() ??
    Constants.expoConfig?.ios?.buildNumber ??
    '1';

  const handleSignOutPress = (): void => {
    if (Platform.OS === 'web') {
      // Web alert fallback
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to sign out of Prayatna Companion?')
          : true;
      if (confirmed) {
        void signOut();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Prayatna Companion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <OfflineBanner />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text variant="h1" style={styles.screenTitle}>
          More & Account
        </Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary, marginBottom: 20 }}>
          Manage your participant profile, hackathon credentials, and app preferences.
        </Text>

        {/* 5-State Profile Presentation */}
        {isLoading ? (
          <ProfileCardSkeleton />
        ) : isError ? (
          <ErrorState
            message={error?.userMessage ?? 'Unable to load your participant profile.'}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : profile ? (
          <ProfileCard profile={profile} />
        ) : (
          <ProfileCardSkeleton />
        )}

        {/* Event Resources Card */}
        <Card variant="default" style={styles.resourceCard}>
          <Text variant="label" style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
            HACKATHON RESOURCES
          </Text>

          <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
            <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
              Hacker Wi-Fi
            </Text>
            <Text variant="bodySm" style={{ fontWeight: '700' }}>
              Prayatna_Hacks_5G
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
            <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
              Wi-Fi Passcode
            </Text>
            <Text variant="bodySm" style={{ fontWeight: '700' }}>
              buildthefuture26
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodySm" style={{ color: theme.colors.textSecondary }}>
              Help Desk
            </Text>
            <Text variant="bodySm" style={{ fontWeight: '700' }}>
              Hall 4B, Innovation Lab
            </Text>
          </View>
        </Card>

        {/* Sign Out Button with Confirmation */}
        <View style={styles.signOutContainer}>
          <Button
            title="SIGN OUT"
            variant="danger"
            size="lg"
            fullWidth
            onPress={handleSignOutPress}
            accessibilityLabel="Sign out button"
            accessibilityHint="Opens confirmation dialog to sign out of the app"
          />
        </View>

        {/* App Version & Build Footer */}
        <View style={styles.footer}>
          <Text variant="caption" style={{ color: theme.colors.textMuted }}>
            {`Prayatna Companion v${appVersion} (Build ${buildNumber})`}
          </Text>
          <Text variant="caption" style={{ color: theme.colors.textMuted, marginTop: 4 }}>
            Medi-Caps University • Department of CSE
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    marginBottom: 6,
  },
  resourceCard: {
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  signOutContainer: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
