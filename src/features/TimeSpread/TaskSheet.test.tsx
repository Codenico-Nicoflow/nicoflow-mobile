import { createRef } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  createAreaApi,
  createProjectApi,
  createRecurrenceApi,
  createSubtaskApi,
  createTaskApi,
} from '@nicoflow/shared/api';
import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { TaskSheet, type TaskSheetRef } from './TaskSheet';

// The real gorhom BottomSheetModal only paints its content after its native
// present() animation settles, which never happens under jsdom — the
// documented test mock renders sheet content unconditionally instead, which
// is what makes present()/dismiss() interactions assertable here at all.

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);
const mockAreaApi = createAreaApi(baseQuery);
const mockProjectApi = createProjectApi(baseQuery, mockAreaApi);
const mockRecurrenceApi = createRecurrenceApi(baseQuery, mockTaskApi);
const mockSubtaskApi = createSubtaskApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useCreateTaskMutation: () => mockTaskApi.useCreateTaskMutation(),
  useUpdateTaskMutation: () => mockTaskApi.useUpdateTaskMutation(),
  useGetProjectsQuery: () => mockProjectApi.useGetProjectsQuery(),
  useCreateRecurrenceRuleMutation: () => mockRecurrenceApi.useCreateRecurrenceRuleMutation(),
  useConvertTaskToRecurringMutation: () => mockRecurrenceApi.useConvertTaskToRecurringMutation(),
  useUpdateRecurrenceRuleMutation: () => mockRecurrenceApi.useUpdateRecurrenceRuleMutation(),
  useDeleteRecurrenceRuleMutation: () => mockRecurrenceApi.useDeleteRecurrenceRuleMutation(),
  useGetRecurrenceRuleQuery: (id: string, opts?: { skip?: boolean }) =>
    mockRecurrenceApi.useGetRecurrenceRuleQuery(id, opts),
  useGetSubtasksQuery: (taskId: string) => mockSubtaskApi.useGetSubtasksQuery(taskId),
  useCreateSubtaskMutation: () => mockSubtaskApi.useCreateSubtaskMutation(),
  useUpdateSubtaskMutation: () => mockSubtaskApi.useUpdateSubtaskMutation(),
  useDeleteSubtaskMutation: () => mockSubtaskApi.useDeleteSubtaskMutation(),
}));

const projects = [
  {
    id: 'p1',
    areaId: 'a1',
    name: 'Alpha Project',
    status: 'active',
    folderIcon: 'folder',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'p2',
    areaId: 'a1',
    name: 'Beta Project',
    status: 'active',
    folderIcon: 'folder',
    createdAt: '',
    updatedAt: '',
  },
];

beforeEach(() => {
  server.use(
    http.get(`${API}/projects`, () => HttpResponse.json({ data: { items: projects, nextCursor: '' }, error: null })),
    http.get(`${API}/tasks/:taskId/subtasks`, () => HttpResponse.json({ data: { items: [] }, error: null }))
  );
});

const makeStore = () =>
  configureStore({
    reducer: {
      [mockTaskApi.reducerPath]: mockTaskApi.reducer,
      [mockProjectApi.reducerPath]: mockProjectApi.reducer,
      [mockAreaApi.reducerPath]: mockAreaApi.reducer,
      [mockRecurrenceApi.reducerPath]: mockRecurrenceApi.reducer,
      [mockSubtaskApi.reducerPath]: mockSubtaskApi.reducer,
    },
    middleware: gDM =>
      gDM().concat(
        mockTaskApi.middleware,
        mockProjectApi.middleware,
        mockAreaApi.middleware,
        mockRecurrenceApi.middleware,
        mockSubtaskApi.middleware
      ),
  });

const task = (overrides: Partial<ITask> = {}): ITask => ({
  id: 't1',
  projectId: 'p1',
  title: 'Write report',
  notes: '',
  status: TaskStatus.ACTIVE,
  priority: TaskPriority.MEDIUM,
  energy: TaskEnergy.MEDIUM,
  rollsOver: false,
  scheduledFor: '2026-08-19',
  scheduledTime: null,
  estimatedMinutes: null,
  url: '',
  displayOrder: 0,
  createdAt: '',
  updatedAt: '',
  totalFocusSeconds: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  recurrenceRuleId: null,
  ...overrides,
});

