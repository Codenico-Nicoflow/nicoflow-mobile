import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirrors nicoflow-frontend's timezoneDismissal.ts (Calendar feature) —
// keyed by the zone *pair*, not a bare boolean, so a resolved dismissal
// doesn't silently suppress a later genuine drift after the user travels
// again. AsyncStorage rather than the backend: a per-device nag preference,
// not account state.
const STORAGE_KEY = 'nicoflow.tzDriftDismissed';

const pairKey = (accountZone: string, browserZone: string): string => `${accountZone}>${browserZone}`;

export async function isDriftDismissed(accountZone: string, browserZone: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === pairKey(accountZone, browserZone);
  } catch {
    return false;
  }
}

export async function dismissDrift(accountZone: string, browserZone: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, pairKey(accountZone, browserZone));
  } catch {
    // Storage unavailable — the banner reappears next mount. Acceptable.
  }
}

export async function clearDriftDismissal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage never worked.
  }
}
