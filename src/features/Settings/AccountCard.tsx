import { Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ProfileFormData, profileSchema } from '@nicoflow/shared/schemas';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';
import { resolveApiErrorMessage } from '@/lib/utils/apiError';

import { SettingsCard } from './SettingsCard';

// Settings › Account. Edits firstName/lastName via PATCH /users/profile.
// email and username are login credentials — shown read-only, never editable
// here (same rule as web, and NIC-1610's email-takeover finding).
export function AccountCard() {
  const { t } = useTranslation('common');
  const user = useAppUser();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const { control, handleSubmit, formState } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await updateProfile(values).unwrap();
      toast.success(t('pages.settings.saveButton'));
    } catch (err) {
      toast.error(resolveApiErrorMessage(err));
    }
  });

  return (
    <SettingsCard title={t('pages.settings.accountSection')} testID="settings-account-card">
      <View className="gap-3">
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Input
              label={t('pages.settings.firstNameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoComplete="given-name"
              testID="account-first-name"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <Input
              label={t('pages.settings.lastNameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoComplete="family-name"
              testID="account-last-name"
            />
          )}
        />

        <ReadOnlyField label={t('pages.settings.emailLabel')} value={user?.email ?? ''} />
        <ReadOnlyField label={t('pages.settings.usernameLabel')} value={user?.username ?? ''} />

        <Button
          label={isLoading ? t('pages.settings.savingButton') : t('pages.settings.saveButton')}
          onPress={() => void onSubmit()}
          loading={isLoading}
          disabled={!formState.isDirty}
          testID="account-save"
        />
      </View>
    </SettingsCard>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation('common');

  return (
    <View>
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        {label} ({t('pages.settings.readOnlyHint')})
      </Text>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}
