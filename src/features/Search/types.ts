import type { IAreaResult, INoteResult, IProjectResult, ITaskResult } from '@nicoflow/shared/api';

// One selected result, discriminated by kind so navigation can route without
// re-inspecting the shape. Mirrors web's SearchSelectPayload.
export type SearchSelectPayload =
  | { kind: 'task'; item: ITaskResult }
  | { kind: 'project'; item: IProjectResult }
  | { kind: 'area'; item: IAreaResult }
  | { kind: 'note'; item: INoteResult };

export type ResultKind = SearchSelectPayload['kind'];

// Minimum characters before a query is sent — matches web, and keeps a
// one-letter keystroke from hitting the API on every input.
export const MIN_QUERY_LENGTH = 2;

// Debounce matches web's palette so both clients feel the same while typing.
export const SEARCH_DEBOUNCE_MS = 200;

// One tinted tile per result kind so the eye sorts types before reading text.
// Same hues as web's TILE map.
export const KIND_TILE: Record<ResultKind, string> = {
  task: 'bg-sky-500/10',
  project: 'bg-violet-500/10',
  area: 'bg-amber-500/10',
  note: 'bg-emerald-500/10',
};

export const KIND_ICON_COLOR: Record<ResultKind, string> = {
  task: '#0284c7',
  project: '#7c3aed',
  area: '#d97706',
  note: '#059669',
};

// The backend caps each group at 10 (searchApi's `limit` param), so a full
// response is at most 4 groups x 10. SectionList reads initialNumToRender only
// on mount, so it must be a constant, not derived from the response — and it
// must cover the whole list, because virtualization otherwise drops the
// trailing sections, and the trailing section is `notes` (E-054 / NIC-1909).
export const MAX_RESULTS = 40;
