import { createAiApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { useAIStream } from './useAIStream';

const baseQuery = fetchBaseQuery({ baseUrl: 'http://localhost:8080/v1' });
const mockAiApi = createAiApi(baseQuery);

const mockExpoFetch = jest.fn();
jest.mock('expo/fetch', () => ({ fetch: (...args: unknown[]) => mockExpoFetch(...args) }));

// jest.mock is hoisted above the const declarations, so the factory must read
// mockAiApi lazily through a getter rather than capturing it at hoist time.
jest.mock('@/lib/store', () => ({
  get aiApi() {
    return mockAiApi;
  },
  mobileTokenStorage: { getAccessToken: () => 'token-1' },
  refreshSessionFromStore: jest.fn(),
  useAppDispatch: () => jest.requireActual('react-redux').useDispatch(),
}));

jest.mock('@/constants/env', () => ({ env: { apiUrl: 'http://localhost:8080/v1' } }));

const encoder = new TextEncoder();

// Builds a Response-alike whose body streams the given SSE text in chunks, so
// the parser's incremental path (a frame split across reads) is exercised.
const streamingResponse = (chunks: string[]) => ({
  ok: true,
  status: 200,
  body: new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }),
});

const errorResponse = (code: string, status = 429) => ({
  ok: false,
  status,
  body: null,
  json: () => Promise.resolve({ data: null, error: { code, message: code } }),
});

const frame = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

const usage = { used: 3, limit: 5, scope: 'lifetime' as const, month: null };

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = configureStore({
    reducer: { [mockAiApi.reducerPath]: mockAiApi.reducer },
    middleware: gDM => gDM().concat(mockAiApi.middleware),
  });
  return <Provider store={store}>{children}</Provider>;
};

beforeEach(() => {
  mockExpoFetch.mockReset();
});

describe('useAIStream', () => {
  it('streams deltas into the assistant turn and closes on done', async () => {
    mockExpoFetch.mockResolvedValue(
      streamingResponse([
        frame({ type: 'delta', text: 'Hello' }),
        frame({ type: 'delta', text: ' world' }),
        frame({ type: 'done', messageId: 'm1', usage }),
      ])
    );

    const { result } = await renderHook(() => useAIStream(), { wrapper });

    const outcome = await result.current.send('s1', 'hi');

    expect(outcome).toBe('done');
    await waitFor(() => {
      const assistant = result.current.pending.find(m => m.role === 'assistant');
      expect(assistant?.content).toBe('Hello world');
      expect(assistant?.status).toBe('done');
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it('reassembles a frame split across reads', async () => {
    const full = frame({ type: 'delta', text: 'split' });
    const mid = Math.floor(full.length / 2);
    mockExpoFetch.mockResolvedValue(
      streamingResponse([full.slice(0, mid), full.slice(mid), frame({ type: 'done', messageId: 'm1', usage })])
    );

    const { result } = await renderHook(() => useAIStream(), { wrapper });
    await result.current.send('s1', 'hi');

    await waitFor(() => expect(result.current.pending.find(m => m.role === 'assistant')?.content).toBe('split'));
  });

  it('sends the message to the SSE endpoint with a bearer token', async () => {
    mockExpoFetch.mockResolvedValue(streamingResponse([frame({ type: 'done', messageId: 'm1', usage })]));

    const { result } = await renderHook(() => useAIStream(), { wrapper });
    await result.current.send('s1', 'plan my week');

    expect(mockExpoFetch).toHaveBeenCalledWith(
      'http://localhost:8080/v1/ai/sessions/s1/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'plan my week' }),
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      })
    );
  });

  it('surfaces the §4 code on the user turn when the send is refused', async () => {
    mockExpoFetch.mockResolvedValue(errorResponse('AI_LIMIT_REACHED'));

    const { result } = await renderHook(() => useAIStream(), { wrapper });

    const outcome = await result.current.send('s1', 'hi');

    expect(outcome).toBe('error');
    await waitFor(() => {
      const user = result.current.pending.find(m => m.role === 'user');
      expect(user?.status).toBe('error');
      expect(user?.errorCode).toBe('AI_LIMIT_REACHED');
    });
  });

  it('marks the turn errored when the stream carries an error frame', async () => {
    mockExpoFetch.mockResolvedValue(streamingResponse([frame({ type: 'error', code: 'AI_PROVIDER_ERROR' })]));

    const { result } = await renderHook(() => useAIStream(), { wrapper });

    const outcome = await result.current.send('s1', 'hi');

    expect(outcome).toBe('error');
  });

  it('closes the turn on a tool_proposal frame, which ends the stream without a done', async () => {
    mockExpoFetch.mockResolvedValue(
      streamingResponse([
        frame({ type: 'delta', text: 'Sure' }),
        frame({
          type: 'tool_proposal',
          toolUseId: 'toolu_1',
          toolName: 'create_task',
          input: {},
          assistantMessageId: 'm1',
        }),
      ])
    );

    const { result } = await renderHook(() => useAIStream(), { wrapper });
    await result.current.send('s1', 'add a task');

    await waitFor(() => expect(result.current.pending.find(m => m.role === 'assistant')?.status).toBe('done'));
    expect(result.current.isStreaming).toBe(false);
  });

  it('refuses a concurrent send while a stream is already open', async () => {
    mockExpoFetch.mockResolvedValue(streamingResponse([frame({ type: 'done', messageId: 'm1', usage })]));

    const { result } = await renderHook(() => useAIStream(), { wrapper });

    const first = result.current.send('s1', 'one');
    const second = await result.current.send('s1', 'two');
    await first;

    expect(second).toBe('error');

    expect(mockExpoFetch).toHaveBeenCalledTimes(1);
  });
});
