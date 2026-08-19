import type { SummarizableRule } from '@nicoflow/shared/utils';
import { summarizeRecurrence } from '@nicoflow/shared/utils';
import { useTranslation } from 'react-i18next';

// Ported from web's useRecurrenceSummary (nicoflow-frontend/src/components/
// RecurrenceField/useRecurrenceSummary.ts) — same shared summarizeRecurrence
// descriptor, same recurrence:* keys, so the two platforms read identically.
export const useRecurrenceSummary = () => {
  const { t } = useTranslation('recurrence');

  return (rule: SummarizableRule): string => {
    const s = summarizeRecurrence(rule);
    const days = s.weekdays.map(d => t(`weekdayShort.${d}` as 'weekdayShort.0')).join(', ');

    const base =
      s.key === 'summary.weekly'
        ? t('summary.weekly', { count: s.count, days })
        : s.key === 'summary.monthly'
          ? t('summary.monthly', { count: s.count, day: s.day })
          : s.key === 'summary.monthlyLast'
            ? t('summary.monthlyLast', { count: s.count })
            : s.key === 'summary.yearly'
              ? t('summary.yearly', { count: s.count })
              : s.key === 'freq.weekly'
                ? t('freq.weekly')
                : t('summary.daily', { count: s.count });

    return s.endDate ? t('summary.until', { summary: base, date: s.endDate }) : base;
  };
};
