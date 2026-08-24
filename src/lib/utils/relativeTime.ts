// Lightweight relative-time formatter — no date-fns dependency in this repo
// yet, and this is the only current consumer (NoteRow's updatedAt stamp).
// Deliberately NOT Intl.RelativeTimeFormat: Hermes (RN's JS engine) does not
// implement it — `new Intl.RelativeTimeFormat` is `undefined` on-device, a
// TypeError that only surfaces at runtime (jsdom/Node under Jest has the
// full Intl API, so this passed every test and typecheck before it was
// caught on a real device).
const UNITS: { limit: number; divisor: number; singular: string; plural: string }[] = [
  { limit: 60, divisor: 1, singular: 'second', plural: 'seconds' },
  { limit: 3600, divisor: 60, singular: 'minute', plural: 'minutes' },
  { limit: 86400, divisor: 3600, singular: 'hour', plural: 'hours' },
  { limit: 604800, divisor: 86400, singular: 'day', plural: 'days' },
  { limit: 2629800, divisor: 604800, singular: 'week', plural: 'weeks' },
  { limit: 31557600, divisor: 2629800, singular: 'month', plural: 'months' },
];

export const formatRelativeTime = (isoDate: string, now: Date = new Date()): string => {
  const then = new Date(isoDate);
  const diffSeconds = Math.round((then.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const isPast = diffSeconds <= 0;

  if (absSeconds < 5) return 'just now';

  const unit = UNITS.find(u => absSeconds < u.limit) ?? { divisor: 31557600, singular: 'year', plural: 'years' };
  const count = Math.max(1, Math.round(absSeconds / unit.divisor));
  const label = count === 1 ? unit.singular : unit.plural;

  return isPast ? `${count} ${label} ago` : `in ${count} ${label}`;
};
