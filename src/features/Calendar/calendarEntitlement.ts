import { USER_STATUS } from '@nicoflow/shared/types';

import type { RootState } from '@/lib/store';

export type CalendarEntitlement = 'pending' | 'free' | 'pro';

// A persisted user without a fresh memory-only access token is still being
// restored. Treating it as free would flash an upgrade prompt before the
// current entitlement is verified.
export const selectCalendarEntitlement = (state: RootState): CalendarEntitlement => {
  if (!state.auth.user || !state.auth.token) return 'pending';
  return state.auth.user.status === USER_STATUS.PREMIUM ? 'pro' : 'free';
};
