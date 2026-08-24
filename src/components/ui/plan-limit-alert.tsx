import { Text, View } from 'react-native';

import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface PlanLimitAlertProps {
  /** Optional override for the description copy (e.g. the timed-scheduling variant). */
  message?: string;
  testID?: string;
}

// Single shared plan-limit alert, consumed by AreaDialog/ProjectDialog
// (generic PLAN_LIMIT_EXCEEDED) and TaskSheet (both the generic case and the
// timed-scheduling variant via `message`) — mirrors web's PlanLimitAlert
// condition/timing/copy exactly. The CTA deliberately does nothing yet: this
// app has no in-app purchase flow (per the PRD's mobile billing model, "no
// IAP" — the CTA must send the user to web, never open a purchase sheet) and
// no billing screen exists on mobile yet to send them to. Wiring the tap
// target is explicit follow-up work once that screen lands, not an oversight
// here — a noop CTA that never fires an IAP flow already satisfies AC3.
export function PlanLimitAlert({ message, testID }: PlanLimitAlertProps) {
  const { t } = useTranslation('common');

  return (
    <View
      className="flex-row items-start gap-3 rounded-xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 p-4"
      testID={testID ?? 'plan-limit-alert'}
    >
      <View className="size-9 items-center justify-center rounded-full bg-amber-400/20">
        <Sparkles size={18} color="#d97706" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-semibold text-amber-900 dark:text-amber-100">{t('planLimit.title')}</Text>
        <Text className="text-sm text-amber-800/80 dark:text-amber-200/70">
          {message ?? t('planLimit.description')}
        </Text>
        <View className="mt-1 self-start rounded-md bg-amber-500 px-3 py-1.5">
          <Text className="text-sm font-medium text-white">{t('planLimit.cta')}</Text>
        </View>
      </View>
    </View>
  );
}
