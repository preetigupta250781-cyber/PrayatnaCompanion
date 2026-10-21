import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Prayatna Companion',
  slug: 'prayatna-companion',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'prayatnacompanion',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'org.prayatna.companion',
    icon: './assets/expo.icon',
    supportsTablet: false,
  },
  android: {
    ...config.android,
    package: 'org.prayatna.companion',
    versionCode: 1,
    permissions: [],
    blockedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey:
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
      },
    },
  },
  web: {
    ...config.web,
    output: 'server',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
    '@sentry/react-native',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
