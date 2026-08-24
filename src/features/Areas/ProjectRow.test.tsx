import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createAreaApi, createProjectApi } from '@nicoflow/shared/api';
import { type IProject } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { ProjectRow } from './ProjectRow';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);

jest.mock('@/lib/store', () => ({
  useUpdateProjectMutation: () => mockProjectApi.useUpdateProjectMutation(),
  useDeleteProjectMutation: () => mockProjectApi.useDeleteProjectMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockProjectApi.reducerPath]: mockProjectApi.reducer },
    middleware: gDM => gDM().concat(mockProjectApi.middleware),
  });

const project = (overrides: Partial<IProject> = {}): IProject => ({
  id: 'p1',
  areaId: 'a1',
  name: 'Alpha',
  status: 'active',
  folderIcon: 'folder',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const renderRow = async (props: Partial<Parameters<typeof ProjectRow>[0]> = {}) => {
  const onPress = jest.fn();
  const onEdit = jest.fn();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <ProjectRow project={project()} onPress={onPress} onEdit={onEdit} {...props} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { onPress, onEdit };
};

describe('ProjectRow', () => {
  it('calls onEdit for Edit', async () => {
    const { onEdit } = await renderRow();

    await fireEvent.press(screen.getByLabelText('Project actions'));
    await waitFor(() => expect(screen.getByText('Edit')).toBeTruthy());
    await fireEvent.press(screen.getByText('Edit'));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });

  it('shows the exact delete confirmation copy', async () => {
    await renderRow();

    await fireEvent.press(screen.getByLabelText('Project actions'));
    await fireEvent.press(screen.getAllByText('Delete')[0]);

    await waitFor(() => expect(screen.getByText('Are you sure you want to delete ', { exact: false })).toBeTruthy());
    expect(screen.getAllByText('Alpha', { exact: true }).length).toBeGreaterThan(0);
    expect(
      screen.getByText('? This action cannot be undone. This will permanently delete all tasks in this project.', {
        exact: false,
      })
    ).toBeTruthy();
  });

  it('deletes the project on confirm', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/projects/:id`, () => {
        deleteCalled = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );
    await renderRow();

    await fireEvent.press(screen.getByLabelText('Project actions'));
    await fireEvent.press(screen.getAllByText('Delete')[0]);
    // "Delete Project" appears twice once the dialog is mounted: [0] dialog
    // title, [1] confirm button.
    await fireEvent.press(screen.getAllByText('Delete Project')[1]);

    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('toggles favorite from the actions menu', async () => {
    let capturedBody: unknown;
    server.use(
      http.patch(`${API}/projects/p1`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: project({ isFavorite: true }), error: null });
      })
    );
    await renderRow();

    await fireEvent.press(screen.getByLabelText('Project actions'));
    await waitFor(() => expect(screen.getByText('Add to favorites')).toBeTruthy());
    await fireEvent.press(screen.getByText('Add to favorites'));

    await waitFor(() => expect(capturedBody).toMatchObject({ isFavorite: true }));
  });

  it('shows "Remove from favorites" when already favorited', async () => {
    await renderRow({ project: project({ isFavorite: true }) });

    await fireEvent.press(screen.getByLabelText('Project actions'));
    await waitFor(() => expect(screen.getByText('Remove from favorites')).toBeTruthy());
  });
});
