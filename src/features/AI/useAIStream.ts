import { useCallback, useRef, useState } from 'react';

import { fetch as expoFetch } from 'expo/fetch';

import type { AIMessageView } from '@nicoflow/shared/api';
import { AI_API } from '@nicoflow/shared/types';
import { SSEParser } from '@nicoflow/shared/utils';

import { env } from '@/constants/env';
import { aiApi, mobileTokenStorage, refreshSessionFromStore, useAppDispatch } from '@/lib/store';

// Mirrors the backend guard — anything longer comes back as INVALID_INPUT.
export const MAX_CONTENT_LENGTH = 2000;

// React Native's global fetch is XHR-backed and never populates `response.body`,
// so web's ReadableStream drain cannot work here. `expo/fetch` is Expo's
// WinterCG-compliant implementation and does expose a real ReadableStream, which
// is what makes token-by-token streaming possible on device. Import it
// explicitly — do NOT fall back to global fetch for this endpoint.

export type PendingStatus = 'sending' | 'streaming' | 'done' | 'error';

export interface PendingMessage extends AIMessageView {
  status: PendingStatus;
  // The §4 error code, so the UI keys UX off the code (quota wall for
  // AI_LIMIT_REACHED, retry for the rest), never the HTTP status.
  errorCode?: string;
}

export type SendOutcome = 'done' | 'error' | 'aborted';

export interface UseAIStream {
  pending: PendingMessage[];
  isStreaming: boolean;
  send: (sessionId: string, content: string) => Promise<SendOutcome>;
  abort: () => void;
  retry: () => Promise<SendOutcome>;
  reset: () => void;
}

const now = () => new Date().toISOString();

// RN has no crypto.randomUUID; these ids are local-only turn keys that never
// reach the wire, so a counter-backed id is sufficient and avoids a polyfill.
let localTurnId = 0;
const nextId = () => `local-${++localTurnId}`;

const extractEnvelopeCode = (body: unknown): string => {
  if (body && typeof body === 'object') {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string' && code) return code;
    }
  }
  return 'AI_PROVIDER_ERROR';
};

export const useAIStream = (): UseAIStream => {
  const dispatch = useAppDispatch();

  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<{ sessionId: string; userId: string; content: string } | null>(null);

  const patchMessage = useCallback((id: string, changes: Partial<PendingMessage>) => {
    setPending(prev => prev.map(m => (m.id === id ? { ...m, ...changes } : m)));
  }, []);

  // Opens an authenticated stream. 401 → refresh once (shared single-flight
  // mutex) → retry, matching baseQueryWithReauth's behaviour for normal queries.
  const openStream = useCallback(
    async (url: string, body: unknown, controller: AbortController) => {
      const makeRequest = (token: string | null) =>
        expoFetch(`${env.apiUrl}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

      let response = await makeRequest(mobileTokenStorage.getAccessToken());
      if (response.status === 401) {
        const fresh = await refreshSessionFromStore(mobileTokenStorage, dispatch);
        if (fresh) response = await makeRequest(fresh);
      }
      return response;
    },
    [dispatch]
  );

  // Drains the SSE body into the assistant turn as deltas arrive.
  const drainStream = useCallback(
    async (
      body: ReadableStream<Uint8Array>,
      sessionId: string,
      assistantId: string,
      onDone: () => void
    ): Promise<SendOutcome> => {
      const parser = new SSEParser();
      const decoder = new TextDecoder();
      const reader = body.getReader();
      let assistant = '';
      let outcome: SendOutcome | null = null;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const event of parser.feed(decoder.decode(value, { stream: true }))) {
            if (event.type === 'delta') {
              assistant += event.text;
              patchMessage(assistantId, { content: assistant });
            } else if (event.type === 'done') {
              patchMessage(assistantId, { id: event.messageId, content: assistant, status: 'done' });
              dispatch(aiApi.util.upsertQueryData('getAIUsage', undefined, event.usage));
              dispatch(aiApi.util.invalidateTags([{ type: 'AISession', id: sessionId }]));
              outcome = 'done';
            } else if (event.type === 'tool_proposal') {
              // Mobile has no proposal card yet (web-only surface). The stream
              // still ends here — no `done` follows — so close the turn cleanly
              // rather than leaving it spinning forever.
              patchMessage(assistantId, { content: assistant, status: 'done' });
              outcome = 'done';
            } else {
              patchMessage(assistantId, { content: assistant, status: 'error', errorCode: event.code });
              outcome = 'error';
            }
          }
        }
      } catch {
        if (controllerRef.current?.signal.aborted) outcome = 'aborted';
      }

      onDone();

      if (outcome === 'aborted') {
        // A user-initiated stop keeps whatever text already arrived.
        patchMessage(assistantId, { content: assistant, status: 'done' });
        return 'aborted';
      }
      if (outcome === null) {
        patchMessage(assistantId, { content: assistant, status: 'error' });
        return 'error';
      }
      return outcome;
    },
    [dispatch, patchMessage]
  );

  const run = useCallback(
    async (sessionId: string, userId: string, assistantId: string, content: string): Promise<SendOutcome> => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsStreaming(true);

      const fail = (code: string): SendOutcome => {
        setPending(prev =>
          prev.map(m => {
            if (m.id === userId) return { ...m, status: 'error' as const, errorCode: code };
            if (m.id === assistantId) return { ...m, status: 'error' as const };
            return m;
          })
        );
        controllerRef.current = null;
        setIsStreaming(false);
        return 'error';
      };

      let response: Awaited<ReturnType<typeof openStream>>;
      try {
        response = await openStream(AI_API.MESSAGES(sessionId), { content }, controller);
      } catch {
        controllerRef.current = null;
        setIsStreaming(false);
        if (controller.signal.aborted) return 'aborted';
        return fail('AI_PROVIDER_ERROR');
      }

      if (!response.ok || !response.body) {
        const errorBody: unknown = await response.json().catch(() => null);
        return fail(extractEnvelopeCode(errorBody));
      }

      patchMessage(userId, { status: 'done' });
      patchMessage(assistantId, { status: 'streaming' });

      return drainStream(response.body, sessionId, assistantId, () => {
        controllerRef.current = null;
        setIsStreaming(false);
      });
    },
    [drainStream, openStream, patchMessage]
  );

  const send = useCallback(
    async (sessionId: string, content: string): Promise<SendOutcome> => {
      if (controllerRef.current) return 'error';

      const userId = nextId();
      const assistantId = nextId();
      const timestamp = now();
      lastSendRef.current = { sessionId, userId, content };

      setPending([
        { id: userId, role: 'user', content, createdAt: timestamp, status: 'sending' },
        { id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
      ]);

      return run(sessionId, userId, assistantId, content);
    },
    [run]
  );

  const retry = useCallback(async (): Promise<SendOutcome> => {
    const last = lastSendRef.current;
    if (!last || controllerRef.current) return 'error';

    const assistantId = nextId();
    const timestamp = now();
    setPending([
      { id: last.userId, role: 'user', content: last.content, createdAt: timestamp, status: 'sending' },
      { id: assistantId, role: 'assistant', content: '', createdAt: timestamp, status: 'streaming' },
    ]);
    return run(last.sessionId, last.userId, assistantId, last.content);
  }, [run]);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    if (controllerRef.current) return;
    setPending([]);
  }, []);

  return { pending, isStreaming, send, abort, retry, reset };
};
