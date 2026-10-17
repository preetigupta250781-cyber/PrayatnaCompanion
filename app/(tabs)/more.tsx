import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { useAuthStore } from '@/features/auth';

export default function MoreScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { user, signOut } = useAuthStore();

  const handleSignOut = (): void => {
    void signOut();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings & Info</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Event resources, network details, and account configuration.
      </Text>

      {/* Account Info Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.cardHeader, { color: theme.colors.textSecondary }]}>
          CURRENT SESSION
        </Text>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.email ?? 'Authenticated Hacker'}
        </Text>
        <Text style={[styles.userRole, { color: theme.colors.accent }]}>Role: Participant</Text>
      </View>

      {/* Venue & Network Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.cardHeader, { color: theme.colors.textSecondary }]}>
          EVENT RESOURCES
        </Text>

        <View style={styles.resourceRow}>
          <Text style={[styles.resourceLabel, { color: theme.colors.textSecondary }]}>
            Hacker Wi-Fi:
          </Text>
          <Text style={[styles.resourceValue, { color: theme.colors.text }]}>Prayatna_Hacks_5G</Text>
        </View>

        <View style={styles.resourceRow}>
          <Text style={[styles.resourceLabel, { color: theme.colors.textSecondary }]}>
            Wi-Fi Passcode:
          </Text>
          <Text style={[styles.resourceValue, { color: theme.colors.text }]}>buildthefuture26</Text>
        </View>

        <View style={styles.resourceRow}>
          <Text style={[styles.resourceLabel, { color: theme.colors.textSecondary }]}>
            Venue Desk:
          </Text>
          <Text style={[styles.resourceValue, { color: theme.colors.text }]}>
            Hall 4B, Innovation Lab
          </Text>
        </View>
      </View>

      {/* Sign Out Button to test Auth Gate transition */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSignOut}
        style={[
          styles.signOutButton,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.error,
          },
        ]}
      >
        <Text style={[styles.signOutText, { color: theme.colors.error }]}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2133',
  },
  resourceLabel: {
    fontSize: 13,
  },
  resourceValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  signOutButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