const renderSheet = async (
  onSaved = jest.fn(),
  onCreateSubmit?: (fields: unknown, projectId: string) => Promise<void>
) => {
  const ref = createRef<TaskSheetRef>();
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <TaskSheet ref={ref} onSaved={onSaved} onCreateSubmit={onCreateSubmit as never} />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
  return { ref, onSaved };
};

describe('TaskSheet', () => {
  it('create mode shows the create title and an empty project picker', async () => {
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present());

    await waitFor(() => expect(screen.getByText('Create New Task')).toBeTruthy());
    expect(screen.getByText('Choose a project')).toBeTruthy();
  });

  it('edit mode pre-fills fields and the project picker from the task', async () => {
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));

    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());
    expect(screen.getByDisplayValue('Write report')).toBeTruthy();
    // "Alpha Project" appears both as the picker's selected-value trigger text
    // and as an option row rendered by the (unconditionally-rendering) test mock.
    expect(screen.getAllByText('Alpha Project').length).toBeGreaterThan(0);
  });

  it('edit mode keeps Save disabled until a field changes', async () => {
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());

    expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByDisplayValue('Write report'), 'Write report v2');

    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
  });

  it('reassigning the project in edit mode PATCHes projectId and calls onSaved', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${API}/tasks/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: task({ projectId: 'p2' }), error: null });
      })
    );
    const { ref, onSaved } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Beta Project')).toBeTruthy());

    await fireEvent.press(screen.getByText('Beta Project'));

    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(capturedBody).toMatchObject({ projectId: 'p2' });
  });

  it('setting recurrence on a plain task converts it IN PLACE rather than creating a duplicate', async () => {
    let convertCalled = false;
    let ruleCreated = false;
    server.use(
      http.post(`${API}/tasks/:taskId/convert-to-recurring`, () => {
        convertCalled = true;
        return HttpResponse.json({ data: { id: 'r1' }, error: null });
      }),
      http.post(`${API}/projects/:projectId/recurrence-rules`, () => {
        ruleCreated = true;
        return HttpResponse.json({ data: { id: 'r2' }, error: null });
      })
    );
    const { ref, onSaved } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());

    await fireEvent.press(screen.getByText('Off'));

    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(convertCalled).toBe(true);
    expect(ruleCreated).toBe(false);
  });

  const existingRule = {
    id: 'r1',
    projectId: 'p1',
    title: 'Write report',
    priority: 'medium',
    energy: 'medium',
    freq: 'weekly',
    interval: 1,
    byWeekday: [1],
    byMonthday: null,
    startDate: '2026-08-19',
    endDate: null,
    nextOccurrence: '2026-08-26',
    scheduledTime: null,
    paused: false,
    createdAt: '',
    updatedAt: '',
  };

  it('editing a task with an existing rule loads it and PATCHes the rule, never creating a duplicate', async () => {
    let ruleCreated = false;
    let rulePatched = false;
    server.use(
      http.get(`${API}/recurrence-rules/:id`, () => HttpResponse.json({ data: existingRule, error: null })),
      http.post(`${API}/projects/:projectId/recurrence-rules`, () => {
        ruleCreated = true;
        return HttpResponse.json({ data: { id: 'r2' }, error: null });
      }),
      http.patch(`${API}/recurrence-rules/:id`, () => {
        rulePatched = true;
        return HttpResponse.json({ data: existingRule, error: null });
      })
    );
    const { ref, onSaved } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task({ recurrenceRuleId: 'r1' }) }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());

    // The field must load as "on" and weekly (matching existingRule), not the
    // default closed state — otherwise reopening the switch here would itself
    // create a second rule.
    await waitFor(() => expect(screen.getByText('On')).toBeTruthy());

    // Touch the schedule itself (Mon -> also Tue) so recurrenceDirty flips —
    // editing an unrelated field must NOT route through the rule mutation at
    // all, so the schedule is what actually has to change here.
    await fireEvent.press(screen.getByText('Tue'));
    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(rulePatched).toBe(true);
    expect(ruleCreated).toBe(false);
  });

  it('turning recurrence off on a task with an existing rule DELETEs the rule, leaving the task itself untouched', async () => {
    let ruleDeleted = false;
    let taskPatched = false;
    server.use(
      http.get(`${API}/recurrence-rules/:id`, () => HttpResponse.json({ data: existingRule, error: null })),
      http.delete(`${API}/recurrence-rules/:id`, () => {
        ruleDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.patch(`${API}/tasks/:id`, () => {
        taskPatched = true;
        return HttpResponse.json({ data: task(), error: null });
      })
    );
    const { ref, onSaved } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task({ recurrenceRuleId: 'r1' }) }));
    await waitFor(() => expect(screen.getByText('On')).toBeTruthy());

    await fireEvent.press(screen.getByText('On'));

    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(ruleDeleted).toBe(true);
    expect(taskPatched).toBe(false);
  });

  it('delegates create to onCreateSubmit when provided, with scheduledTime/recurrence fields available', async () => {
    const onCreateSubmit = jest.fn().mockResolvedValue(undefined);
    const { ref, onSaved } = await renderSheet(jest.fn(), onCreateSubmit);
    await waitFor(() => ref.current?.present({ initialTitle: 'Captured thought', initialNotes: 'more detail' }));

    await waitFor(() => expect(screen.getByDisplayValue('Captured thought')).toBeTruthy());
    expect(screen.getByText('Scheduled time')).toBeTruthy();
    expect(screen.getByText('Repeats')).toBeTruthy();

    await fireEvent.press(screen.getByText('Alpha Project'));
    await fireEvent.press(screen.getByLabelText('Create'));

    await waitFor(() =>
      expect(onCreateSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Captured thought' }), 'p1', null)
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('delegated create with recurrence enabled sends the recurrence value through to onCreateSubmit', async () => {
    const onCreateSubmit = jest.fn().mockResolvedValue(undefined);
    const { ref, onSaved } = await renderSheet(jest.fn(), onCreateSubmit);
    await waitFor(() => ref.current?.present({ initialTitle: 'Captured thought' }));

    await waitFor(() => expect(screen.getByDisplayValue('Captured thought')).toBeTruthy());
    await fireEvent.press(screen.getByText('Alpha Project'));
    await fireEvent.press(screen.getByText('Off'));

    await fireEvent.press(screen.getByLabelText('Create'));

    await waitFor(() => expect(onCreateSubmit).toHaveBeenCalled());
    const [, , recurrence] = onCreateSubmit.mock.calls[0] as [unknown, unknown, { freq: string } | null];
    expect(recurrence).not.toBeNull();
    expect(recurrence?.freq).toBe('weekly');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the Status field only in edit mode', async () => {
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present());
    await waitFor(() => expect(screen.getByText('Create New Task')).toBeTruthy());
    expect(screen.queryByText('Select status')).toBeNull();

    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('changing Status PATCHes it and enables Save', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${API}/tasks/:id`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: task({ status: TaskStatus.CANCELLED }), error: null });
      })
    );
    const { ref, onSaved } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());
    expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(true);

    // "Active" appears both as the picker's selected-value trigger text and
    // as an option row (gorhom mock renders unconditionally) — press the
    // trigger, then the Cancelled option.
    await fireEvent.press(screen.getAllByText('Active')[0]);
    await waitFor(() => expect(screen.getByText('Cancelled')).toBeTruthy());
    await fireEvent.press(screen.getByText('Cancelled'));

    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(capturedBody).toMatchObject({ status: TaskStatus.CANCELLED });
  });

  it('shows the exact timed-scheduling Pro-gate copy on a 403 with a submitted time', async () => {
    server.use(
      http.patch(`${API}/tasks/:id`, () =>
        HttpResponse.json({ data: null, error: { code: 'PLAN_LIMIT_EXCEEDED', message: 'nope' } }, { status: 403 })
      )
    );
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task({ scheduledTime: '09:00' }) }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('Write report'), 'Write report v2');
    await waitFor(() => expect(screen.getByLabelText('Save Changes').props.accessibilityState.disabled).toBe(false));
    await fireEvent.press(screen.getByLabelText('Save Changes'));

    await waitFor(() =>
      expect(
        screen.getByText('Timed scheduling is a Pro feature. Upgrade to drag tasks to a specific time.')
      ).toBeTruthy()
    );
  });

  it('recurrence weekly shows a weekday picker, monthly shows a day-of-month select', async () => {
    const { ref } = await renderSheet();
    await waitFor(() => ref.current?.present({ task: task() }));
    await waitFor(() => expect(screen.getByText('Edit Task')).toBeTruthy());

    await fireEvent.press(screen.getByText('Off'));
    await waitFor(() => expect(screen.getByText('Weekly')).toBeTruthy());
    // Weekly is the default frequency once enabled — weekday picker visible.
    expect(screen.getByText('Sun')).toBeTruthy();

    await fireEvent.press(screen.getByText('Monthly'));
    await waitFor(() => expect(screen.queryByText('Sun')).toBeNull());
  });
});
