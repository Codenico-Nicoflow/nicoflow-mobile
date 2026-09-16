import { createNotificationApi } from '@nicoflow/shared/api';
import type { INotification } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { NotificationsScreen } from './NotificationsScreen';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockApi = createNotificationApi(baseQuery);
const mockPush = jest.fn();
const mockSetBadgeCount = jest.fn((_count: number) => Promise.resolve(true));

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('expo-router', () => ({
  router: { push: (href: string) => mockPush(href) },
  Stack: { Screen: () => null },
}));
jest.mock('expo-notifications', () => ({ setBadgeCountAsync: (n: number) => mockSetBadgeCount(n) }));

jest.mock('@/lib/store', () => ({
  useGetNotificationsQuery: (args: { limit: number; cursor?: string }) => mockApi.useGetNotificationsQuery(args),
  useGetUnreadCountQuery: (arg: undefined, opts: object) => mockApi.useGetUnreadCountQuery(arg, opts),
  useMarkReadMutation: () => mockApi.useMarkReadMutation(),
  useMarkAllReadMutation: () => mockApi.useMarkAllReadMutation(),
  useDeleteNotificationMutation: () => mockApi.useDeleteNotificationMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockApi.reducerPath]: mockApi.reducer },
    middleware: gDM => gDM().concat(mockApi.middleware),
  });

const notification = (overrides: Partial<INotification> = {}): INotification => ({
  id: 'n1',
  type: 'task_completed',
  category: 'celebration',
  title: 'Task completed',
  body: 'Nice work',
  metadata: {},
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const renderScreen = () =>
  render(
    <Provider store={makeStore()}>
      <NotificationsScreen />
    </Provider>
  );

const listReturns = (items: INotification[], nextCursor = '') =>
  server.use(http.get(`${API}/notifications`, () => HttpResponse.json({ data: { items, nextCursor }, error: null })));

const unreadIs = (count: number) =>
  server.use(http.get(`${API}/notifications/unread-count`, () => HttpResponse.json({ data: { count }, error: null })));

beforeEach(() => {
  mockPush.mockClear();
  mockSetBadgeCount.mockClear();
  unreadIs(0);
});

describe('NotificationsScreen', () => {
  it('lists read and unread notifications together', async () => {
    listReturns([
      notification(),
      notification({ id: 'n2', title: 'Morning digest', type: 'morning_digest', category: 'reminder', isRead: true }),
    ]);

    await renderScreen();

    await waitFor(() => expect(screen.getByText('Task completed')).toBeTruthy());
    // Read rows stay on screen rather than disappearing — this list is the record
    // of what you missed, not just an unread queue.
    expect(screen.getByText('Morning digest')).toBeTruthy();
  });

  it('shows the empty state when there is nothing', async () => {
    listReturns([]);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('notifications-empty')).toBeTruthy());
  });

  it('deep-links a notification that names an entity', async () => {
    listReturns([notification({ metadata: { taskId: 't1' } })]);

    await renderScreen();

    await waitFor(() => expect(screen.getByText('Task completed')).toBeTruthy());
    await userEvent.press(screen.getByText('Task completed'));

    expect(mockPush).toHaveBeenCalledWith('/task/t1');
  });

  it('does not navigate for a notification with no entity target', async () => {
    listReturns([notification({ type: 'system_announcement', category: 'system', title: 'Scheduled downtime' })]);

    await renderScreen();

    await waitFor(() => expect(screen.getByText('Scheduled downtime')).toBeTruthy());
    await userEvent.press(screen.getByText('Scheduled downtime'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('offers mark-all-read only while something is unread', async () => {
    listReturns([notification()]);
    unreadIs(2);

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('mark-all-read-button')).toBeTruthy());
  });

  it('hides mark-all-read when everything is read', async () => {
    listReturns([notification({ isRead: true })]);
    unreadIs(0);

    await renderScreen();

    await waitFor(() => expect(screen.getByText('Task completed')).toBeTruthy());
    expect(screen.queryByTestId('mark-all-read-button')).toBeNull();
  });

  it('mirrors the unread count onto the OS app-icon badge', async () => {
    listReturns([notification()]);
    unreadIs(4);

    await renderScreen();

    await waitFor(() => expect(mockSetBadgeCount).toHaveBeenCalledWith(4));
  });
});
