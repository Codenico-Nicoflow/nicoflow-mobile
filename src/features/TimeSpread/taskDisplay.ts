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
