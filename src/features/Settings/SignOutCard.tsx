import { useRef, useState } from 'react';

import { router } from 'expo-router';

import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogRef,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { mobileTokenStorage, useLogoutMutation } from '@/lib/store';

import { SettingsCard } from './SettingsCard';

// Sign out. The shared authApi slice dispatches clearAuth (Redux) but knows
// nothing about expo-secure-store — web's refresh token lives in an HttpOnly
// cookie the browser drops, mobile's is a real value this app persists. So the
// keychain entry must be cleared here explicitly, or the refresh token survives
// a sign-out and the next launch silently restores the session.
export function SignOutCard() {
  const { t } = useTranslation(['nav', 'common']);
  const [logout] = useLogoutMutation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const alertRef = useRef<AlertDialogRef>(null);

  const onConfirm = async () => {
    setIsSigningOut(true);
    try {
      // Best-effort server revoke; the slice clears Redux either way.
      await logout()
        .unwrap()
        .catch(() => undefined);
      await mobileTokenStorage.clear();
    } finally {
      setIsSigningOut(false);
      alertRef.current?.dismiss();
      router.replace('/sign-in');
    }
  };

  return (
    <SettingsCard title={t('nav:logout')} testID="settings-signout-card">
      <Button
        variant="destructive"
        label={t('nav:logout')}
        onPress={() => alertRef.current?.present()}
        loading={isSigningOut}
        testID="signout-button"
      />

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('nav:logout')}</AlertDialogTitle>
          <AlertDialogDescription>{t('nav:logoutConfirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => void onConfirm()}>{t('nav:logout')}</AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </SettingsCard>
  );
}
