import { useEffect } from 'react';
import { AppState } from 'react-native';

import * as Notifications from 'expo-notifications';

import { useGetUnreadCountQuery } from '@/lib/store';

// The WS conduit already invalidates NotificationCount on notification.created,
// so this poll is only the safety net for a socket that dropped or is
// reconnecting — hence a slow interval rather than a short one.
const POLL_MS = 60_000;

// Unread count, kept fresh by three paths that each cover the others' gap: the WS
// event (instant, but gone while backgrounded), this poll (survives a dead
// socket), and a refetch when the app returns to the foreground (the socket has
// usually been torn down by then, and the count may have moved while away).
//
// Also mirrors the count onto the OS app-icon badge. That only holds while the
// app runs; the badge on a closed app comes from the push payload, which the
// backend sets (NIC-2005).
export const useUnreadCount = (): number => {
  const { data, refetch } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_MS });
  const count = data?.count ?? 0;

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  useEffect(() => {
    // Best-effort: a platform that refuses to set the badge must not break the
    // screen rendering the count.
    void Notifications.setBadgeCountAsync(count).catch(() => undefined);
  }, [count]);

  return count;
};
