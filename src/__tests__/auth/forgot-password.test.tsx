import { createAuthApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import ForgotPassword from '@/app/(auth)/forgot-password';
import authReducer, { clearAuth, setToken, setUser } from '@/lib/store/slices/auth/authSlice';

import { server } from '../../../test/server';

const API = 'http://localhost:8080/v1';

jest.mock('@/lib/store', () => ({
  useForgotPasswordMutation: () => mockAuthApi.useForgotPasswordMutation(),
}));

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAuthApi = createAuthApi(baseQuery, { clearAuth, setToken, setUser }, () => 'UTC');

const mockStore = configureStore({
  reducer: { auth: authReducer, [mockAuthApi.reducerPath]: mockAuthApi.reducer },
  middleware: gDM => gDM().concat(mockAuthApi.middleware),
});

const renderForgotPassword = () =>
  render(
    <Provider store={mockStore}>
      <ForgotPassword />
    </Provider>
  );

describe('ForgotPassword', () => {
  it('AC4: shows the same generic success message for an existing email', async () => {
    server.use(http.post(`${API}/auth/forgot-password`, () => HttpResponse.json({ data: null, error: null })));

    await renderForgotPassword();
    await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'exists@example.com');
    await fireEvent.press(screen.getByText('Send reset link'));

    await waitFor(() => {
      expect(screen.getByText('Check your inbox')).toBeTruthy();
    });
  });

  it('AC4: shows the identical generic success message for a non-existent email (no enumeration)', async () => {
    server.use(http.post(`${API}/auth/forgot-password`, () => HttpResponse.json({ data: null, error: null })));

    await renderForgotPassword();
    await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'never-registered@example.com');
    await fireEvent.press(screen.getByText('Send reset link'));

    await waitFor(() => {
      expect(screen.getByText('Check your inbox')).toBeTruthy();
      expect(screen.getByText('If an account exists for that email, we sent a reset link.')).toBeTruthy();
    });
  });
});
