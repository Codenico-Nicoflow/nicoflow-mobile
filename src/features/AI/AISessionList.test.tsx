import type { AISessionView } from '@nicoflow/shared/api';
import { createAiApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { AISessionList } from './AISessionList';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAiApi = createAiApi(baseQuery);

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('@/lib/store', () => ({
  useGetAISessionsQuery: () => mockAiApi.useGetAISessionsQuery(),
  useDeleteAISessionMutation: () => mockAiApi.useDeleteAISessionMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockAiApi.reducerPath]: mockAiApi.reducer },
    middleware: gDM => gDM().concat(mockAiApi.middleware),
  });

const session = (overrides: Partial<AISessionView> = {}): AISessionView => ({
  id: 's1',
  title: 'Plan my week',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
});

const renderList = async (props: Partial<React.ComponentProps<typeof AISessionList>> = {}) =>
  render(
    <Provider store={makeStore()}>
      <AISessionList onSelect={jest.fn()} onCreate={jest.fn()} {...props} />
    </Provider>
  );

describe('AISessionList', () => {
  it('renders a row per session once loaded', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: [session(), session({ id: 's2', title: 'Break down launch' })], error: null })
      )
    );

    await renderList();

    await waitFor(() => expect(screen.getByTestId('ai-session-s1')).toBeTruthy());
    expect(screen.getByTestId('ai-session-s2')).toBeTruthy();
    expect(screen.getByText('Plan my week')).toBeTruthy();
  });

  it('shows a skeleton list while the query is in flight', async () => {
    // RNTL v14's render() is async and flushes effects, so a real in-flight
    // query has already resolved by the time it returns. Drive the loading
    // branch from the hook instead — never a hanging request, which would
    // leave an open handle after the suite.
    const spy = jest
      .spyOn(mockAiApi, 'useGetAISessionsQuery')
      .mockReturnValue({ isLoading: true, isError: false, refetch: jest.fn() } as never);

    await renderList();

    expect(screen.getByTestId('ai-session-list-loading')).toBeTruthy();
    spy.mockRestore();
  });

  it('shows the empty state when there are no sessions', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [], error: null })));

    await renderList();

    await waitFor(() => expect(screen.getByTestId('ai-session-list-empty')).toBeTruthy());
  });

  it('shows an error state with a retry action when the read fails', async () => {
    server.use(
      http.get(`${API}/ai/sessions`, () =>
        HttpResponse.json({ data: null, error: { code: 'AI_UNAVAILABLE', message: 'off' } }, { status: 503 })
      )
    );

    await renderList();

    await waitFor(() => expect(screen.getByTestId('ai-session-list-error')).toBeTruthy());
  });

  it('marks the active session as selected', async () => {
    server.use(http.get(`${API}/ai/sessions`, () => HttpResponse.json({ data: [session()], error: null })));

    await renderList({ activeId: 's1' });

    await waitFor(() => expect(screen.getByTestId('ai-session-s1').props.accessibilityState.selected).toBe(true));
  });
});
