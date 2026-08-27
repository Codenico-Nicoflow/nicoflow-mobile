// Mirrors web's calloutIcons.ts — the fixed icon set a callout can carry.
export const NOTE_CALLOUT_ICONS = ['info', 'warning', 'success', 'idea', 'star', 'note', 'flag', 'question'] as const;
export type NoteCalloutIcon = (typeof NOTE_CALLOUT_ICONS)[number];

export const isNoteCalloutIcon = (value: unknown): value is NoteCalloutIcon =>
  typeof value === 'string' && (NOTE_CALLOUT_ICONS as readonly string[]).includes(value);

// Emoji glyphs matching the mobile WebView shell's CALLOUT_GLYPH (same values,
// duplicated there since the shell is a bundled string with no module
// resolution — see webview-assets/editorHtml.ts's own copy).
export const CALLOUT_GLYPH: Record<NoteCalloutIcon, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  idea: '💡',
  star: '⭐',
  note: '📝',
  flag: '🚩',
  question: '❓',
};
