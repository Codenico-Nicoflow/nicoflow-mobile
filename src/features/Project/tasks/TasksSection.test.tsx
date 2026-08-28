import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  createAreaApi,
  createProjectApi,
  createRecurrenceApi,
  createTaskApi,
  type GetTasksRequest,
} from '@nicoflow/shared/api';
import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { TasksSection } from './TasksSection';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);
const mockRecurrenceApi = createRecurrenceApi(baseQuery, mockTaskApi);

jest.mock('@/lib/store', () => ({
  useGetTasksInfiniteQuery: (arg: GetTasksRequest) => mockTaskApi.useGetTasksInfiniteQuery(arg),
  useUpdateTaskStatusMutation: () => mockTaskApi.useUpdateTaskStatusMutation(),
  useCreateTaskMutation: () => mockTaskApi.useCreateTaskMutation(),
  useUpdateTaskMutation: () => mockTaskApi.useUpdateTaskMutation(),
  useDeleteTaskMutation: () => mockTaskApi.useDeleteTaskMutation(),
  useMarkTaskMissedMutation: () => mockTaskApi.useMarkTaskMissedMutation(),
  useCreateRecurrenceRuleMutation: () => mockRecurrenceApi.useCreateRecurrenceRuleMutation(),
  useConvertTaskToRecurringMutation: () => mockRecurrenceApi.useConvertTaskToRecurringMutation(),
  useUpdateRecurrenceRuleMutation: () => mockRecurrenceApi.useUpdateRecurrenceRuleMutation(),
  useDeleteRecurrenceRuleMutation: () => mockRecurrenceApi.useDeleteRecurrenceRuleMutation(),
  useGetRecurrenceRuleQuery: (id: string, opts?: { skip?: boolean }) =>
    mockRecurrenceApi.useGetRecurrenceRuleQuery(id, opts),
  useGetProjectsQuery: () => mockProjectApi.useGetProjectsQuery(),
}));

const makeStore = () =>
  configureStore({
    reducer: {
      [mockTaskApi.reducerPath]: mockTaskApi.reducer,
      [mockAreaApi.reducerPath]: mockAreaApi.reducer,
      [mockProjectApi.reducerPath]: mockProjectApi.reducer,
      [mockRecurrenceApi.reducerPath]: mockRecurrenceApi.reducer,
    },
    middleware: gDM =>
      gDM().concat(
        mockTaskApi.middleware,
        mockAreaApi.middleware,
        mockProjectApi.middleware,
        mockRecurrenceApi.middleware
      ),
  });

const task = (overrides: Partial<ITask> = {}): ITask => ({
  id: 't1',
  projectId: 'p1',
  title: 'Write report',
  status: TaskStatus.ACTIVE,
  priority: TaskPriority.MEDIUM,
  energy: TaskEnergy.MEDIUM,
  rollsOver: true,
  displayOrder: 0,
  totalFocusSeconds: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const withTasks = (tasks: ITask[]) =>
  server.use(
    http.get(`${API}/projects/:projectId/tasks`, () =>
      HttpResponse.json({ data: { items: tasks, nextCursor: '' }, error: null })
    )
  );

const renderSection = async (projectId = 'p1') =>
  render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <TasksSection projectId={projectId} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );

beforeEach(() => {
  server.use(
    http.get(`${API}/projects`, () => HttpResponse.json({ data: { items: [], nextCursor: '' }, error: null }))
  );
});

describe('TasksSection', () => {
  it('shows the empty-state copy when there are zero tasks', async () => {
    withTasks([]);
    await renderSection();

    await waitFor(() => expect(screen.getByText('No tasks yet')).toBeTruthy());
    expect(screen.getByText('Create your first task to get started.')).toBeTruthy();
  });

  it('renders tasks and defaults to the Active filter', async () => {
    withTasks([task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE })]);
    await renderSection();

    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());
  });

  it('hides done tasks under the default Active filter', async () => {
    withTasks([
      task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE }),
      task({ id: 't2', title: 'Done one', status: TaskStatus.DONE }),
    ]);
    await renderSection();

    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());
    expect(screen.queryByText('Done one')).toBeNull();
  });

  it('switches to the Done filter and shows the done task', async () => {
    withTasks([
      task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE }),
      task({ id: 't2', title: 'Done one', status: TaskStatus.DONE }),
    ]);
    await renderSection();
    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('task-filter-done'));

    await waitFor(() => expect(screen.getByText('Done one')).toBeTruthy());
    expect(screen.queryByText('Active one')).toBeNull();
  });

  it('creates a task from the quick-add bar', async () => {
    withTasks([]);
    let capturedBody: unknown;
    server.use(
      http.post(`${API}/projects/p1/tasks`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: task({ id: 't2', title: 'New task' }), error: null });
      })
    );
    await renderSection();
    await waitFor(() => expect(screen.getByTestId('task-quick-add')).toBeTruthy());

    await fireEvent.changeText(screen.getByTestId('task-quick-add'), 'New task');
    await fireEvent(screen.getByTestId('task-quick-add'), 'submitEditing');

    await waitFor(() => expect(capturedBody).toMatchObject({ title: 'New task' }));
  });

  it('toggles a task to done via the checkbox', async () => {
    withTasks([task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE })]);
    let capturedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t1/status`, async ({ request }) => {
        capturedStatus = ((await request.json()) as { status: string }).status;
        return HttpResponse.json({ data: task({ id: 't1', status: TaskStatus.DONE }), error: null });
      })
    );
    await renderSection();
    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());

    const { getAllByRole } = within(screen.getByTestId('task-item-t1'));
    await fireEvent.press(getAllByRole('checkbox')[0]);

    await waitFor(() => expect(capturedStatus).toBe(TaskStatus.DONE));
  });

  it('guards completion when the task has open subtasks and completes on confirm', async () => {
    withTasks([task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE, openSubtaskCount: 2 })]);
    let capturedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t1/status`, async ({ request }) => {
        capturedStatus = ((await request.json()) as { status: string }).status;
        return HttpResponse.json({ data: task({ id: 't1', status: TaskStatus.DONE }), error: null });
      })
    );
    await renderSection();
    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());

    const { getAllByRole } = within(screen.getByTestId('task-item-t1'));
    await fireEvent.press(getAllByRole('checkbox')[0]);

    await waitFor(() => expect(screen.getByText('Complete this task?')).toBeTruthy());
    expect(screen.getByText('This task still has 2 unfinished subtasks. Completing it leaves them open.')).toBeTruthy();
    expect(capturedStatus).toBeUndefined();

    await fireEvent.press(screen.getByText('Complete anyway'));

    await waitFor(() => expect(capturedStatus).toBe(TaskStatus.DONE));
  });

  it('does not guard completion when the task has zero open subtasks', async () => {
    withTasks([task({ id: 't1', title: 'Active one', status: TaskStatus.ACTIVE, openSubtaskCount: 0 })]);
    let capturedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t1/status`, async ({ request }) => {
        capturedStatus = ((await request.json()) as { status: string }).status;
        return HttpResponse.json({ data: task({ id: 't1', status: TaskStatus.DONE }), error: null });
      })
    );
    await renderSection();
    await waitFor(() => expect(screen.getByText('Active one')).toBeTruthy());

    const { getAllByRole } = within(screen.getByTestId('task-item-t1'));
    await fireEvent.press(getAllByRole('checkbox')[0]);

    // No open subtasks — the toggle should go straight through without
    // needing the guard sheet's "Complete anyway" confirm.
    await waitFor(() => expect(capturedStatus).toBe(TaskStatus.DONE));
  });
});
