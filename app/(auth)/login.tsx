import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { useAuthStore } from '@/features/auth';

export default function LoginScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoSignIn = (): void => {
    setIsLoading(true);
    // Simulate setting session to test the auth gate transitioning to /(tabs)
    const mockUser: User = {
      id: 'demo-user-id',
      app_metadata: {},
      user_metadata: { name: 'Hacker' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    setTimeout(() => {
      setSession(mockSession);
      setIsLoading(false);
    }, 400);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Hackathon Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.badge,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.badgeDot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>
              PRAYATNA 2026 // COMPANION
            </Text>
          </View>

          {/* Title and Subtitle */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Prayatna</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Official hackathon companion portal. Sign in to access your team dashboard, schedule,
              and problem statements.
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                HACKER EMAIL
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="hacker@prayatna.org"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>PASSWORD</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
              />
            </View>

            {/* Placeholder Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDemoSignIn}
              disabled={isLoading}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.accent,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#08090E" />
              ) : (
                <Text style={styles.primaryButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            {/* Demo / Guest Bypass for quick testing */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDemoSignIn}
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceHighlight,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                ENTER AS GUEST / DEMO
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            Secured with Supabase Auth & SecureStore
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#08090E',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
  },
});
