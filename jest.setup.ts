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
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    android: {
      versionCode: 1,
    },
    ios: {
      buildNumber: '1',
    },
  },
}));

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
