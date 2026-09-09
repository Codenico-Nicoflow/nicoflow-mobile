import { useCallback, useEffect, useRef, useState } from 'react';

import {
  aiApi,
  areaApi,
  bucketApi,
  mobileTokenStorage,
  mobileWSLifecycleAdapter,
  noteApi,
  notificationApi,
  projectApi,
  refreshSessionFromStore,
  searchApi,
  store,
  taskApi,
  useAppDispatch,
  useAppSelector,
  useAppUser,
} from '@/lib/store';

import { setWSConnected } from './connectionState';
import { safeParse, WS_EVENT_TAGS } from './events';
import { buildWsUrl } from './wsUrl';

// Reconnect backoff: 1 → 2 → 4 → 8 → 16 → 30s (capped), reset on a clean open so
// a flaky connection slows down but a genuine reconnect starts fast again.
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const;

// Only report "paused" once we've actually failed to hold a connection, so a
// momentary reconnect during navigation doesn't flash a banner.
const BANNER_AFTER_ATTEMPT = 1;

// The close code the API sends for a bad/expired token.
const CLOSE_POLICY_VIOLATION = 1008;

// useWebSocket holds one live connection to /v1/ws for every logged-in user (WS
// is FREE, not Pro-gated) and turns inbound events into tag invalidations. Ported
// from web's useWebSocket; the differences are the lifecycle adapter (AppState
// rather than visibilitychange) and the connection-state publish, which the push
// handler reads to decide whether an OS banner would duplicate an in-app update.
export const useWebSocket = (): { paused: boolean } => {
  const dispatch = useAppDispatch();
  const user = useAppUser();
  const token = useAppSelector(state => state.auth.token);
  const hasToken = Boolean(token);

  const [paused, setPaused] = useState(false);

  // Connection state lives in refs so reconnect scheduling never re-runs the
  // effect (which would tear down a healthy socket).
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const refreshedForCloseRef = useRef(false);

  // Invalidate on the api that owns each tag, using that api's own literals so
  // the types stay exact. Invalidation (not cache patching) keeps the tag/refetch
  // model the single source of truth.
  const dispatchTags = useCallback(
    (event: string) => {
      const tags = WS_EVENT_TAGS[event];
      if (!tags) return; // unknown event → no-op (forward-compatible)
      const has = (tag: string) => tags.includes(tag);

      const notificationTags = (['Notification', 'NotificationCount'] as const).filter(has);
      if (notificationTags.length > 0) dispatch(notificationApi.util.invalidateTags(notificationTags));

      const taskTags = (['Task', 'TimeSpread'] as const).filter(has);
      if (taskTags.length > 0) dispatch(taskApi.util.invalidateTags(taskTags));

      const projectTags = (['Project'] as const).filter(has);
      if (projectTags.length > 0) dispatch(projectApi.util.invalidateTags(projectTags));

      const areaTags = (['Area'] as const).filter(has);
      if (areaTags.length > 0) dispatch(areaApi.util.invalidateTags(areaTags));

      const bucketTags = (['Bucket'] as const).filter(has);
      if (bucketTags.length > 0) dispatch(bucketApi.util.invalidateTags(bucketTags));

      const noteTags = (['Note'] as const).filter(has);
      if (noteTags.length > 0) dispatch(noteApi.util.invalidateTags(noteTags));

      const searchTags = (['Search'] as const).filter(has);
      if (searchTags.length > 0) dispatch(searchApi.util.invalidateTags(searchTags));

      const aiTags = (['AISession'] as const).filter(has);
      if (aiTags.length > 0) dispatch(aiApi.util.invalidateTags(aiTags));
    },
    [dispatch]
  );

  useEffect(() => {
    // Wait for a token rather than refreshing to obtain one — the app's policy is
    // no eager on-load refresh; the socket opens once the normal flow populates it.
    if (!user || !hasToken) return;
    closedRef.current = false;

    // Reads the current token from the store on every attempt, so a post-refresh
    // reconnect always uses the latest value rather than a stale closure.
    const connect = () => {
      if (closedRef.current) return;
      const live = store.getState().auth.token;
      if (!live) {
        scheduleReconnect();
        return;
      }

      const socket = new WebSocket(buildWsUrl(live));
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        refreshedForCloseRef.current = false;
        setPaused(false);
        setWSConnected(true);
      };

      socket.onmessage = e => {
        const parsed = safeParse(e.data);
        if (parsed) dispatchTags(parsed.event);
      };

      socket.onclose = async event => {
        socketRef.current = null;
        setWSConnected(false);
        if (closedRef.current) return;

        // Bad/expired token → refresh once through the shared single-flight path
        // (so it can never race the app's other refreshes into reuse-detection),
        // then reconnect. A second consecutive 1008 falls through to backoff.
        if (event.code === CLOSE_POLICY_VIOLATION && !refreshedForCloseRef.current) {
          refreshedForCloseRef.current = true;
          const fresh = await refreshSessionFromStore(mobileTokenStorage, dispatch);
          if (closedRef.current) return;
          if (fresh) {
            connect();
            return;
          }
        }
        scheduleReconnect();
      };

      // onerror is followed by onclose; let onclose own the reconnect so it is
      // never scheduled twice. Closing here guarantees onclose fires.
      socket.onerror = () => socket.close();
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      const attempt = attemptRef.current;
      if (attempt >= BANNER_AFTER_ATTEMPT) setPaused(true);
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      attemptRef.current = attempt + 1;
      timerRef.current = setTimeout(connect, delay);
    };

    connect();

    // A backgrounded app that dropped its connection would otherwise sit out the
    // full backoff before retrying. Returning to the foreground reconnects
    // immediately instead. No-ops when the socket is already open.
    const unsubscribeForeground = mobileWSLifecycleAdapter.onForeground(() => {
      if (closedRef.current || socketRef.current) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      connect();
    });

    return () => {
      closedRef.current = true;
      setWSConnected(false);
      unsubscribeForeground();
      if (timerRef.current) clearTimeout(timerRef.current);
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onclose = null; // the teardown close must not schedule a reconnect
        socket.close();
      }
    };
    // Re-runs on login/logout and when a token first appears. Token rotation
    // mid-session is NOT a trigger — connect() reads the live token from the
    // store, so a healthy socket is never torn down on refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasToken]);

  return { paused };
};
