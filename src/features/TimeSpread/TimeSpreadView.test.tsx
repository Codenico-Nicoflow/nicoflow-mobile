import { createTaskApi } from '@nicoflow/shared/api';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { server } from '../../../test/server';

import { TimeSpreadView } from './TimeSpreadView';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useGetTimeSpreadQuery: () => mockTaskApi.useGetTimeSpreadQuery(),
  useUpdateTaskStatusMutation: () => mockTaskApi.useUpdateTaskStatusMutation(),
  useDeleteTaskMutation: () => mockTaskApi.useDeleteTaskMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockTaskApi.reducerPath]: mockTaskApi.reducer },
    middleware: gDM => gDM().concat(mockTaskApi.middleware),
  });

const task = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 't1',
  projectId: 'p1',
  title: 'Write report',
  status: 'active',
  priority: 'medium',
  energy: 'medium',
  rollsOver: false,
  scheduledFor: '2026-08-19',
  scheduledTime: null,
  displayOrder: 0,
  createdAt: '',
  updatedAt: '',
  totalFocusSeconds: 0,
  subtaskCount: 0,
  openSubtaskCount: 0,
  recurrenceRuleId: null,
  ...overrides,
});

const renderView = () =>
  render(
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <Provider store={makeStore()}>
          <TimeSpreadView />
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );

describe('TimeSpreadView', () => {
  it('AC1: shows the today segment tasks by default', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json({ data: { today: [task()], tomorrow: [], thisWeek: [] }, error: null })
      )
    );
    await renderView();
    await waitFor(() => expect(screen.getByText('Write report')).toBeTruthy());
  });

  it('AC1: switching segment re-queries and shows the new range without stale-flash', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json({
          data: { today: [task({ id: 't1', title: 'Today task' })], tomorrow: [task({ id: 't2', title: 'Tomorrow task' })], thisWeek: [] },
          error: null,
        })
      )
    );
    await renderView();
    await waitFor(() => expect(screen.getByText('Today task')).toBeTruthy());

    fireEvent.press(screen.getByText('Tomorrow'));

    await waitFor(() => expect(screen.getByText('Tomorrow task')).toBeTruthy());
    expect(screen.queryByText('Today task')).toBeNull();
  });

  it('AC2: shows segment-specific empty copy when the active segment has zero tasks', async () => {
    server.use(
      http.get(`${API}/time-spread`, () =>
        HttpResponse.json({ data: { today: [], tomorrow: [], thisWeek: [] }, error: null })
      )
    );
    await renderView();
    await waitFor(() => expect(screen.getByTestId('timespread-empty')).toBeTruthy());
    expect(screen.getByText('Nothing scheduled for today')).toBeTruthy();
  });
});
