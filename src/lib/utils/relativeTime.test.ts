import { formatRelativeTime } from './relativeTime';

const NOW = new Date('2026-08-24T12:00:00.000Z');

describe('formatRelativeTime', () => {
  it('formats a few seconds ago as "just now"', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 3000).toISOString(), NOW)).toBe('just now');
  });

  it('formats minutes ago, singular and plural', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 60_000).toISOString(), NOW)).toBe('1 minute ago');
    expect(formatRelativeTime(new Date(NOW.getTime() - 5 * 60_000).toISOString(), NOW)).toBe('5 minutes ago');
  });

  it('formats hours ago', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 3 * 3_600_000).toISOString(), NOW)).toBe('3 hours ago');
  });

  it('formats days ago', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 2 * 86_400_000).toISOString(), NOW)).toBe('2 days ago');
  });

  it('formats a future date as "in N units"', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 10 * 60_000).toISOString(), NOW)).toBe('in 10 minutes');
  });

  it('never throws — does not depend on Intl.RelativeTimeFormat', () => {
    // Hermes has no Intl.RelativeTimeFormat; simulate that by removing it,
    // matching the actual on-device crash this function was rewritten to avoid.
    const original = Intl.RelativeTimeFormat;
    Object.defineProperty(Intl, 'RelativeTimeFormat', { value: undefined, configurable: true });
    try {
      expect(() => formatRelativeTime(new Date(NOW.getTime() - 60_000).toISOString(), NOW)).not.toThrow();
    } finally {
      Object.defineProperty(Intl, 'RelativeTimeFormat', { value: original, configurable: true });
    }
  });
});
