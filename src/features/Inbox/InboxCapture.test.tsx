import { createBucketApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { InboxCapture } from './InboxCapture';

const API = 'http://localhost:8080/v1';

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

  it('AC4: preserves the typed text and shows an error when capture fails', async () => {
    server.use(
      http.post(`${API}/bucket`, () =>
        HttpResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, { status: 500 })
      )
    );
    await renderCapture();

    await fireEvent.changeText(screen.getByPlaceholderText('Capture anything on your mind...'), 'Buy milk');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to Bucket' }));

    await waitFor(() => expect(screen.getByText(/Couldn’t save/)).toBeTruthy());
    expect(screen.getByPlaceholderText('Capture anything on your mind...').props.value).toBe('Buy milk');
  });

  it('AC2: enforces the max length at the input level', async () => {
    await renderCapture();
    expect(screen.getByPlaceholderText('Capture anything on your mind...').props.maxLength).toBe(500);
  });
});
