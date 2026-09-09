import type { ISearchResults } from '@nicoflow/shared/api';
import { createSearchApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { SearchScreen } from './SearchScreen';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockSearchApi = createSearchApi(baseQuery);
const mockRouterPush = jest.fn();

jest.mock('@/lib/store', () => ({
  useSearchQuery: (...args: unknown[]) => (mockSearchApi.useSearchQuery as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockRouterPush(...args) } }));

const results = (overrides: Partial<ISearchResults> = {}): ISearchResults => ({
  tasks: [],
  projects: [],
  areas: [],
  notes: [],
  ...overrides,
});

const respondWith = (data: ISearchResults) =>
  server.use(http.get(`${API}/search`, () => HttpResponse.json({ data, error: null })));

const renderScreen = async () => {
  const store = configureStore({
    reducer: { [mockSearchApi.reducerPath]: mockSearchApi.reducer },
    middleware: gDM => gDM().concat(mockSearchApi.middleware),
  });
  return render(
    <Provider store={store}>
      <SearchScreen />
    </Provider>
  );
};

const typeQuery = async (text: string) => {
  await fireEvent.changeText(screen.getByTestId('search-input'), text);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SearchScreen', () => {
  it('shows the hint state before anything is typed', async () => {
    await renderScreen();

    expect(screen.getByTestId('search-hint')).toBeTruthy();
  });

  it('renders all four groups, including notes', async () => {
    respondWith(
      results({
        tasks: [{ id: 't1', title: 'Ship it', excerpt: '', projectName: 'Launch', projectId: 'p1' }],
        projects: [{ id: 'p1', name: 'Launch', areaName: 'Work' }],
        areas: [{ id: 'a1', name: 'Work' }],
        notes: [{ id: 'n1', title: 'Launch notes', excerpt: 'body', projectName: 'Launch', projectId: 'p1' }],
      })
    );

    await renderScreen();
    await typeQuery('launch');

    // The notes group is additive (E-054) — a UI that forgets it drops results
    // with no error, which is exactly the trap this asserts against. Waiting on
    // the last group also lets SectionList finish committing every section.
    await waitFor(() => expect(screen.getByTestId('result-note-n1')).toBeTruthy());
    expect(screen.getByTestId('group-task')).toBeTruthy();
    expect(screen.getByTestId('group-project')).toBeTruthy();
    expect(screen.getByTestId('group-area')).toBeTruthy();
    expect(screen.getByTestId('group-note')).toBeTruthy();
  });

  it('renders a notes-only response without dropping it', async () => {
    respondWith(
      results({ notes: [{ id: 'n1', title: 'Solo note', excerpt: 'x', projectName: 'P', projectId: 'p1' }] })
    );

    await renderScreen();
    await typeQuery('solo');

    await waitFor(() => expect(screen.getByTestId('result-note-n1')).toBeTruthy());
    expect(screen.queryByTestId('search-empty')).toBeNull();
  });

  it('falls back to the excerpt for an orphaned note whose projectName is an empty string', async () => {
    respondWith(
      results({ notes: [{ id: 'n1', title: 'Orphan', excerpt: 'the excerpt', projectName: '', projectId: '' }] })
    );

    await renderScreen();
    await typeQuery('orphan');

    await waitFor(() => expect(screen.getByText('the excerpt')).toBeTruthy());
  });

  it('shows the no-results state when every group is empty', async () => {
    respondWith(results());

    await renderScreen();
    await typeQuery('nothing');

    await waitFor(() => expect(screen.getByTestId('search-empty')).toBeTruthy());
  });

  it('does not query for a single character', async () => {
    const handler = jest.fn(() => HttpResponse.json({ data: results(), error: null }));
    server.use(http.get(`${API}/search`, handler));

    await renderScreen();
    await typeQuery('a');

    await waitFor(() => expect(screen.queryByTestId('search-hint')).toBeNull());
    expect(handler).not.toHaveBeenCalled();
  });

  it('navigates to the note editor when a note result is pressed', async () => {
    respondWith(
      results({ notes: [{ id: 'n1', title: 'Launch notes', excerpt: 'b', projectName: 'P', projectId: 'p1' }] })
    );

    await renderScreen();
    await typeQuery('launch');

    await waitFor(() => expect(screen.getByTestId('result-note-n1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('result-note-n1'));

    expect(mockRouterPush).toHaveBeenCalledWith('/note/n1');
  });

  it('navigates to the project screen when a project result is pressed', async () => {
    respondWith(results({ projects: [{ id: 'p1', name: 'Launch', areaName: 'Work' }] }));

    await renderScreen();
    await typeQuery('launch');

    await waitFor(() => expect(screen.getByTestId('result-project-p1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('result-project-p1'));

    expect(mockRouterPush).toHaveBeenCalledWith('/project/p1');
  });
});
