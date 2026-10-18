import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import renderer from 'react-test-renderer';

import { authApi, useAuthStore } from '@/features/auth';
import { AppError } from '@/shared/lib/errors';

import LoginScreen from '../login';

describe('LoginScreen (app/(auth)/login.tsx)', () => {
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isInitialized: true,
      authNotice: null,
    });
  });

  afterEach(() => {
    if (tree) {
      renderer.act(() => {
        tree?.unmount();
      });
      tree = null;
    }
  });

  it('renders login form elements and forgot password note', () => {
    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Prayatna');
    expect(json).toContain('HACKER EMAIL');
    expect(json).toContain('PASSWORD');
    expect(json).toContain('SIGN IN');
    expect(json).toContain('Forgot password? Contact the organizers.');
  });

  it('validates inline: shows errors when submitting empty form', () => {
    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const signInButton = tree?.root.findByProps({ accessibilityLabel: 'Sign in button' });

    renderer.act(() => {
      signInButton?.props.onPress();
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Email is required');
    expect(json).toContain('Password is required');
  });

  it('validates inline: shows error for invalid email format', () => {
    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const emailInput = tree?.root.findByProps({ accessibilityLabel: 'Email input' });
    const passwordInput = tree?.root.findByProps({ accessibilityLabel: 'Password input' });
    const signInButton = tree?.root.findByProps({ accessibilityLabel: 'Sign in button' });

    renderer.act(() => {
      emailInput?.props.onChangeText('invalid-email');
      passwordInput?.props.onChangeText('Password123');
    });

    renderer.act(() => {
      signInButton?.props.onPress();
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Please enter a valid email address');
  });

  it('toggles password visibility with SHOW / HIDE button', () => {
    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const passwordInput = tree?.root.findByProps({ accessibilityLabel: 'Password input' });
    expect(passwordInput?.props.secureTextEntry).toBe(true);

    const toggleBtn = tree?.root.findByProps({ accessibilityLabel: 'Show password' });
    renderer.act(() => {
      toggleBtn?.props.onPress();
    });

    const updatedPasswordInput = tree?.root.findByProps({ accessibilityLabel: 'Password input' });
    expect(updatedPasswordInput?.props.secureTextEntry).toBe(false);
  });

  it('signs in successfully with valid credentials and updates auth session', async () => {
    const mockUser = {
      id: 'usr-1',
      email: 'aarav@medicaps.ac.in',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
      token_type: 'bearer' as const,
      user: mockUser,
    };

    jest.spyOn(authApi, 'signInWithPassword').mockResolvedValue({
      session: mockSession,
      user: mockUser,
    });

    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const emailInputs = tree?.root.findAllByType(TextInput);
    const emailInput = emailInputs?.[0];
    const passwordInput = emailInputs?.[1];
    const touchables = tree?.root.findAllByType(TouchableOpacity);
    const signInButton = touchables?.[touchables.length - 1];

    renderer.act(() => {
      emailInput?.props.onChangeText('aarav@medicaps.ac.in');
      passwordInput?.props.onChangeText('StrongPass123!');
    });

    await renderer.act(async () => {
      await signInButton?.props.onPress();
    });

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.user).toEqual(mockUser);
  });

  it('displays distinct error message for invalid credentials (AUTH_INVALID_CREDENTIALS)', async () => {
    jest.spyOn(authApi, 'signInWithPassword').mockRejectedValue(
      new AppError({
        code: 'AUTH_INVALID_CREDENTIALS',
        userMessage: 'Invalid email or password. Please verify your credentials.',
        retryable: false,
      })
    );

    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const emailInput = tree?.root.findByProps({ accessibilityLabel: 'Email input' });
    const passwordInput = tree?.root.findByProps({ accessibilityLabel: 'Password input' });
    const signInButton = tree?.root.findByProps({ accessibilityLabel: 'Sign in button' });

    renderer.act(() => {
      emailInput?.props.onChangeText('wrong@medicaps.ac.in');
      passwordInput?.props.onChangeText('WrongPassword');
    });

    await renderer.act(async () => {
      await signInButton?.props.onPress();
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Invalid email or password. Please verify your credentials.');
  });

  it('displays distinct error message for network disconnection (NETWORK_DISCONNECTED)', async () => {
    jest.spyOn(authApi, 'signInWithPassword').mockRejectedValue(
      new AppError({
        code: 'NETWORK_DISCONNECTED',
        userMessage: 'Network connection failed. Please check your internet connection.',
        retryable: true,
      })
    );

    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const emailInput = tree?.root.findByProps({ accessibilityLabel: 'Email input' });
    const passwordInput = tree?.root.findByProps({ accessibilityLabel: 'Password input' });
    const signInButton = tree?.root.findByProps({ accessibilityLabel: 'Sign in button' });

    renderer.act(() => {
      emailInput?.props.onChangeText('participant@medicaps.ac.in');
      passwordInput?.props.onChangeText('AnyPassword');
    });

    await renderer.act(async () => {
      await signInButton?.props.onPress();
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Network connection failed. Please check your internet connection.');
  });

  it('displays authNotice flash alert when redirected due to missing profile or expired token', () => {
    renderer.act(() => {
      useAuthStore.setState({
        authNotice: 'Your account does not have an active participant profile.',
      });
    });

    renderer.act(() => {
      tree = renderer.create(<LoginScreen />);
    });

    const json = JSON.stringify(tree?.toJSON());
    expect(json).toContain('Your account does not have an active participant profile.');
  });
});
