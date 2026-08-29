import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { createBucketApi, createTaskApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { CustomTabBar } from './CustomTabBar';
import { MOBILE_NAV_DESTINATIONS } from './data';

const API = 'http://localhost:8080/v1';
const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockTaskApi = createTaskApi(baseQuery);
const mockBucketApi = createBucketApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useGetTimeSpreadQuery: () => mockTaskApi.useGetTimeSpreadQuery(),
  useGetBucketsQuery: () => mockBucketApi.useGetBucketsQuery(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockTaskApi.reducerPath]: mockTaskApi.reducer, [mockBucketApi.reducerPath]: mockBucketApi.reducer },
    middleware: gDM => gDM().concat(mockTaskApi.middleware, mockBucketApi.middleware),
  });

beforeEach(() => {
  server.use(
    http.get(`${API}/time-spread`, () =>
      HttpResponse.json({ data: { today: [], tomorrow: [], thisWeek: [] }, error: null })
    ),
    http.get(`${API}/bucket`, () => HttpResponse.json({ data: { items: [] }, error: null }))
  );
});

const renderTabBar = async (props: BottomTabBarProps) =>
  render(
    <Provider store={makeStore()}>
      <CustomTabBar {...props} />
    </Provider>
  );

function makeProps(activeIndex: number, overrides?: Partial<BottomTabBarProps>): BottomTabBarProps {
  const routes = MOBILE_NAV_DESTINATIONS.map(d => ({ key: d.id, name: d.id, params: undefined }));
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();

  return {
    state: {
      index: activeIndex,
      routes,
      routeNames: routes.map(r => r.name),
      key: 'tab-state',
      type: 'tab',
      stale: false,
      history: [],
    } as unknown as BottomTabBarProps['state'],
    descriptors: {} as BottomTabBarProps['descriptors'],
    navigation: { emit, navigate } as unknown as BottomTabBarProps['navigation'],
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    ...overrides,
  } as BottomTabBarProps;
}

describe('CustomTabBar', () => {
  it('renders all 5 destination labels', async () => {
    await renderTabBar(makeProps(0));

    for (const destination of MOBILE_NAV_DESTINATIONS) {
      expect(screen.getByText(destination.label)).toBeTruthy();
    }
  });

  it('marks the active tab as selected via accessibilityState', async () => {
    await renderTabBar(makeProps(1));

    const inboxTab = screen.getByLabelText('Inbox');
    expect(inboxTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));

    const todayTab = screen.getByLabelText('Today');
    expect(todayTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  });

  it('pressing an inactive tab navigates to it', async () => {
    const props = makeProps(0);
    await renderTabBar(props);

    fireEvent.press(screen.getByLabelText('Areas'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('areas');
  });

  it('pressing the already-active tab does not navigate again', async () => {
    const props = makeProps(0);
    await renderTabBar(props);

    fireEvent.press(screen.getByLabelText('Today'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });

  describe('badges', () => {
    it('shows the unprocessed-bucket count on Inbox and the today-scheduled count on Today', async () => {
      server.use(
        http.get(`${API}/bucket`, () =>
          HttpResponse.json({ data: { items: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }] }, error: null })
        ),
        http.get(`${API}/time-spread`, () =>
          HttpResponse.json({
            data: { today: [{ id: 't1' }, { id: 't2' }], tomorrow: [], thisWeek: [] },
            error: null,
          })
        )
      );

      await renderTabBar(makeProps(0));

      await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('caps the badge at 9+', async () => {
      server.use(
        http.get(`${API}/bucket`, () =>
          HttpResponse.json({
            data: { items: Array.from({ length: 12 }, (_, i) => ({ id: `b${i}` })) },
            error: null,
          })
        )
      );

      await renderTabBar(makeProps(0));

      await waitFor(() => expect(screen.getByText('9+')).toBeTruthy());
    });

    it('hides the badge when the count is zero', async () => {
      await renderTabBar(makeProps(0));

      expect(screen.queryByText('0')).toBeNull();
    });

    it('excludes already-processed buckets from the Inbox count', async () => {
      server.use(
        http.get(`${API}/bucket`, () =>
          HttpResponse.json({
            data: {
              items: [
                { id: 'b1', processedAt: null },
                { id: 'b2', processedAt: '2026-01-01T00:00:00Z' },
              ],
            },
            error: null,
          })
        )
      );

      await renderTabBar(makeProps(0));

      await waitFor(() => expect(screen.getByText('1')).toBeTruthy());
    });
  });
});
