import { useEffect, useState } from 'react';

import { mobileTokenStorage, refreshSessionFromStore, useAppDispatch, useAppSelector } from '@/lib/store';

// Cold-start restore: the access token is memory-only (Redux), so it's always
// gone after a fresh app launch — only the persisted `user` survives via
// redux-persist. This hook lets the tab shell paint instantly off that
// persisted user (AC2) while a background refresh re-obtains a working access
// token using the SecureStore refresh token. A definitive auth failure
// (INVALID_REFRESH_TOKEN/UNAUTHORIZED) already clears auth inside
// refreshSessionFromStore's tokenStorage.clear() path, which flips
// useAppUser() to null and lets RootNavigator's guard bounce to sign-in — no
// separate navigation call needed here. A transient network/5xx failure
// leaves the persisted user in place, matching web's "don't kill the session
// over a blip" behavior.
export function useSessionRestore() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const hasToken = useAppSelector(state => Boolean(state.auth.token));
  const [restoring, setRestoring] = useState(Boolean(user) && !hasToken);

  useEffect(() => {
    if (!user || hasToken) return;

    let cancelled = false;
    refreshSessionFromStore(mobileTokenStorage, dispatch).finally(() => {
      if (!cancelled) setRestoring(false);
    });
    return () => {
      cancelled = true;
    };
    // Deliberately runs once at mount, off the values present then — the
    // whole point is restoring before the state transition it would otherwise
    // depend on (token obtained). Re-running on every user/hasToken change
    // would refire on that very transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { restoring };
}
