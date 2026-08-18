import type { WSLifecycleAdapter } from '@nicoflow/shared/api/adapters';
import { AppState } from 'react-native';

// Mobile's WSLifecycleAdapter: web's equivalent is document.visibilitychange,
// RN's is AppState. "Foreground" is the 'active' state; anything else
// (background/inactive) counts as backgrounded for WS pause/resume purposes.
export const createMobileWSLifecycleAdapter = (): WSLifecycleAdapter => ({
  onForeground: cb => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') cb();
    });
    return () => subscription.remove();
  },
  onBackground: cb => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') cb();
    });
    return () => subscription.remove();
  },
  isForeground: () => AppState.currentState === 'active',
});
