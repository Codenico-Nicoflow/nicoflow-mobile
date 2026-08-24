// Mirrors web's calloutIcons.ts — the fixed icon set a callout can carry.
export const NOTE_CALLOUT_ICONS = ['info', 'warning', 'success', 'idea', 'star', 'note', 'flag', 'question'] as const;
export type NoteCalloutIcon = (typeof NOTE_CALLOUT_ICONS)[number];

export const isNoteCalloutIcon = (value: unknown): value is NoteCalloutIcon =>
  typeof value === 'string' && (NOTE_CALLOUT_ICONS as readonly string[]).includes(value);
