import { Text, View } from 'react-native';

import type { QuotaStatus } from '@nicoflow/shared/utils';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

interface QuotaIndicatorProps {
  /** Derived quota, or undefined while the usage query is in flight / failed. */
  quota: QuotaStatus | undefined;
  isLoading?: boolean;
}

// The quota footer: "X / 500 this month" (Pro) or "X / 5 free messages" (Free),
// with a thin meter that turns destructive once the cap is hit. Purely
// presentational — the caller derives the status, so this renders in tests
// without a store. Mirrors web's QuotaIndicator.
export function QuotaIndicator({ quota, isLoading = false }: QuotaIndicatorProps) {
  const { t } = useTranslation('ai');

  // A failed usage read renders nothing rather than a misleading "0 / 0".
  if (isLoading) return <Skeleton className="mx-3 my-2 h-4 w-32" />;
  if (!quota) return null;

  const { used, limit, scope, state, percent } = quota;
  const exhausted = state === 'exhausted';
  const label = scope === 'lifetime' ? t('quota.freeLabel', { used, limit }) : t('quota.proLabel', { used, limit });

  return (
    <View className="border-t border-border dark:border-border-dark px-3 py-2" testID="ai-quota-indicator">
      <Text
        className={`text-xs ${exhausted ? 'text-destructive' : 'text-muted-foreground dark:text-muted-foreground-dark'}`}
        testID="ai-quota-label"
      >
        {label}
      </Text>
      <View
        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted dark:bg-muted-dark"
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: limit, now: Math.min(used, limit) }}
        testID="ai-quota-meter"
      >
        <View
          className={`h-full rounded-full ${exhausted ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${percent}%` }}
          testID="ai-quota-meter-fill"
        />
      </View>
    </View>
  );
}
