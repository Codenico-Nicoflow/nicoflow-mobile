import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemeOverride = 'light' | 'dark' | null;

const STORAGE_KEY = 'nicoflow.themeOverride';

interface ThemeOverrideContextValue {
  override: ThemeOverride;
  setOverride: (value: ThemeOverride) => void;
}

const ThemeOverrideContext = createContext<ThemeOverrideContextValue | null>(null);

// System-driven by default (AC5 baseline). An explicit in-app choice persists
// to AsyncStorage and is applied via Appearance.setColorScheme() — NativeWind
// v5 and React Navigation's ThemeProvider both read useColorScheme() off that
// same Appearance state, so this one call is enough to flip both. Passing
// null clears the override and returns to following the system.
export function ThemeOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<ThemeOverride>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark') {
        setOverrideState(stored);
        Appearance.setColorScheme(stored);
      }
    });
  }, []);

  const setOverride = (value: ThemeOverride) => {
    setOverrideState(value);
    // RN's Appearance.setColorScheme accepts null at runtime to clear back to
    // the system default — the installed @types are stale and only list
    // ColorSchemeName ('light' | 'dark' | 'unspecified'), so this needs a cast.
    Appearance.setColorScheme(value as Parameters<typeof Appearance.setColorScheme>[0]);
    if (value) {
      AsyncStorage.setItem(STORAGE_KEY, value);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  return <ThemeOverrideContext.Provider value={{ override, setOverride }}>{children}</ThemeOverrideContext.Provider>;
}

export function useThemeOverride() {
  const ctx = useContext(ThemeOverrideContext);
  if (!ctx) throw new Error('useThemeOverride must be used within a ThemeOverrideProvider');
  return ctx;
}
