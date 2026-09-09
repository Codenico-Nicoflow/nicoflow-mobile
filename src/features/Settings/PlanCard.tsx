import { Text, View } from 'react-native';

import { USER_STATUS } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Radius } from '@/constants/theme';
import { useAppUser } from '@/lib/store';

import { SettingsCard } from './SettingsCard';

// Plan status, read-only. Mobile ships as a reader app (E-037 billing posture):
// this card must never contain a purchase affordance — no button, no
// Linking.openURL to a checkout, not even a tappable link. Free users get static
// copy pointing at the web app. Enforced by a test that asserts no button or
// link role exists in the render tree for either plan.
export function PlanCard() {
  const { t } = useTranslation('common');
  const user = useAppUser();
  const isPro = user?.status === USER_STATUS.PREMIUM;

  return (
    <SettingsCard title={t('pages.settings.planSection')} testID="settings-plan-card">
      <View className="flex-row items-center gap-2">
        <View
          className={`px-2.5 py-1 ${isPro ? 'bg-primary' : 'bg-muted dark:bg-muted-dark'}`}
          style={{ borderRadius: Radius.full }}
          testID="plan-badge"
        >
          <Text
            className={`text-xs font-semibold ${
              isPro ? 'text-primary-foreground' : 'text-muted-foreground dark:text-muted-foreground-dark'
            }`}
          >
            {isPro ? t('pages.settings.proPlan') : t('pages.settings.freePlan')}
          </Text>
        </View>
      </View>

      {!isPro && (
        <Text className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground-dark" testID="plan-upgrade-hint">
          {t('pages.settings.planUpgradeHint')}
        </Text>
      )}
    </SettingsCard>
  );
}
