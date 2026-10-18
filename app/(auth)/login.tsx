import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi, loginFormSchema, useAuthStore } from '@/features/auth';
import { useAppTheme } from '@/shared/hooks/use-theme';
import { AppError, mapToAppError } from '@/shared/lib/errors';
import { Badge, Button, Card, Input, Text } from '@/shared/ui';

export default function LoginScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const { setSession, authNotice, clearAuthNotice } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [generalError, setGeneralError] = useState<string | undefined>();

  const validate = (): boolean => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setGeneralError(undefined);

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      const formatted = result.error.format();
      if (formatted.email?._errors[0]) {
        setEmailError(formatted.email._errors[0]);
      }
      if (formatted.password?._errors[0]) {
        setPasswordError(formatted.password._errors[0]);
      }
      return false;
    }
    return true;
  };

  const handleSignIn = async (): Promise<void> => {
    if (!validate()) return;

    clearAuthNotice();
    setIsSubmitting(true);

    try {
      const { session } = await authApi.signInWithPassword({
        email: email.trim(),
        password,
      });
      setSession(session);
    } catch (err: unknown) {
      const appErr: AppError = mapToAppError(err);

      if (appErr.code === 'AUTH_INVALID_CREDENTIALS') {
        setGeneralError('Invalid email or password. Please verify your credentials.');
      } else if (appErr.code === 'NETWORK_DISCONNECTED' || appErr.code === 'NETWORK_TIMEOUT') {
        setGeneralError('Network connection failed. Please check your internet connection.');
      } else {
        setGeneralError(appErr.userMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeNotice = generalError ?? authNotice;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Hackathon Badge */}
          <View style={styles.badgeRow}>
            <Badge label="PRAYATNA 2026 // HACKATHON" variant="accent" size="sm" />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" style={styles.title}>
              Prayatna
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              Official hacker companion portal. Sign in to access your squad, schedule, and problem
              statements.
            </Text>
          </View>

          {/* Flash Notice / Error Banner */}
          {activeNotice ? (
            <Card
              variant="outlined"
              style={[
                styles.noticeCard,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: generalError ? theme.colors.error : theme.colors.warning,
                },
              ]}
              accessibilityLabel={activeNotice}
            >
              <Text
                variant="bodySm"
                style={{
                  color: generalError ? theme.colors.error : theme.colors.warning,
                  fontWeight: '600',
                }}
              >
                {activeNotice}
              </Text>
            </Card>
          ) : null}

          {/* Credentials Card */}
          <Card variant="default" style={styles.card}>
            <Input
              label="HACKER EMAIL"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
              }}
              placeholder="participant@medicaps.ac.in"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              errorText={emailError}
              disabled={isSubmitting}
              accessibilityLabel="Email input"
            />

            <View style={styles.inputSpacing}>
              <Input
                label="PASSWORD"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(undefined);
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                errorText={passwordError}
                disabled={isSubmitting}
                accessibilityLabel="Password input"
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: theme.colors.accent, fontWeight: '700' }}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </Text>
                  </TouchableOpacity>
                }
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="SIGN IN"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSignIn}
                loading={isSubmitting}
                disabled={isSubmitting}
                accessibilityLabel="Sign in button"
              />
            </View>

            {/* Note: Forgot Password */}
            <Text variant="caption" style={[styles.helpText, { color: theme.colors.textMuted }]}>
              Forgot password? Contact the organizers.
            </Text>
          </Card>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  badgeRow: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  noticeCard: {
    marginBottom: 18,
    padding: 12,
  },
  card: {
    padding: 20,
  },
  inputSpacing: {
    marginTop: 16,
  },
  eyeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  helpText: {
    textAlign: 'center',
    marginTop: 16,
  },
});
