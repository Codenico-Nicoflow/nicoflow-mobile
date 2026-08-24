import { type ReactNode } from 'react';

import { createNoteApi } from '@nicoflow/shared/api';
import { type TiptapDoc } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { SaveStatus } from './types';
import { useNoteAutosave } from './useNoteAutosave';

const API = 'http://localhost:8080/v1';
const DEBOUNCE = 1500;

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockNoteApi = createNoteApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useUpdateNoteMutation: () => mockNoteApi.useUpdateNoteMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockNoteApi.reducerPath]: mockNoteApi.reducer },
    middleware: gDM => gDM().concat(mockNoteApi.middleware),
  });

const doc = (text: string): TiptapDoc => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const detail = (version: number) => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Note',
  content: doc('body'),
  version,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
});

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={makeStore()}>{children}</Provider>;

const renderAutosave = async (initialVersion = 1) =>
  renderHook(() => useNoteAutosave({ noteId: 'n1', initialVersion, debounceMs: DEBOUNCE }), { wrapper });

beforeEach(() => {
  // shouldAdvanceTime keeps the microtask queue draining under fake timers —
  // without it awaited RTK Query promises never settle and every test hangs.
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useNoteAutosave debounce', () => {
  it('sends nothing while edits keep arriving, then exactly one save after 3000ms', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = await renderAutosave();

    result.current.save({ content: doc('a') });
    jest.advanceTimersByTime(DEBOUNCE - 100);
    result.current.save({ content: doc('ab') });
    jest.advanceTimersByTime(DEBOUNCE - 100);
    result.current.save({ content: doc('abc') });

    expect(calls).toBe(0);

    jest.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(calls).toBe(1));
  });

  it('coalesces title and content edits into one request body', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = await renderAutosave(3);

    result.current.save({ title: 'Renamed' });
    result.current.save({ content: doc('body') });
    jest.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toEqual({ version: 3, title: 'Renamed', content: doc('body') });
  });
});

describe('useNoteAutosave status', () => {
  it('reports unsaved, then saving, then saved — never saved before the response', async () => {
    let resolve: (() => void) | undefined;
    server.use(
      http.patch(`${API}/notes/n1`, async () => {
        await new Promise<void>(r => {
          resolve = r;
        });
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = await renderAutosave();
    expect(result.current.status).toBe(SaveStatus.IDLE);

    result.current.save({ content: doc('a') });
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.UNSAVED));

    jest.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.SAVING));

    resolve?.();
    await waitFor(() => expect(result.current.status).toBe(SaveStatus.SAVED));
  });

  it('surfaces a non-conflict failure as an error status, not a silent no-op', async () => {
    server.use(
      http.patch(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'INVALID_INPUT', message: 'too large' } }, { status: 422 })
      )
    );

    const { result } = await renderAutosave();

    result.current.save({ content: doc('enormous') });
    jest.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.ERROR));
    expect(result.current.isConflicted).toBe(false);
  });
});

describe('useNoteAutosave version tracking', () => {
  it('adopts the version from a successful save and sends it on the next one', async () => {
    const versions: number[] = [];
    let next = 4;
    server.use(
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        const body = (await request.json()) as { version: number };
        versions.push(body.version);
        return HttpResponse.json({ data: detail(next++), error: null });
      })
    );

    const { result } = await renderAutosave(3);

    result.current.save({ content: doc('first') });
    jest.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.version).toBe(4));

    result.current.save({ content: doc('second') });
    jest.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(versions).toHaveLength(2));

    expect(versions).toEqual([3, 4]);
  });
});

describe('useNoteAutosave conflict', () => {
  it('halts permanently on 409 and never sends another request', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 });
      })
    );

    const { result } = await renderAutosave();

    result.current.save({ content: doc('a') });
    jest.advanceTimersByTime(DEBOUNCE);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.CONFLICT));
    expect(result.current.isConflicted).toBe(true);
    expect(calls).toBe(1);

    result.current.save({ content: doc('ab') });
    jest.advanceTimersByTime(DEBOUNCE * 5);
    result.current.save({ content: doc('abc') });
    jest.advanceTimersByTime(DEBOUNCE * 5);
    result.current.flush();
    jest.advanceTimersByTime(DEBOUNCE * 5);

    await waitFor(() => expect(result.current.status).toBe(SaveStatus.CONFLICT));
    expect(calls).toBe(1);
  });
});

describe('useNoteAutosave flush', () => {
  it('sends a pending edit immediately instead of waiting for the debounce', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = await renderAutosave();

    result.current.save({ content: doc('a') });
    expect(calls).toBe(0);

    result.current.flush();

    await waitFor(() => expect(calls).toBe(1));
  });

  it('does not send anything when there is no pending edit', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result } = await renderAutosave();
    result.current.flush();

    jest.advanceTimersByTime(DEBOUNCE * 2);
    expect(calls).toBe(0);
  });

  it('flushes a pending edit on unmount', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: detail(2), error: null });
      })
    );

    const { result, unmount } = await renderAutosave();

    result.current.save({ content: doc('unsaved work') });
    expect(calls).toBe(0);

    await unmount();

    await waitFor(() => expect(calls).toBe(1));
  });

  it('does not flush on unmount when conflicted', async () => {
    let calls = 0;
    server.use(
      http.patch(`${API}/notes/n1`, () => {
        calls += 1;
        return HttpResponse.json({ data: null, error: { code: 'CONFLICT', message: 'stale' } }, { status: 409 });
      })
    );

    const { result, unmount } = await renderAutosave();

    result.current.save({ content: doc('a') });
    jest.advanceTimersByTime(DEBOUNCE);
    await waitFor(() => expect(result.current.isConflicted).toBe(true));

    result.current.save({ content: doc('b') });
    await unmount();

    jest.advanceTimersByTime(DEBOUNCE * 2);
    expect(calls).toBe(1);
  });
});
