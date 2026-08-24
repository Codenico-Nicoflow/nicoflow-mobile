import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createAreaApi } from '@nicoflow/shared/api';
import { type AreaWithProjects } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { AreasList } from './AreasList';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);
const mockRouterPush = jest.fn();

jest.mock('@/lib/store', () => ({
  useGetAreasWithProjectsQuery: () => mockAreaApi.useGetAreasWithProjectsQuery(),
  useReorderAreasMutation: () => mockAreaApi.useReorderAreasMutation(),
  useCreateAreaMutation: () => mockAreaApi.useCreateAreaMutation(),
  useUpdateAreaMutation: () => mockAreaApi.useUpdateAreaMutation(),
  useDeleteAreaMutation: () => mockAreaApi.useDeleteAreaMutation(),
}));

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockRouterPush(...args) } }));

const makeStore = () =>
  configureStore({
    reducer: { [mockAreaApi.reducerPath]: mockAreaApi.reducer },
    middleware: gDM => gDM().concat(mockAreaApi.middleware),
  });

const area = (overrides: Partial<AreaWithProjects> = {}): AreaWithProjects => ({
  id: 'a1',
  name: 'Work',
  color: '#3B82F6',
  icon: 'briefcase',
  createdAt: '',
  updatedAt: '',
  projects: [],
  ...overrides,
});

const renderList = () =>
  render(
    <BottomSheetModalProvider>
      <Provider store={makeStore()}>
        <AreasList />
      </Provider>
    </BottomSheetModalProvider>
  );

beforeEach(() => {
  mockRouterPush.mockClear();
});

describe('AreasList', () => {
  it('renders areas with their nested project counts', async () => {
    server.use(
      http.get(`${API}/areas/with-projects`, () =>
        HttpResponse.json({
          data: [
            area({
              id: 'a1',
              name: 'Work',
              projects: [
                {
                  id: 'p1',
                  areaId: 'a1',
                  name: 'Alpha',
                  status: 'active',
                  folderIcon: 'folder',
                  createdAt: '',
                  updatedAt: '',
                },
              ],
            }),
          ],
          error: null,
        })
      )
    );

    await renderList();

    await waitFor(() => expect(screen.getByText('Your Areas')).toBeTruthy());
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
    expect(screen.getByText('Alpha')).toBeTruthy();
  });

  it('shows the empty-state copy when there are zero areas', async () => {
    server.use(http.get(`${API}/areas/with-projects`, () => HttpResponse.json({ data: [], error: null })));

    await renderList();

    await waitFor(() => expect(screen.getByText('Create your first area')).toBeTruthy());
    expect(screen.getByText('Areas group related projects. Add one to get started.')).toBeTruthy();
  });

  it('shows the no-projects fallback copy for an empty area', async () => {
    server.use(
      http.get(`${API}/areas/with-projects`, () =>
        HttpResponse.json({ data: [area({ id: 'a1', name: 'Empty Area', projects: [] })], error: null })
      )
    );

    await renderList();

    await waitFor(() => expect(screen.getByText('No projects yet. Add one below.')).toBeTruthy());
  });

  it('navigates to the project screen on tap', async () => {
    server.use(
      http.get(`${API}/areas/with-projects`, () =>
        HttpResponse.json({
          data: [
            area({
              id: 'a1',
              projects: [
                {
                  id: 'p1',
                  areaId: 'a1',
                  name: 'Alpha',
                  status: 'active',
                  folderIcon: 'folder',
                  createdAt: '',
                  updatedAt: '',
                },
              ],
            }),
          ],
          error: null,
        })
      )
    );

    await renderList();

    await waitFor(() => expect(screen.getByText('Alpha')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Alpha'));
    expect(mockRouterPush).toHaveBeenCalledWith('/project/p1');
  });
});
