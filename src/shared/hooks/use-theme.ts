import { useColorScheme } from 'react-native';
import {
  colors,
  spacing,
  radius,
  typography,
  ACCENT_COLOR,
  AppTheme,
  ThemeColors,
} from '@/config/theme';

export function useAppTheme(): AppTheme {
  const systemColorScheme = useColorScheme();
  // Default to dark mode for the hackathon-style look
  const isDark = systemColorScheme !== 'light';
  const themeColors: ThemeColors = isDark ? colors.dark : colors.light;

  return {
    isDark,
    colors: themeColors,
    spacing,
    radius,
    typography,
  };
}

export { ACCENT_COLOR };
