import { View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangePasswordFormData, changePasswordSchema } from '@nicoflow/shared/schemas';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useChangePasswordMutation } from '@/lib/store';
import { getApiErrorCode, resolveApiErrorMessage } from '@/lib/utils/apiError';

import { SettingsCard } from './SettingsCard';

const EMPTY: ChangePasswordFormData = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Settings › Security. Changing the password revokes every refresh token
// server-side, so the current session's stored token is invalidated too — the
// user stays signed in on this device via the fresh pair the endpoint returns.
export function SecurityCard() {
  const { t } = useTranslation('common');
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const { control, handleSubmit, reset, setError } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await changePassword(values).unwrap();
      reset(EMPTY);
      toast.success(t('pages.settings.changePasswordButton'));
    } catch (err) {
      // A wrong current password is a field error, not a toast — it belongs
      // next to the input the user has to correct.
      if (getApiErrorCode(err) === 'INVALID_CREDENTIALS') {
        setError('currentPassword', { message: t('pages.settings.currentPasswordIncorrect') });
        return;
      }
      toast.error(resolveApiErrorMessage(err));
    }
  });

  return (
    <SettingsCard title={t('pages.settings.securitySection')} testID="settings-security-card">
      <View className="gap-3">
        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Input
              label={t('pages.settings.currentPasswordLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoCapitalize="none"
              testID="security-current-password"
            />
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <Input
              label={t('pages.settings.newPasswordLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoCapitalize="none"
              testID="security-new-password"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Input
              label={t('pages.settings.confirmPasswordLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              autoCapitalize="none"
              testID="security-confirm-password"
            />
          )}
        />

        <Button
          label={isLoading ? t('pages.settings.changingPasswordButton') : t('pages.settings.changePasswordButton')}
          onPress={() => void onSubmit()}
          loading={isLoading}
          testID="security-submit"
        />
      </View>
    </SettingsCard>
  );
}
