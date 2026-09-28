import type { IGoogleCalendar } from '@nicoflow/shared/api';
import { MAX_SELECTED_CALENDARS } from '@nicoflow/shared/api';

export type GoogleOAuthResult = 'connected' | 'denied' | 'failed' | 'cancelled';

export const toggleGoogleCalendar = (calendars: readonly IGoogleCalendar[], calendarId: string): string[] => {
  const selected = calendars.filter(calendar => calendar.selected).map(calendar => calendar.id);
  if (selected.includes(calendarId)) return selected.filter(id => id !== calendarId);
  if (selected.length >= MAX_SELECTED_CALENDARS) return selected;
  return [...selected, calendarId];
};

export const googleOAuthResult = (result: { type: string; url?: string }): GoogleOAuthResult => {
  if (result.type !== 'success' || !result.url) return 'cancelled';

  try {
    const status = new URL(result.url).searchParams.get('google');
    if (status === 'connected' || status === 'denied' || status === 'failed') return status;
    return 'failed';
  } catch {
    return 'failed';
  }
};
