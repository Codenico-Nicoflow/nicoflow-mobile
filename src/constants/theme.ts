/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

import '@/global.css';

// Mirrors nicoflow-frontend's src/index.css CSS custom properties (Indigo +
// Slate palette) so the mobile app reads as the same product, not a generic
// Expo template. Keep these two in sync by hand — there's no shared token
// package yet (candidate for @nicoflow/shared once mobile has more screens).
export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    background: '#f8fafc',
    backgroundElement: '#eef2f7',
    backgroundSelected: '#e2e8f0',
    card: '#ffffff',
    border: '#e2e8f0',
    // Matches web's --input token — inputs use a distinct (here: identical,
    // but tracked separately so it can diverge like web's does) border color
    // from generic dividers/cards.
    inputBorder: '#e2e8f0',
    ring: '#4f46e5',
    primary: '#4f46e5',
    primaryForeground: '#ffffff',
    destructive: '#dc2626',
    success: '#16a34a',
  },
  dark: {
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    background: '#0b1120',
    backgroundElement: '#1e293b',
    backgroundSelected: '#283549',
    card: '#111a2e',
    border: '#1e293b',
    inputBorder: '#283549',
    ring: '#6366f1',
    primary: '#6366f1',
    primaryForeground: '#ffffff',
    destructive: '#ef4444',
    success: '#22c55e',
  },
} as const;

// Mirrors nicoflow-frontend's --shadow-sm/md/lg (src/index.css) — RN's shadow
// props instead of CSS box-shadow. Android needs `elevation` too (iOS ignores
// it, Android ignores shadowOffset/Radius/Opacity), so every level sets both.
export const Shadows = {
  xs: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Mirrors nicoflow-frontend's --radius-sm/md/lg/xl (src/index.css).
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
