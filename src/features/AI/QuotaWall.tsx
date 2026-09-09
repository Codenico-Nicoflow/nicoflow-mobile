import { Text, View } from 'react-native';

import type { QuotaStatus } from '@nicoflow/shared/utils';
import { CalendarClock, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

interface QuotaWallProps {
  quota: QuotaStatus;
}

// What replaces the composer once the quota is spent. Two distinct surfaces:
//
//   Free (lifetime cap) → the block is liftable, so say how. Mobile ships as a
//     reader app (E-037 billing posture), so this is plain copy pointing at the
//     web app — NOT an in-app purchase CTA, which would breach store policy.
//   Pro (monthly cap)   → a "resets next month" notice. There is nothing to buy;
//     an upsell here would be a dark pattern. Same rule as web.
export function QuotaWall({ quota }: QuotaWallProps) {
  const { t } = useTranslation('ai');
  const colors = useTheme();

  if (!quota.canUpgrade) {
    return (
      <View
        className="items-center gap-1.5 border-t border-border dark:border-border-dark px-4 py-5"
        accessibilityRole="alert"
        testID="ai-quota-reset-notice"
      >
        <CalendarClock size={20} color={colors.textSecondary} />
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark text-center">
          {t('quota.proExhaustedTitle')}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark text-center">
          {t('quota.proExhaustedDescription')}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="items-center gap-1.5 border-t border-border dark:border-border-dark px-4 py-5"
      accessibilityRole="alert"
      testID="ai-quota-wall"
    >
      <Sparkles size={20} color={colors.primary} />
      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark text-center">
        {t('quota.freeExhaustedTitle')}
      </Text>
      <Text
        className="text-xs text-muted-foreground dark:text-muted-foreground-dark text-center"
        testID="ai-quota-upgrade-hint"
      >
        {t('quota.upgradeOnWeb')}
      </Text>
    </View>
  );
}
