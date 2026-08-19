import { useTranslation } from 'react-i18next';

import { useAppUser, useUpdateProfileMutation } from '@/lib/store';

import { reloadApp } from './reload';
import { setLanguage, type SupportedLanguage } from '.';

// Mirrors web's usePreferences.changeLanguage (nicoflow-frontend/src/hooks/usePreferences.ts):
// logged out is local-only, logged in persists to the server profile first so
// server and client never disagree. Adds the RTL-restart step web doesn't need.
export function useLanguagePreference() {
  const { i18n } = useTranslation();
  const user = useAppUser();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const language = (i18n.resolvedLanguage ?? 'en') as SupportedLanguage;

  const changeLanguage = async (next: SupportedLanguage): Promise<{ requiresRestart: boolean }> => {
    if (user) await updateProfile({ language: next }).unwrap();
    return setLanguage(next);
  };

  return { language, changeLanguage, isUpdating, reloadApp };
}
