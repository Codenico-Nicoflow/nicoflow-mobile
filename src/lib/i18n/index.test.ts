import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n, {
  initI18n,
  isRTLLanguage,
  LANGUAGE_STORAGE_KEY,
  resolveInitialLanguage,
  setLanguage,
  SUPPORTED_LANGUAGES,
} from '.';

beforeAll(async () => {
  await initI18n();
});

afterEach(async () => {
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage('en');
});

describe('i18n configuration', () => {
  it('supports exactly en, he and ru', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'he', 'ru']);
  });

  it('falls back to English', () => {
    expect(i18n.options.fallbackLng).toContain('en');
  });

  it('resolves a known key in all three languages', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common:actions.cancel')).toBe('Cancel');

    await i18n.changeLanguage('he');
    expect(i18n.t('common:actions.cancel')).toBe('ביטול');

    await i18n.changeLanguage('ru');
    expect(i18n.t('common:actions.cancel')).toBe('Отмена');
  });
});

describe('resolveInitialLanguage', () => {
  it('defaults to English when nothing is stored and the device locale is unsupported', async () => {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    expect(await resolveInitialLanguage()).toBe('en');
  });

  it('prefers a stored language over the device locale', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'he');
    expect(await resolveInitialLanguage()).toBe('he');
  });

  it('ignores a stored value outside the supported set', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(await resolveInitialLanguage()).toBe('en');
  });
});

describe('isRTLLanguage', () => {
  it('is true only for Hebrew', () => {
    expect(isRTLLanguage('he')).toBe(true);
    expect(isRTLLanguage('en')).toBe(false);
    expect(isRTLLanguage('ru')).toBe(false);
  });
});

describe('setLanguage', () => {
  it('persists the choice and updates the active i18n language', async () => {
    const result = await setLanguage('ru');
    expect(result.requiresRestart).toBe(false); // en -> ru stays LTR
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ru');
    expect(i18n.resolvedLanguage).toBe('ru');
  });

  it('flags a restart when crossing the RTL boundary', async () => {
    const result = await setLanguage('he');
    expect(result.requiresRestart).toBe(true); // en -> he crosses LTR/RTL
  });
});
