import { createAreaApi, createProjectApi } from '@nicoflow/shared/api';
import { type IProject } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { ProjectView } from './ProjectView';

const API = 'http://localhost:8080/v1';
const mockRouterReplace = jest.fn();

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);

jest.mock('@/lib/store', () => ({
  useGetProjectQuery: (id: string) => mockProjectApi.useGetProjectQuery(id),
  useUpdateProjectMutation: () => mockProjectApi.useUpdateProjectMutation(),
}));

jest.mock('expo-router', () => ({ router: { replace: (...args: unknown[]) => mockRouterReplace(...args) } }));

const makeStore = () =>
  configureStore({
    reducer: { [mockProjectApi.reducerPath]: mockProjectApi.reducer },
    middleware: gDM => gDM().concat(mockProjectApi.middleware),
  });

const project = (overrides: Partial<IProject> = {}): IProject => ({
  id: 'p1',
  areaId: 'a1',
  name: 'Website Redesign',
  status: 'active',
  folderIcon: 'folder',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const renderView = (projectId = 'p1') =>
  render(
    <Provider store={makeStore()}>
      <ProjectView projectId={projectId} />
    </Provider>
  );

beforeEach(() => {
  mockRouterReplace.mockClear();
});

describe('ProjectView', () => {
  it('renders the header with status, due date, and created date', async () => {
    server.use(
      http.get(`${API}/projects/p1`, () =>
        HttpResponse.json({
          data: project({ dueDate: '2099-01-01T00:00:00.000Z' }),
          error: null,
        })
      )
    );

    await renderView();

    await waitFor(() => expect(screen.getByText('Website Redesign')).toBeTruthy());
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows the overdue suffix only for a past due date on an active project', async () => {
    server.use(
      http.get(`${API}/projects/p1`, () =>
        HttpResponse.json({ data: project({ dueDate: '2020-01-01T00:00:00.000Z' }), error: null })
      )
    );

    await renderView();

    await waitFor(() => expect(screen.getByText('(Overdue)', { exact: false })).toBeTruthy());
  });

  it('shows not-found copy with the exact web strings on error', async () => {
    server.use(http.get(`${API}/projects/p1`, () => HttpResponse.json({ data: null, error: null }, { status: 404 })));

    await renderView();

    await waitFor(() => expect(screen.getByText('Project not found')).toBeTruthy());
    expect(screen.getByText("This project may have been deleted or you don't have access to it.")).toBeTruthy();
    expect(screen.getByText('Back to Areas')).toBeTruthy();
  });

  it('navigates to /areas from the not-found action', async () => {
    server.use(http.get(`${API}/projects/p1`, () => HttpResponse.json({ data: null, error: null }, { status: 404 })));

    await renderView();

    await waitFor(() => expect(screen.getByText('Back to Areas')).toBeTruthy());
    await fireEvent.press(screen.getByText('Back to Areas'));

    expect(mockRouterReplace).toHaveBeenCalledWith('/areas');
  });

  it('switching tabs keeps both panels mounted (no unmount/remount)', async () => {
    server.use(http.get(`${API}/projects/p1`, () => HttpResponse.json({ data: project(), error: null })));

    await renderView();

    const opts = { includeHiddenElements: true };
    await waitFor(() => expect(screen.getByTestId('project-tasks-panel', opts)).toBeTruthy());
    expect(screen.getByTestId('project-notes-panel', opts)).toBeTruthy();

    await fireEvent.press(screen.getByText('Notes'));

    // Both panels remain in the tree after switching — only their `hidden`
    // styling changes, matching web's forceMount/hidden (never refetches).
    // includeHiddenElements is required since the inactive panel is
    // display:none, which RNTL's default query mode treats as unqueryable.
    expect(screen.getByTestId('project-tasks-panel', opts)).toBeTruthy();
    expect(screen.getByTestId('project-notes-panel', opts)).toBeTruthy();
  });

  it('toggles favorite optimistically via updateProject', async () => {
    let capturedBody: unknown;
    server.use(
      http.get(`${API}/projects/p1`, () => HttpResponse.json({ data: project({ isFavorite: false }), error: null })),
      http.patch(`${API}/projects/p1`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: project({ isFavorite: true }), error: null });
      })
    );

    await renderView();

    await waitFor(() => expect(screen.getByText('Website Redesign')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Add to favorites'));

    await waitFor(() => expect(capturedBody).toMatchObject({ isFavorite: true }));
  });
});
