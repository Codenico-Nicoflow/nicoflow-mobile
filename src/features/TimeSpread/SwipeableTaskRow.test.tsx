import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createRecurrenceApi, createTaskApi } from '@nicoflow/shared/api';
import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { SwipeableTaskRow } from './SwipeableTaskRow';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);
const mockRecurrenceApi = createRecurrenceApi(baseQuery, mockTaskApi);

// Inject skipTaskOccurrence onto the local mockTaskApi so tests hit the MSW
// handler without pulling in the real store module singleton.
const { useSkipTaskOccurrenceMutation: mockUseSkipTaskOccurrenceMutation } = mockTaskApi.injectEndpoints({
  endpoints: build => ({
    skipTaskOccurrence: build.mutation<ITask, string>({
      query: id => ({ url: `/tasks/${id}/skip`, method: 'POST' }),
      transformResponse: (raw: { data: ITask }) => raw.data,
    }),
  }),
});

jest.mock('@/lib/store', () => ({
  useUpdateTaskStatusMutation: () => mockTaskApi.useUpdateTaskStatusMutation(),
  useMarkTaskMissedMutation: () => mockTaskApi.useMarkTaskMissedMutation(),
  useDeleteTaskMutation: () => mockTaskApi.useDeleteTaskMutation(),
  useDeleteRecurrenceRuleMutation: () => mockRecurrenceApi.useDeleteRecurrenceRuleMutation(),
  useSkipTaskOccurrenceMutation: () => mockUseSkipTaskOccurrenceMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: {
      [mockTaskApi.reducerPath]: mockTaskApi.reducer,
      [mockRecurrenceApi.reducerPath]: mockRecurrenceApi.reducer,
    },
    middleware: gDM => gDM().concat(mockTaskApi.middleware, mockRecurrenceApi.middleware),
  });

const task = (overrides: Partial<ITask> = {}): ITask => ({
  id: 't1',
  projectId: 'p1',
  title: 'Stand-up',
  status: TaskStatus.ACTIVE,
  priority: TaskPriority.MEDIUM,
  energy: TaskEnergy.MEDIUM,
  rollsOver: false,
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

const noop = jest.fn();

const renderRow = async (overrides: Partial<ITask> = {}) => {
  await render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <SwipeableTaskRow
            task={task(overrides)}
            segment="today"
            onToggleStatus={noop}
            onEdit={noop}
            onScheduleToday={noop}
            onScheduleTomorrow={noop}
            onUnschedule={noop}
            onDelete={noop}
            onSkip={noop}
            onEndSeries={noop}
          />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

describe('SwipeableTaskRow — recurring actions', () => {
  it('shows Skip and End-series in the dropdown for a recurring task', async () => {
    await renderRow({ recurrenceRuleId: 'r1' });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('Skip this occurrence')).toBeTruthy());
    expect(screen.getByText('End series…')).toBeTruthy();
  });

  it('hides Skip and End-series for a non-recurring task, shows Delete instead', async () => {
    await renderRow({ recurrenceRuleId: null });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    // The gorhom mock renders all sheet content simultaneously; "Delete Task"
    // may appear in both the menu item and the dialog title — use getAllByText.
    await waitFor(() => expect(screen.getAllByText('Delete Task').length).toBeGreaterThan(0));
    expect(screen.queryByText('Skip this occurrence')).toBeNull();
    expect(screen.queryByText('End series…')).toBeNull();
  });

  it('Skip opens a confirm dialog with the exact spec copy', async () => {
    await renderRow({ recurrenceRuleId: 'r1' });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('Skip this occurrence')).toBeTruthy());
    await fireEvent.press(screen.getByText('Skip this occurrence'));

    await waitFor(() => expect(screen.getByText('Skip this occurrence?')).toBeTruthy());
    expect(
      screen.getByText(
        "This occurrence won't be created and its reminder is cancelled. The series keeps running — the next occurrence is unaffected."
      )
    ).toBeTruthy();
  });

  it('End-series opens a confirm dialog with the exact spec copy', async () => {
    await renderRow({ recurrenceRuleId: 'r1' });

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('End series…')).toBeTruthy());
    await fireEvent.press(screen.getByText('End series…'));

    await waitFor(() => expect(screen.getByText('End this recurring series?')).toBeTruthy());
    expect(
      screen.getByText("Future occurrences won't be created. Past completed tasks are kept. This can't be undone.")
    ).toBeTruthy();
  });

  it('confirming End-series calls the onEndSeries prop', async () => {
    const onEndSeries = jest.fn();
    await render(
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <Provider store={makeStore()}>
            <SwipeableTaskRow
              task={task({ recurrenceRuleId: 'r1' })}
              segment="today"
              onToggleStatus={noop}
              onEdit={noop}
              onScheduleToday={noop}
              onScheduleTomorrow={noop}
              onUnschedule={noop}
              onDelete={noop}
              onSkip={noop}
              onEndSeries={onEndSeries}
            />
          </Provider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('End series…')).toBeTruthy());
    await fireEvent.press(screen.getByText('End series…'));

    await waitFor(() => expect(screen.getByText('End series')).toBeTruthy());
    await fireEvent.press(screen.getByText('End series'));

    await waitFor(() => expect(onEndSeries).toHaveBeenCalled());
  });

  it('cancelling the End-series dialog does not call onEndSeries', async () => {
    const onEndSeries = jest.fn();
    await render(
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <Provider store={makeStore()}>
            <SwipeableTaskRow
              task={task({ recurrenceRuleId: 'r1' })}
              segment="today"
              onToggleStatus={noop}
              onEdit={noop}
              onScheduleToday={noop}
              onScheduleTomorrow={noop}
              onUnschedule={noop}
              onDelete={noop}
              onSkip={noop}
              onEndSeries={onEndSeries}
            />
          </Provider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );

    await fireEvent.press(screen.getByLabelText('Task actions'));
    await waitFor(() => expect(screen.getByText('End series…')).toBeTruthy());
    await fireEvent.press(screen.getByText('End series…'));

    // gorhom mock renders all sheet content simultaneously — multiple "Cancel"
    // buttons may exist; press the first one visible after the dialog appears.
    await waitFor(() => expect(screen.getAllByText('Cancel').length).toBeGreaterThan(0));
    await fireEvent.press(screen.getAllByText('Cancel')[0]);

    expect(onEndSeries).not.toHaveBeenCalled();
  });
});
