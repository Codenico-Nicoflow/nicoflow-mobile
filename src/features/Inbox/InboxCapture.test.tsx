import { createBucketApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { __resetToastsForTests, subscribe, type ToastItem } from '@/components/ui/toast/store';

import { server } from '../../../test/server';

import { InboxCapture } from './InboxCapture';

const API = 'http://localhost:8080/v1';

let latestToasts: ToastItem[] = [];
const subscribedItems = () => latestToasts;

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockBucketApi = createBucketApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useCreateBucketMutation: () => mockBucketApi.useCreateBucketMutation(),
}));

const makeStore = () =>
  configureStore({
    reducer: { [mockBucketApi.reducerPath]: mockBucketApi.reducer },
    middleware: gDM => gDM().concat(mockBucketApi.middleware),
  });

const renderCapture = () =>
  render(
    <Provider store={makeStore()}>
      <InboxCapture />
    </Provider>
  );

describe('InboxCapture', () => {
  beforeEach(() => {
    __resetToastsForTests();
    latestToasts = [];
    subscribe(items => {
      latestToasts = items;
    });
  });

  it('AC1: clears the input after a successful capture', async () => {
    server.use(
      http.post(`${API}/bucket`, () =>
        HttpResponse.json({
          data: { id: 'b1', userId: 'u1', content: 'Buy milk', createdAt: '', updatedAt: '' },
          error: null,
        })
      )
    );
    await renderCapture();

    await fireEvent.changeText(screen.getByPlaceholderText('Capture anything on your mind...'), 'Buy milk');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to Bucket' }));

    await waitFor(() => expect(screen.getByPlaceholderText('Capture anything on your mind...').props.value).toBe(''));
  });

  it('AC4/NIC-1958: preserves the typed text and offers a Retry toast when capture fails', async () => {
    server.use(
      http.post(`${API}/bucket`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );
    await renderCapture();

    await fireEvent.changeText(screen.getByPlaceholderText('Capture anything on your mind...'), 'Buy milk');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to Bucket' }));

    // Failure never drops the draft (AC4) and never crashes/silently fails —
    // it surfaces via the shared toast queue with a Retry action, not an
    // inline banner.
    await waitFor(() => expect(subscribedItems()).toHaveLength(1));
    expect(subscribedItems()[0]).toMatchObject({ variant: 'error', action: { label: 'Retry' } });
    expect(screen.getByPlaceholderText('Capture anything on your mind...').props.value).toBe('Buy milk');
  });

  it('AC2: enforces the max length at the input level', async () => {
    await renderCapture();
    expect(screen.getByPlaceholderText('Capture anything on your mind...').props.maxLength).toBe(500);
  });
});
