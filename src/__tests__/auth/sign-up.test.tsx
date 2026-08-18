import { createAuthApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import SignUp from '@/app/(auth)/sign-up';
import authReducer, { clearAuth, setToken, setUser } from '@/lib/store/slices/auth/authSlice';

import { server } from '../../../test/server';

const API = 'http://localhost:8080/v1';

jest.mock('@/lib/store', () => ({
  useRegisterMutation: () => mockAuthApi.useRegisterMutation(),
}));

jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router') as object;
  return { ...actual, router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } };
});

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAuthApi = createAuthApi(baseQuery, { clearAuth, setToken, setUser }, () => 'UTC');

const mockStore = configureStore({
  reducer: { auth: authReducer, [mockAuthApi.reducerPath]: mockAuthApi.reducer },
  middleware: gDM => gDM().concat(mockAuthApi.middleware),
});

const renderSignUp = () =>
  render(
    <Provider store={mockStore}>
      <SignUp />
    </Provider>
  );

describe('SignUp', () => {
  it('AC3: rejects a password missing an uppercase letter (shared zod schema, no drift)', async () => {
    await renderSignUp();
    await fireEvent.changeText(screen.getByLabelText('Username'), 'nico');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'nico@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'lowercase1');
    await fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('validation.passwordUppercase')).toBeTruthy();
    });
  });

  it('registers successfully and shows the check-email panel, no auto-login', async () => {
    server.use(
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json({
          data: { token: 't', refreshToken: 'r', user: { id: 'u1', email: 'nico@example.com' } },
          error: null,
        })
      )
    );

    await renderSignUp();
    await fireEvent.changeText(screen.getByLabelText('Username'), 'nico');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'nico@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Password1');
    await fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeTruthy();
    });
    expect(mockStore.getState().auth.token).toBeNull();
  });
});
