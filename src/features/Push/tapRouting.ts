import type { Href } from 'expo-router';

import { categoryForType, NotificationCategory } from '@nicoflow/shared/types';

// Where a tapped notification should take the user. Pure so the routing rules
// are testable without a navigator or a live notification.
//
//   deepLink — the notification names one entity, so go straight to it
//   expand   — no single entity target (a digest covers many, a system notice
//              covers none), so open the in-app list instead of guessing
export type TapTarget = { kind: 'deepLink'; href: Href } | { kind: 'expand' };

// The notification fields the routing rules read. Push `data` and a WS payload
// both narrow to this, so one function serves both entry points.
export interface TappedNotification {
  type?: unknown;
  metadata?: unknown;
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

// Reads the entity a celebration/reminder points at. Task wins over project: a
// task-level celebration also carries its projectId, and the task is the more
// specific target.
const entityHref = (metadata: unknown): Href | undefined => {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const meta = metadata as { taskId?: unknown; projectId?: unknown; noteId?: unknown };

  const taskId = asString(meta.taskId);
  if (taskId) return `/task/${taskId}` as Href;

  const projectId = asString(meta.projectId);
  if (projectId) return `/project/${projectId}` as Href;

  const noteId = asString(meta.noteId);
  if (noteId) return `/note/${noteId}` as Href;

  return undefined;
};

// resolveTapTarget decides where a tap goes, by category (per the 2026-08-24
// taxonomy). reminder/celebration deep-link to their entity; summary/system open
// the in-app list. A reminder or celebration whose metadata carries no entity
// falls back to expand rather than navigating nowhere.
export const resolveTapTarget = (notification: TappedNotification): TapTarget => {
  const type = asString(notification.type);
  if (!type) return { kind: 'expand' };

  const category = categoryForType(type);
  if (category !== NotificationCategory.REMINDER && category !== NotificationCategory.CELEBRATION) {
    return { kind: 'expand' };
  }

  const href = entityHref(notification.metadata);
  return href ? { kind: 'deepLink', href } : { kind: 'expand' };
};
