/**
 * Theme tokens for Prayatna Companion.
 * Features a dark, hackathon-style aesthetic with an accent color defined in one place.
 */

// Accent color defined in one place for branding and theming
export const ACCENT_COLOR = '#00F0FF' as const;
export const ACCENT_COLOR_MUTED = 'rgba(0, 240, 255, 0.15)' as const;
export const ACCENT_COLOR_GLOW = 'rgba(0, 240, 255, 0.35)' as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  border: string;
  borderFocus: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  accentGlow: string;
  card: string;
  cardBorder: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  badge: string;
  success: string;
  warning: string;
  error: string;
}

export const colors: { dark: ThemeColors; light: ThemeColors } = {
  dark: {
    background: '#08090E',
    surface: '#10131B',
    surfaceElevated: '#171C28',
    surfaceHighlight: '#222A3E',
    border: '#1E2538',
    borderFocus: ACCENT_COLOR,
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    accent: ACCENT_COLOR,
    accentMuted: ACCENT_COLOR_MUTED,
    accentGlow: ACCENT_COLOR_GLOW,
    card: '#10131B',
    cardBorder: '#1E2538',
    tabBar: '#0C0F17',
    tabBarBorder: '#1A2133',
    tabBarActive: ACCENT_COLOR,
    tabBarInactive: '#64748B',
    badge: '#171C28',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    surfaceHighlight: '#E2E8F0',
    border: '#CBD5E1',
    borderFocus: ACCENT_COLOR,
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    accent: ACCENT_COLOR,
    accentMuted: ACCENT_COLOR_MUTED,
    accentGlow: ACCENT_COLOR_GLOW,
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabBarActive: ACCENT_COLOR,
    tabBarInactive: '#94A3B8',
    badge: '#F1F5F9',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
};

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  typography: Typography;
}
