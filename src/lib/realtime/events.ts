// The WS envelope the API sends: { event, payload, timestamp } with full
// payloads, never diffs.
export interface WsEvent {
  event: string;
  payload: unknown;
}

const TASK_TAGS = ['Task', 'TimeSpread'] as const;

// Which cache tags each event invalidates. Only the slices this app registers
// appear here — an event for a slice mobile does not have yet is a no-op rather
// than an error, so the backend can add events without breaking this client.
export const WS_EVENT_TAGS: Record<string, readonly string[]> = {
  'notification.created': ['Notification', 'NotificationCount'],
  'task.created': TASK_TAGS,
  'task.updated': TASK_TAGS,
  'task.deleted': TASK_TAGS,
  'task.status_changed': TASK_TAGS,
  // Project events also invalidate Area (the areas board nests projects) and
  // Search (results embed projects).
  'project.created': ['Project', 'Area', 'Search'],
  'project.updated': ['Project', 'Area', 'Search'],
  'project.deleted': ['Project', 'Area', 'Search'],
  'area.created': ['Area', 'Search'],
  'area.updated': ['Area', 'Search'],
  'area.deleted': ['Area', 'Search'],
  'bucket.created': ['Bucket'],
  // An item processed into a note creates one, so the notes list moves too.
  'bucket.processed': ['Bucket', 'Note'],
  'bucket.deleted': ['Bucket'],
  // Note payloads are the LIST shape (no content) on created/updated and { id }
  // on deleted — a view needing the body refetches the scalar.
  'note.created': ['Note', 'Search'],
  'note.updated': ['Note', 'Search'],
  'note.deleted': ['Note', 'Search'],
  'ai.session.updated': ['AISession'],
};

// safeParse turns a raw frame into a typed event. A malformed or non-object
// frame is ignored rather than thrown — one bad frame must never kill the socket.
export const safeParse = (raw: unknown): WsEvent | null => {
  if (typeof raw !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const event = (parsed as { event?: unknown }).event;
    if (typeof event !== 'string' || !event) return null;
    return { event, payload: (parsed as { payload?: unknown }).payload };
  } catch {
    return null;
  }
};
