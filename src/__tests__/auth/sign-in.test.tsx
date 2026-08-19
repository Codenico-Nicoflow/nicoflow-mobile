import { createAuthApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import SignIn from '@/app/(auth)/sign-in';
import authReducer, { clearAuth, setToken, setUser } from '@/lib/store/slices/auth/authSlice';

import { server } from '../../../test/server';

const API = 'http://localhost:8080/v1';

jest.mock('@/lib/store', () => {
  const actual = jest.requireActual('@/lib/store/slices/auth/authSlice') as typeof import('@/lib/store/slices/auth/authSlice');
  return {
    useAppDispatch: () => mockStore.dispatch,
    useLoginMutation: () => mockAuthApi.useLoginMutation(),
    setToken: actual.setToken,
    setUser: actual.setUser,
    mobileTokenStorage: { setRefreshToken: jest.fn(), getRefreshToken: jest.fn(), getAccessToken: jest.fn() },
  };
});

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

const makeUser = () => ({ id: 'u1', email: 'nico@example.com', username: 'nico', plan: 'free' });

const renderSignIn = () =>
  render(
    <Provider store={mockStore}>
      <SignIn />
    </Provider>
  );

describe('SignIn', () => {
  it('renders identifier, password, and submit', async () => {
    await renderSignIn();
    expect(screen.getByLabelText('Email or username')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });

  it('AC1: logs in and stores the token in Redux on success', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ data: { token: 't', refreshToken: 'r', user: makeUser() }, error: null })
      )
    );

    await renderSignIn();
    await fireEvent.changeText(screen.getByLabelText('Email or username'), 'nico@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Password1');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockStore.getState().auth.token).toBe('t');
      expect(mockStore.getState().auth.user).toEqual(expect.objectContaining({ id: 'u1' }));
    });
  });

  it('AC2: renders a user-facing message on invalid credentials, no raw status', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
          { status: 401 }
        )
      )
    );

    await renderSignIn();
    await fireEvent.changeText(screen.getByLabelText('Email or username'), 'nico@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeTruthy();
    });
    expect(screen.queryByText('401')).toBeNull();
  });
});
