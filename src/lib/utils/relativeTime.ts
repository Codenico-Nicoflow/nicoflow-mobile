// Lightweight relative-time formatter — no date-fns dependency in this repo
// yet, and this is the only current consumer (NoteRow's updatedAt stamp).
const UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
];

export const formatRelativeTime = (isoDate: string, now: Date = new Date()): string => {
  const then = new Date(isoDate);
  const diffSeconds = Math.round((then.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const { limit, divisor, unit } of UNITS) {
    if (absSeconds < limit) {
      return rtf.format(Math.round(diffSeconds / divisor), unit);
    }
  }
  return rtf.format(Math.round(diffSeconds / 31557600), 'year');
};
