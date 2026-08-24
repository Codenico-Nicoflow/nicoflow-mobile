import type { TiptapDoc } from '@nicoflow/shared/types';

// Same helpers as nicoflow-frontend's Bucket/utils/noteDraft.ts — not exported
// from @nicoflow/shared, so duplicated here rather than importing web's src.
// Capture allows 500 chars; a note title caps at 255.
export const NOTE_TITLE_MAX = 255;

export const truncateNoteTitle = (text: string): string => (text.split('\n')[0] ?? '').trim().slice(0, NOTE_TITLE_MAX);

// The captured text becomes the body verbatim: one paragraph per line, blank
// lines dropped.
export const captureToDoc = (text: string): TiptapDoc => {
  const paragraphs = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => ({ type: 'paragraph' as const, content: [{ type: 'text' as const, text: line }] }));

  return { type: 'doc', content: paragraphs };
};
