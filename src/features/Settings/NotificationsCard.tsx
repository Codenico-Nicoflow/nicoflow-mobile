import { Pressable, Text, View } from 'react-native';

import type { INotificationPref } from '@nicoflow/shared/types';
import { USER_STATUS } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useAppUser, useGetPreferencesQuery, useUpdatePreferencesMutation } from '@/lib/store';

import { SettingsCard } from './SettingsCard';

// The boolean prefs surfaced here. SMS is deliberately absent — it has no
// delivery path yet, so a toggle for it would be a broken promise. Same set and
// same Pro gating as web's NotificationsCard.
type ToggleKey = 'emailDigest' | 'morningDigestEnabled' | 'eveningDigestEnabled' | 'streaksEnabled';

const TOGGLES: { key: ToggleKey; labelKey: string; pro: boolean; testID: string }[] = [
  { key: 'emailDigest', labelKey: 'digest.label', pro: true, testID: 'pref-email-digest' },
  { key: 'morningDigestEnabled', labelKey: 'prefs.morningDigest', pro: false, testID: 'pref-morning-digest' },
  { key: 'eveningDigestEnabled', labelKey: 'prefs.eveningDigest', pro: false, testID: 'pref-evening-digest' },
  { key: 'streaksEnabled', labelKey: 'prefs.streaks', pro: true, testID: 'pref-streaks' },
];

// Preferences auto-save on toggle via PUT /notifications/preferences — no save
// button, matching web. Every control is disabled while a write is in flight so
// a value is never shown that isn't being committed.
export function NotificationsCard() {
  const { t } = useTranslation('notification');
  const { t: tc } = useTranslation('common');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  const { data: prefs, isLoading } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation();

  const onToggle = (key: ToggleKey, next: boolean) => {
    void updatePreferences({ [key]: next } as Partial<INotificationPref>);
  };

  return (
    <SettingsCard title={tc('pages.settings.notificationsSection')} testID="settings-notifications-card">
      {isLoading ? (
        <View className="gap-2" testID="notifications-loading">
          {TOGGLES.map(toggle => (
            <Skeleton key={toggle.key} className="h-10 w-full" />
          ))}
        </View>
      ) : (
        <View>
          {TOGGLES.map((toggle, index) => {
            const locked = toggle.pro && !isPro;
            // A disabled Switch swallows presses, so the whole row carries the
            // tap for locked rows — otherwise the upgrade hint is unreachable.
            const Row = locked ? Pressable : View;
            return (
              <Row
                key={toggle.key}
                onPress={locked ? () => toast.info(t('prefs.upgradeBody')) : undefined}
                className={`flex-row items-center justify-between py-2.5 ${
                  index < TOGGLES.length - 1 ? 'border-b border-border dark:border-border-dark' : ''
                }`}
                testID={toggle.testID}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <Text className="text-sm text-foreground dark:text-foreground-dark">{t(toggle.labelKey)}</Text>
                  {locked && (
                    <Text className="text-[10px] font-semibold uppercase text-muted-foreground dark:text-muted-foreground-dark">
                      {t('prefs.pro')}
                    </Text>
                  )}
                </View>

                <Switch
                  checked={Boolean(prefs?.[toggle.key]) && !locked}
                  disabled={locked || isSaving}
                  onCheckedChange={next => onToggle(toggle.key, next)}
                  testID={`${toggle.testID}-switch`}
                />
              </Row>
            );
          })}
        </View>
      )}
    </SettingsCard>
  );
}
