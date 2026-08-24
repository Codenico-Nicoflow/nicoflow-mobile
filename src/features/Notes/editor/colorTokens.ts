// Mirrors web's colorTokens.ts palette (9 named colors + Default) and the
// resolved hex values from nicoflow-frontend/src/index.css's
// --note-text-*/--note-highlight-* custom properties (light + dark). The
// mark stores the TOKEN NAME, never a raw hex — this module is what resolves
// a token to a color for display, same posture as web's CSS custom property
// resolution, just done here since the WebView has no shared stylesheet with
// the host app's theme.
export const NOTE_COLOR_TOKENS = [
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;
export type NoteColorToken = (typeof NOTE_COLOR_TOKENS)[number];

export const isNoteColorToken = (value: unknown): value is NoteColorToken =>
  typeof value === 'string' && (NOTE_COLOR_TOKENS as readonly string[]).includes(value);

export const NOTE_TEXT_COLORS = {
  light: {
    gray: '#475569',
    brown: '#78350f',
    orange: '#c2410c',
    yellow: '#854d0e',
    green: '#15803d',
    blue: '#1d4ed8',
    purple: '#7e22ce',
    pink: '#be185d',
    red: '#b91c1c',
  },
  dark: {
    gray: '#cbd5e1',
    brown: '#e7b98a',
    orange: '#fdba74',
    yellow: '#fde047',
    green: '#86efac',
    blue: '#93c5fd',
    purple: '#d8b4fe',
    pink: '#f9a8d4',
    red: '#fca5a5',
  },
} as const;

export const NOTE_HIGHLIGHT_COLORS = {
  light: {
    gray: '#e2e8f0',
    brown: '#fde9d0',
    orange: '#fed7aa',
    yellow: '#fef9c3',
    green: '#bbf7d0',
    blue: '#bfdbfe',
    purple: '#e9d5ff',
    pink: '#fce7f3',
    red: '#fecaca',
  },
  dark: {
    gray: '#334155',
    brown: '#78350f',
    orange: '#7c2d12',
    yellow: '#713f12',
    green: '#14532d',
    blue: '#1e3a8a',
    purple: '#581c87',
    pink: '#831843',
    red: '#7f1d1d',
  },
} as const;
