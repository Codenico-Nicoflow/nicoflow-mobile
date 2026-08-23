import AsyncStorage from '@react-native-async-storage/async-storage';

export type ViewMode = 'tabs' | 'combined';

// Per-device layout preference, same key convention as nicoflow-frontend's
// localStorage 'nicoflow-timespread-view' — AsyncStorage rather than the
// backend since it's presentation, not account state.
const STORAGE_KEY = 'nicoflow.timeSpreadView';

export async function getStoredViewMode(): Promise<ViewMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'combined' ? 'combined' : 'tabs';
  } catch {
    return 'tabs';
  }
}

export async function setStoredViewMode(mode: ViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage unavailable — the choice just doesn't persist across launches.
  }
}
