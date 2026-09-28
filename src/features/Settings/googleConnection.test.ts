import type { IGoogleCalendar } from '@nicoflow/shared/api';

import { googleOAuthResult, toggleGoogleCalendar } from './googleConnection';

const calendar = (id: string, selected: boolean, primary = false): IGoogleCalendar => ({
  id,
  summary: id,
  backgroundColor: '#4285F4',
  primary,
  selected,
});

describe('Google Calendar settings rules', () => {
  it('persists the server-provided primary default and toggles selected ids', () => {
    const calendars = [calendar('primary', true, true), calendar('team', false)];
    expect(toggleGoogleCalendar(calendars, 'team')).toEqual(['primary', 'team']);
    expect(toggleGoogleCalendar(calendars, 'primary')).toEqual([]);
  });

  it('does not exceed five selected calendars but always allows deselection', () => {
    const calendars = [
      calendar('a', true),
      calendar('b', true),
      calendar('c', true),
      calendar('d', true),
      calendar('e', true),
      calendar('f', false),
    ];
    expect(toggleGoogleCalendar(calendars, 'f')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(toggleGoogleCalendar(calendars, 'c')).toEqual(['a', 'b', 'd', 'e']);
  });

  it.each([
    ['connected', 'nicoflow:///settings?google=connected'],
    ['denied', 'nicoflow:///settings?google=denied'],
    ['failed', 'nicoflow:///settings?google=failed'],
  ] as const)('reads the server OAuth result %s from its deep link', (expected, url) => {
    expect(googleOAuthResult({ type: 'success', url })).toBe(expected);
  });

  it('treats browser cancellation and malformed callbacks as explicit outcomes', () => {
    expect(googleOAuthResult({ type: 'cancel' })).toBe('cancelled');
    expect(googleOAuthResult({ type: 'success', url: 'not-a-url' })).toBe('failed');
    expect(googleOAuthResult({ type: 'success', url: 'nicoflow:///settings' })).toBe('failed');
  });
});
