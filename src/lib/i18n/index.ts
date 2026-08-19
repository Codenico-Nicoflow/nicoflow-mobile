import { en, he, ru } from '@nicoflow/shared/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

export const SUPPORTED_LANGUAGES = ['en', 'he', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Mirrors nicoflow-frontend's localStorage key, swapped for AsyncStorage —
// same "one key, side by side with the theme preference" convention.
export const LANGUAGE_STORAGE_KEY = 'nicoflow-lang';

// Same namespace split as web (nicoflow-frontend/src/lib/i18n/index.ts) —
// keep the two lists in sync when either side adds a namespace.
export const NAMESPACES = [
  'common',
  'auth',
  'area',
  'project',
  'task',
  'bucket',
  'nav',
  'errors',
  'notification',
  'ai',
  'recurrence',
  'notes',
  'habits',
] as const;

const isSupported = (lng: string): lng is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(lng);

// No i18next-browser-languagedetector equivalent on RN — that plugin reads
// navigator/localStorage, neither of which exist here. Resolve once at
// startup instead: an AsyncStorage override wins, otherwise fall back to the
// device's preferred locale (expo-localization), otherwise English.
export async function resolveInitialLanguage(): Promise<SupportedLanguage> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isSupported(stored)) return stored;

  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  if (deviceLanguageCode && isSupported(deviceLanguageCode)) return deviceLanguageCode;

  return 'en';
}

export const isRTLLanguage = (lng: SupportedLanguage): boolean => lng === 'he';

// Text content updates immediately via i18n.changeLanguage. Layout direction
// does not: I18nManager.forceRTL only takes effect on the next app reload
// (RN restriction — see reload.ts), so a switch across the RTL boundary
// (en/ru <-> he) returns true and the caller is responsible for prompting a
// restart. Re-forcing the same direction is a no-op, so this is safe to call
// on every switch, not just boundary-crossing ones.
export async function setLanguage(lng: SupportedLanguage): Promise<{ requiresRestart: boolean }> {
  const wasRTL = I18nManager.isRTL;
  const willBeRTL = isRTLLanguage(lng);

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);

  if (wasRTL !== willBeRTL) {
    I18nManager.allowRTL(willBeRTL);
    I18nManager.forceRTL(willBeRTL);
    return { requiresRestart: true };
  }
  return { requiresRestart: false };
}

// Resources are bundled statically (same as web), so init is synchronous —
// callers that need the resolved-from-storage/device language must await
// initI18n() once at app startup before rendering (see App's root layout).
export async function initI18n(): Promise<void> {
  const lng = await resolveInitialLanguage();

  // Align I18nManager with the resolved language before first paint. This is
  // a no-op if it already matches (e.g. a fresh install where the device
  // locale and native RTL state already agree) — forceRTL only actually
  // changes anything, and needs a reload, when it flips the current value.
  I18nManager.allowRTL(isRTLLanguage(lng));
  I18nManager.forceRTL(isRTLLanguage(lng));

  await i18n.use(initReactI18next).init({
    resources: { en, he, ru },
    lng,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'common',
    returnNull: false,
    interpolation: { escapeValue: false }, // React already escapes
  });
}

export default i18n;
