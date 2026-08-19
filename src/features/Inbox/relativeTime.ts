const UNITS: { limit: number; divisor: number; singular: string; plural: string }[] = [
  { limit: 60, divisor: 1, singular: 'second', plural: 'seconds' },
  { limit: 3600, divisor: 60, singular: 'minute', plural: 'minutes' },
  { limit: 86400, divisor: 3600, singular: 'hour', plural: 'hours' },
  { limit: 2592000, divisor: 86400, singular: 'day', plural: 'days' },
  { limit: 31536000, divisor: 2592000, singular: 'month', plural: 'months' },
  { limit: Infinity, divisor: 31536000, singular: 'year', plural: 'years' },
];

// Intl.RelativeTimeFormat is unavailable on-device Hermes in this Expo build
// (confirmed: "undefined cannot be used as a constructor" at runtime, despite
// compiling fine and working in the web export) — plain string formatting
// avoids the dependency entirely for one call site.
export const relativeTime = (isoDate: string, now: Date = new Date()): string => {
  const seconds = (now.getTime() - new Date(isoDate).getTime()) / 1000;
  if (seconds < 5) return 'just now';

  const { divisor, singular, plural } = UNITS.find(u => seconds < u.limit) ?? UNITS[UNITS.length - 1];
  const value = Math.round(seconds / divisor);
  return `${value} ${value === 1 ? singular : plural} ago`;
};
