// Jest setup for Prayatna Companion

// Set mock environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-with-sufficient-length';

// Mock Sentry React Native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: <T>(component: T): T => component,
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => {
  const config = {
    version: '1.0.0',
    android: {
      versionCode: 1,
    },
    ios: {
      buildNumber: '1',
    },
  };
  return {
    __esModule: true,
    default: {
      expoConfig: config,
    },
    expoConfig: config,
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __store: store,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');

  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (comp: unknown): unknown => comp,
    },
    useSharedValue: (init: unknown): { value: unknown } => ({ value: init }),
    useAnimatedStyle: <T>(fn: () => T): T => fn(),
    useReducedMotion: jest.fn(() => false),
    withRepeat: <T>(anim: T): T => anim,
    withTiming: <T>(toValue: T): T => toValue,
    withSpring: <T>(toValue: T): T => toValue,
    withSequence: <T>(...anims: T[]): T | undefined => anims[0],
    useDerivedValue: <T>(fn: () => T): { value: T } => ({ value: fn() }),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

// Mock @react-native-community/netinfo

jest.mock('@react-native-community/netinfo', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-safe-area-context
jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default
);
