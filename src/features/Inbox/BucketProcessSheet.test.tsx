import { createAreaApi, createBucketApi, createProjectApi } from '@nicoflow/shared/api';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { createRef } from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { server } from '../../../test/server';

import { BucketProcessSheet } from './BucketProcessSheet';
import { type SheetRef } from '@/components/ui/sheet';

// See TaskSheet.test.tsx — the real gorhom BottomSheetModal only paints its
// content once its native present() animation settles, which never happens
// under jsdom. The documented test mock renders content unconditionally.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories run before import hoisting; require() here is gorhom's own documented pattern
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockBucketApi = createBucketApi(baseQuery);
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);

jest.mock('@/lib/store', () => ({
  useGetProjectsQuery: () => mockProjectApi.useGetProjectsQuery(),
  useProcessBucketMutation: () => mockBucketApi.useProcessBucketMutation(),
  // TaskSheet's own hooks — BucketProcessSheet mounts a real TaskSheet for the
  // Task path, so its store dependencies need mocking here too. Create/update/
  // recurrence are never exercised via this delegated path (onCreateSubmit
  // always wins), so no server handlers are registered for them.
  useCreateTaskMutation: () => [jest.fn(), { isLoading: false }],
  useUpdateTaskMutation: () => [jest.fn(), { isLoading: false }],
  useCreateRecurrenceRuleMutation: () => [jest.fn(), { isLoading: false }],
}));

const projects = [
  { id: 'p1', areaId: 'a1', name: 'Alpha Project', status: 'active', folderIcon: 'folder', createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  server.use(
    http.get(`${API}/projects`, () => HttpResponse.json({ data: { items: projects, nextCursor: '' }, error: null }))
  );
});

const makeStore = () =>
  configureStore({
    reducer: {
      [mockBucketApi.reducerPath]: mockBucketApi.reducer,
      [mockProjectApi.reducerPath]: mockProjectApi.reducer,
      [mockAreaApi.reducerPath]: mockAreaApi.reducer,
    },
    middleware: gDM => gDM().concat(mockBucketApi.middleware, mockProjectApi.middleware, mockAreaApi.middleware),
  });

const bucket = {
  id: 'b1',
  userId: 'u1',
  content: 'Call the dentist\nabout the appointment',
  processedAt: null,
  processingResult: null,
  createdTaskId: null,
  createdNoteId: null,
  projectId: null,
  createdAt: '',
  updatedAt: '',
};

const renderSheet = async (onProcessed = jest.fn()) => {
  const ref = createRef<SheetRef>();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <BucketProcessSheet ref={ref} bucket={bucket} onProcessed={onProcessed} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { ref, onProcessed };
};

describe('BucketProcessSheet', () => {
  it('Task path: opens TaskSheet pre-filled from the captured content and processes atomically', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/bucket/:id/process`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...bucket, processedAt: '2026-08-24', processingResult: 'task' }, error: null });
      })
    );
    const { ref, onProcessed } = await renderSheet();
    await waitFor(() => ref.current?.present());

    await waitFor(() => expect(screen.getByText('Process Bucket Item')).toBeTruthy());
    // Both the outer type-picker sheet and the nested TaskSheet render their
    // own "Create" button under the always-rendering test mock — the outer
    // one (index 0) advances into the Task path; the nested one (last) submits.
    await fireEvent.press(screen.getAllByLabelText('Create')[0]);

    await waitFor(() => expect(screen.getByDisplayValue('Call the dentist')).toBeTruthy());
    expect(screen.getByDisplayValue('about the appointment')).toBeTruthy();

    const projectOptions = screen.getAllByText('Alpha Project');
    await fireEvent.press(projectOptions[projectOptions.length - 1]);
    const createButtons = screen.getAllByLabelText('Create');
    await fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(onProcessed).toHaveBeenCalled());
    expect(capturedBody).toMatchObject({
      processingResult: 'task',
      projectId: 'p1',
      taskDetails: expect.objectContaining({ title: 'Call the dentist', notes: 'about the appointment' }),
    });
  });

  it('NOTE path is unaffected: still submits inline through the outer sheet', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/bucket/:id/process`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...bucket, processedAt: '2026-08-24', processingResult: 'note' }, error: null });
      })
    );
    const { ref, onProcessed } = await renderSheet();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Process Bucket Item')).toBeTruthy());

    await fireEvent.press(screen.getByText('Note'));
    await waitFor(() => expect(screen.getByText('Note Title')).toBeTruthy());

    // The nested TaskSheet stays mounted (always-rendering test mock) even
    // though NOTE is selected, so "Alpha Project" appears twice — the first
    // is the outer sheet's own project picker for the Note path.
    await fireEvent.press(screen.getAllByText('Alpha Project')[0]);
    await fireEvent.press(screen.getByText('Process'));

    await waitFor(() => expect(onProcessed).toHaveBeenCalled());
    expect(capturedBody).toMatchObject({ processingResult: 'note' });
  });

  it('TRASH path is unaffected: submits directly with no project or task fields', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/bucket/:id/process`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...bucket, processedAt: '2026-08-24', processingResult: 'trash' }, error: null });
      })
    );
    const { ref, onProcessed } = await renderSheet();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Process Bucket Item')).toBeTruthy());

    await fireEvent.press(screen.getByText('Trash'));
    await waitFor(() => expect(screen.getByText(/marked as trash/)).toBeTruthy());

    await fireEvent.press(screen.getByText('Process'));

    await waitFor(() => expect(onProcessed).toHaveBeenCalled());
    expect(capturedBody).toMatchObject({ processingResult: 'trash' });
  });
});
