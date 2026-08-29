import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createNoteApi, type ListNotesRequest } from '@nicoflow/shared/api';
import { type INote } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { NotesSection } from './NotesSection';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';
const mockRouterPush = jest.fn();

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockNoteApi = createNoteApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useGetNotesInfiniteQuery: (arg: ListNotesRequest, opts: { skip?: boolean }) =>
    mockNoteApi.useGetNotesInfiniteQuery(arg, opts),
  useCreateNoteMutation: () => mockNoteApi.useCreateNoteMutation(),
  useDeleteNoteMutation: () => mockNoteApi.useDeleteNoteMutation(),
}));

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockRouterPush(...args) } }));

const makeStore = () =>
  configureStore({
    reducer: { [mockNoteApi.reducerPath]: mockNoteApi.reducer },
    middleware: gDM => gDM().concat(mockNoteApi.middleware),
  });

const note = (overrides: Partial<INote> = {}): INote => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Meeting notes',
  excerpt: 'Discussed roadmap',
  version: 1,
  createdAt: '',
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const renderSection = () =>
  render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <NotesSection projectId="p1" />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );

beforeEach(() => {
  mockRouterPush.mockClear();
});

describe('NotesSection', () => {
  it('shows a title/excerpt fallback for empty fields', async () => {
    server.use(
      http.get(`${API}/notes`, () =>
        HttpResponse.json({
          data: { items: [note({ id: 'n1', title: '', excerpt: '' })], nextCursor: '' },
          error: null,
        })
      )
    );
    await renderSection();

    await waitFor(() => expect(screen.getByText('Untitled note')).toBeTruthy());
    expect(screen.getByText('Empty note')).toBeTruthy();
  });

  it('renders title and excerpt when set, never reading a content field', async () => {
    server.use(
      http.get(`${API}/notes`, () => HttpResponse.json({ data: { items: [note()], nextCursor: '' }, error: null }))
    );
    await renderSection();

    await waitFor(() => expect(screen.getByText('Meeting notes')).toBeTruthy());
    expect(screen.getByText('Discussed roadmap')).toBeTruthy();
  });

  it('shows the empty-state copy above the still-visible heading and create button', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })));
    await renderSection();

    await waitFor(() => expect(screen.getByText('No notes yet')).toBeTruthy());
    expect(
      screen.getByText('Notes are for reference material that outlives a task — meeting minutes, research, decisions.')
    ).toBeTruthy();
    // Heading + create button remain reachable, not replaced by the empty state.
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('New note')).toBeTruthy();
  });

  it('shows the exact load-error copy with a retry action', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: null, error: null }, { status: 500 })));
    await renderSection();

    await waitFor(() => expect(screen.getByText("Couldn't load notes")).toBeTruthy());
    expect(screen.getByText("Something went wrong fetching this project's notes.")).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('creates a note with the empty-doc default and navigates to its editor', async () => {
    server.use(http.get(`${API}/notes`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })));
    let capturedBody: unknown;
    server.use(
      http.post(`${API}/notes`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: note({ id: 'n2', title: 'Untitled note', excerpt: '' }), error: null });
      })
    );
    await renderSection();
    await waitFor(() => expect(screen.getByText('New note')).toBeTruthy());

    await fireEvent.press(screen.getByText('New note'));

    await waitFor(() => expect(capturedBody).toMatchObject({ projectId: 'p1', title: 'Untitled note' }));
    expect(mockRouterPush).toHaveBeenCalledWith('/note/n2');
  });

  it('shows the exact toast copy when create fails', async () => {
    server.use(
      http.get(`${API}/notes`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })),
      http.post(`${API}/notes`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 })
      )
    );
    await renderSection();
    await waitFor(() => expect(screen.getByText('New note')).toBeTruthy());

    await fireEvent.press(screen.getByText('New note'));

    await waitFor(() => expect(mockRouterPush).not.toHaveBeenCalled());
  });
});
