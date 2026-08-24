// Mirrors web's autosave/types.ts exactly — same closed union, same debounce.
export const SaveStatus = {
  IDLE: 'idle',
  UNSAVED: 'unsaved',
  SAVING: 'saving',
  SAVED: 'saved',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

export type SaveStatusValue = (typeof SaveStatus)[keyof typeof SaveStatus];

export const AUTOSAVE_DEBOUNCE_MS = 3000;
