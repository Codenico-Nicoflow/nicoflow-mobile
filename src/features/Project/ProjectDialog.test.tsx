import { createRef } from 'react';

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

import { ProjectDialog, type ProjectDialogRef } from './ProjectDialog';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);

jest.mock('@/lib/store', () => ({
  useGetAreasQuery: () => mockAreaApi.useGetAreasQuery(),
  useCreateProjectMutation: () => mockProjectApi.useCreateProjectMutation(),
  useUpdateProjectMutation: () => mockProjectApi.useUpdateProjectMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockAreaApi.reducerPath]: mockAreaApi.reducer, [mockProjectApi.reducerPath]: mockProjectApi.reducer },
    middleware: gDM => gDM().concat(mockAreaApi.middleware, mockProjectApi.middleware),
  });

const project = (overrides: Partial<IProject> = {}): IProject => ({
  id: 'p1',
  areaId: 'a1',
  name: 'Website Redesign',
  status: 'active',
  folderIcon: 'folder',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const withAreas = () =>
  server.use(
    http.get(`${API}/areas`, () =>
      HttpResponse.json({ data: { items: [{ id: 'a1', name: 'Work' }], nextCursor: '' }, error: null })
    )
  );

const withNoAreas = () =>
  server.use(http.get(`${API}/areas`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null })));

const renderDialog = async (onSaved = jest.fn(), favoriteCount = 0) => {
  const ref = createRef<ProjectDialogRef>();
  const onCreateAreaRequested = jest.fn();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <ProjectDialog
            ref={ref}
            onSaved={onSaved}
            onCreateAreaRequested={onCreateAreaRequested}
            favoriteCount={favoriteCount}
          />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { ref, onSaved, onCreateAreaRequested };
};

describe('ProjectDialog', () => {
  it('create mode shows the create title', async () => {
    withAreas();
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());

    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());
  });

  it('shows the no-areas guard instead of the form when there are zero areas', async () => {
    withNoAreas();
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());

    await waitFor(() => expect(screen.getByText('Create an Area first')).toBeTruthy());
    expect(screen.getByText('Projects live inside Areas. Create an Area before adding a project.')).toBeTruthy();
  });

  it('routes to onCreateAreaRequested from the no-areas guard', async () => {
    withNoAreas();
    const { ref, onCreateAreaRequested } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create Area')).toBeTruthy());

    await fireEvent.press(screen.getByText('Create Area'));

    expect(onCreateAreaRequested).toHaveBeenCalled();
  });

  it('status field is edit-only', async () => {
    withAreas();
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());
    expect(screen.queryByText('Select project status')).toBeNull();

    await waitFor(() => ref.current?.present(project()));
    await waitFor(() => expect(screen.getByText('Edit Project')).toBeTruthy());
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('blocks submit with the exact web copy for name/area validation', async () => {
    withAreas();
    const { ref } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());

    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(screen.getByText('Project name is required')).toBeTruthy());
  });

  it('creates a project and calls onSaved on success', async () => {
    withAreas();
    server.use(http.post(`${API}/areas/a1/projects`, () => HttpResponse.json({ data: project(), error: null })));
    const { ref, onSaved } = await renderDialog();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('Enter your project name'), 'Website Redesign');
    await waitFor(() => expect(screen.getByText('Work')).toBeTruthy());
    await fireEvent.press(screen.getByText('Choose an area for your project'));
    await fireEvent.press(screen.getByText('Work'));
    await fireEvent.press(screen.getByText('Create'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('blocks favoriting past the 5-favorite cap without creating the project', async () => {
    withAreas();
    let createCalled = false;
    server.use(
      http.post(`${API}/areas/a1/projects`, () => {
        createCalled = true;
        return HttpResponse.json({ data: project(), error: null });
      })
    );
    const { ref, onSaved } = await renderDialog(jest.fn(), 5);
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('Enter your project name'), 'Sixth');
    await waitFor(() => expect(screen.getByText('Work')).toBeTruthy());
    await fireEvent.press(screen.getByText('Choose an area for your project'));
    await fireEvent.press(screen.getByText('Work'));
    await fireEvent.press(screen.getByLabelText('Mark as favorite'));
    await fireEvent.press(screen.getByText('Create'));

    // Cap check short-circuits before the request fires — dialog stays open,
    // no create request goes out, onSaved never called.
    await waitFor(() => expect(screen.getByText('Create New Project')).toBeTruthy());
    expect(createCalled).toBe(false);
    expect(onSaved).not.toHaveBeenCalled();
  });
});
