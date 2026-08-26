import { formatDuration, type GentleDateResult, resolveGentleDate } from '@nicoflow/shared/utils';

export { formatDuration, resolveGentleDate as formatTaskGentleDate };
export type { GentleDateResult };

export const gentleDateLabel = (result: GentleDateResult): string => {
  switch (result.kind) {
    case 'scheduledToday':
      return 'Today';
    case 'scheduledTomorrow':
      return 'Tomorrow';
    case 'carriedOver':
      return 'Carried over';
    case 'scheduledFuture':
    case 'passedNotRolling':
      return result.formattedDate;
  }
};

// Mirrors web's SOFT_CHIP/NEUTRAL_CHIP (nicoflow-frontend/src/features/Tasks/utils/index.tsx):
// today/tomorrow get the "soft" sky tone, everything else (carried over,
// future, passed-not-rolling) stays neutral — no red anywhere, a past date
// is never an alarm.
const SOFT_CHIP_CLASS = 'border-sky-500/30 bg-sky-500/10';
const SOFT_CHIP_TEXT_CLASS = 'text-sky-600 dark:text-sky-400';
const NEUTRAL_CHIP_CLASS = 'border-border dark:border-border-dark bg-muted dark:bg-muted-dark';
const NEUTRAL_CHIP_TEXT_CLASS = 'text-muted-foreground dark:text-muted-foreground-dark';

export const gentleDateChipClass = (result: GentleDateResult): string =>
  result.kind === 'scheduledToday' || result.kind === 'scheduledTomorrow' ? SOFT_CHIP_CLASS : NEUTRAL_CHIP_CLASS;

export const gentleDateChipTextClass = (result: GentleDateResult): string =>
  result.kind === 'scheduledToday' || result.kind === 'scheduledTomorrow'
    ? SOFT_CHIP_TEXT_CLASS
    : NEUTRAL_CHIP_TEXT_CLASS;
