import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createNoteApi } from '@nicoflow/shared/api';
import { type INoteDetail } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { NoteEditorPage } from './NoteEditorPage';

// The WebView never runs under jsdom (no native bridge) — stub it to a plain
// view so this suite focuses on the page's own state machine (title/delete/
// conflict/not-found), not the editor surface (covered by its own tests
// where meaningful, and by manual device testing for the WebView itself).
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View };
});

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';
const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockNoteApi = createNoteApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useGetNoteQuery: (id: string, opts: { skip?: boolean }) => mockNoteApi.useGetNoteQuery(id, opts),
  useUpdateNoteMutation: () => mockNoteApi.useUpdateNoteMutation(),
  useDeleteNoteMutation: () => mockNoteApi.useDeleteNoteMutation(),
  useGetBacklinksQuery: (id: string) => mockNoteApi.useGetBacklinksQuery(id),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    back: (...args: unknown[]) => mockRouterBack(...args),
  },
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockNoteApi.reducerPath]: mockNoteApi.reducer },
    middleware: gDM => gDM().concat(mockNoteApi.middleware),
  });

const note = (overrides: Partial<INoteDetail> = {}): INoteDetail => ({
  id: 'n1',
  projectId: 'p1',
  title: 'Meeting notes',
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
  version: 1,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const renderPage = async (noteId = 'n1') =>
  render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <NoteEditorPage noteId={noteId} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );

beforeEach(() => {
  mockRouterReplace.mockClear();
  mockRouterBack.mockClear();
  server.use(http.get(`${API}/notes/backlinks`, () => HttpResponse.json({ data: [], error: null })));
});

describe('NoteEditorPage', () => {
  it('renders the loaded title and backlinks heading', async () => {
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note(), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null }))
    );

    await renderPage();

    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());
    expect(screen.getByText('Linked mentions')).toBeTruthy();
  });

  it('shows the exact not-found copy on a load error', async () => {
    server.use(http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: null, error: null }, { status: 404 })));

    await renderPage();

    await waitFor(() => expect(screen.getByText('Note not found')).toBeTruthy());
    expect(screen.getByText('This note may have been deleted, or the link is wrong.')).toBeTruthy();
  });

  it('shows the exact delete confirmation copy and navigates to the owning project on success', async () => {
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note(), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null })),
      http.delete(`${API}/notes/n1`, () => HttpResponse.json({ data: null, error: null }))
    );

    await renderPage();
    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('note-delete'));

    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeTruthy());
    expect(
      screen.getByText("The note and any files attached to it will be deleted. This can't be undone.")
    ).toBeTruthy();

    // [0] dialog title trigger already pressed, confirm button carries the label text too.
    await fireEvent.press(screen.getAllByText('Delete')[0]);

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/project/p1'));
  });

  it('navigates to Areas root when a deleted note had no project', async () => {
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note({ projectId: null }), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null })),
      http.delete(`${API}/notes/n1`, () => HttpResponse.json({ data: null, error: null }))
    );

    await renderPage();
    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('note-delete'));
    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeTruthy());
    await fireEvent.press(screen.getAllByText('Delete')[0]);

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/areas'));
  });

  it('closes the dialog and shows a toast on delete failure, without navigating', async () => {
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note(), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null })),
      http.delete(`${API}/notes/n1`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 })
      )
    );

    await renderPage();
    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('note-delete'));
    await waitFor(() => expect(screen.getByText('Delete this note?')).toBeTruthy());
    await fireEvent.press(screen.getAllByText('Delete')[0]);

    await waitFor(() => expect(mockRouterReplace).not.toHaveBeenCalled());
  });

  it('flushes a pending edit and navigates back when Back is pressed', async () => {
    let patched = false;
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note(), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null })),
      http.patch(`${API}/notes/n1`, () => {
        patched = true;
        return HttpResponse.json({ data: note({ version: 2 }), error: null });
      })
    );

    await renderPage();
    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('Meeting notes'), 'Renamed');
    await fireEvent.press(screen.getByTestId('note-back'));

    await waitFor(() => expect(patched).toBe(true));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('does not autosave an emptied title', async () => {
    let patchedBody: Record<string, unknown> | null = null;
    server.use(
      http.get(`${API}/notes/:id`, () => HttpResponse.json({ data: note(), error: null })),
      http.get(`${API}/notes/n1/backlinks`, () => HttpResponse.json({ data: [], error: null })),
      http.patch(`${API}/notes/n1`, async ({ request }) => {
        patchedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: note(), error: null });
      })
    );

    await renderPage();
    await waitFor(() => expect(screen.getByDisplayValue('Meeting notes')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('Meeting notes'), '');
    await fireEvent.press(screen.getByTestId('note-back'));

    expect(patchedBody).toBeNull();
  });
});
