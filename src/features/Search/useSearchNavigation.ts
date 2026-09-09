import { router } from 'expo-router';

import type { SearchSelectPayload } from './types';

// Routes a selected result to its screen. Mirrors web's useSearchNavigation,
// mapped onto this app's routes.
export function useSearchNavigation() {
  return (payload: SearchSelectPayload) => {
    if (payload.kind === 'task') {
      router.push(`/task/${payload.item.id}`);
    } else if (payload.kind === 'project') {
      router.push(`/project/${payload.item.id}`);
    } else if (payload.kind === 'note') {
      // Straight to the editor, which fetches the body from the scalar — the
      // search result carries only an excerpt.
      router.push(`/note/${payload.item.id}`);
    } else {
      // No area detail route exists on mobile either; the areas tab is the
      // closest destination.
      router.push('/areas');
    }
  };
}
