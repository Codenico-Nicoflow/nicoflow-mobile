import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createTaskApi } from '@nicoflow/shared/api';
import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { TaskListItem } from './TaskListItem';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useUpdateTaskStatusMutation: () => mockTaskApi.useUpdateTaskStatusMutation(),
  useMarkTaskMissedMutation: () => mockTaskApi.useMarkTaskMissedMutation(),
  useDeleteTaskMutation: () => mockTaskApi.useDeleteTaskMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockTaskApi.reducerPath]: mockTaskApi.reducer },
    middleware: gDM => gDM().concat(mockTaskApi.middleware),
  });

const todayISO = () => new Date().toISOString().slice(0, 10);

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
  recurrenceRuleId: null,
  occurrenceStatus: null,
  occurrenceDate: null,
  ...overrides,
});

const renderItem = async (props: Partial<Parameters<typeof TaskListItem>[0]> = {}) => {
  const onEdit = jest.fn();
  const onToggleStatus = jest.fn();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <TaskListItem task={task()} onEdit={onEdit} onToggleStatus={onToggleStatus} {...props} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { onEdit, onToggleStatus };
};

describe('TaskListItem', () => {
  it('shows Mark Missed only when all 4 conditions hold', async () => {
    await renderItem({
      task: task({
        status: TaskStatus.ACTIVE,
        recurrenceRuleId: 'r1',
        occurrenceStatus: null,
        occurrenceDate: todayISO(),
      }),
    });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('Mark Missed')).toBeTruthy());
  });

  it('hides Mark Missed when the task is not recurring', async () => {
    await renderItem({ task: task({ recurrenceRuleId: null, occurrenceDate: todayISO() }) });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    expect(screen.queryByText('Mark Missed')).toBeNull();
  });

  it('hides Mark Missed when occurrenceStatus is already set', async () => {
    await renderItem({
      task: task({ recurrenceRuleId: 'r1', occurrenceStatus: 'completed', occurrenceDate: todayISO() }),
    });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    expect(screen.queryByText('Mark Missed')).toBeNull();
  });

  it('hides Mark Missed when occurrenceDate is in the future', async () => {
    await renderItem({ task: task({ recurrenceRuleId: 'r1', occurrenceDate: '2099-01-01' }) });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    expect(screen.queryByText('Mark Missed')).toBeNull();
  });

  it('shows the exact delete confirmation copy and deletes on confirm', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/tasks/t1`, () => {
        deleteCalled = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );
    await renderItem({ task: task({ title: 'Write report' }) });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await fireEvent.press(screen.getAllByText('Delete Task')[0]);

    await waitFor(() =>
      expect(
        screen.getByText('Are you sure you want to delete "Write report"? This action cannot be undone.')
      ).toBeTruthy()
    );

    // [0] menu item, [1] dialog title, [2] confirm button.
    await fireEvent.press(screen.getAllByText('Delete Task')[2]);
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('cancels the task from the actions menu', async () => {
    let capturedStatus: unknown;
    server.use(
      http.patch(`${API}/tasks/t1/status`, async ({ request }) => {
        capturedStatus = ((await request.json()) as { status: string }).status;
        return HttpResponse.json({ data: task({ status: TaskStatus.CANCELLED }), error: null });
      })
    );
    await renderItem();

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await fireEvent.press(screen.getByText('Cancel Task'));

    await waitFor(() => expect(capturedStatus).toBe(TaskStatus.CANCELLED));
  });
});
