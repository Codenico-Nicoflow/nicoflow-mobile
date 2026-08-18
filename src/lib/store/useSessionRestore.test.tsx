import type { IUser } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Provider } from 'react-redux';

import authReducer, { setToken, setUser } from '@/lib/store/slices/auth/authSlice';

import { useSessionRestore } from './useSessionRestore';

const mockRefreshSessionFromStore = jest.fn();

jest.mock('@/lib/store', () => ({
  mobileTokenStorage: {},
  refreshSessionFromStore: (...args: unknown[]) => mockRefreshSessionFromStore(...args),
  useAppDispatch: () => mockStore.dispatch,
  useAppSelector: (selector: (state: ReturnType<typeof mockStore.getState>) => unknown) =>
    selector(mockStore.getState()),
}));

let mockStore: ReturnType<typeof configureStore>;

const makeUser = () =>
  ({ id: 'u1', email: 'nico@example.com', username: 'nico', plan: 'free' }) as unknown as IUser;

function Probe() {
  const { restoring } = useSessionRestore();
  return <Text>{restoring ? 'restoring' : 'idle'}</Text>;
}

const renderProbe = () =>
  render(
    <Provider store={mockStore}>
      <Probe />
    </Provider>
  );

beforeEach(() => {
  mockRefreshSessionFromStore.mockReset();
  mockStore = configureStore({ reducer: { auth: authReducer } });
});

describe('useSessionRestore', () => {
  it('paints idle immediately when there is no persisted user', async () => {
    await renderProbe();
    expect(screen.getByText('idle')).toBeTruthy();
    expect(mockRefreshSessionFromStore).not.toHaveBeenCalled();
  });

  it('paints idle immediately when a token already exists (nothing to restore)', async () => {
    mockStore.dispatch(setUser(makeUser()));
    mockStore.dispatch(setToken('already-have-one'));

    await renderProbe();
    expect(screen.getByText('idle')).toBeTruthy();
    expect(mockRefreshSessionFromStore).not.toHaveBeenCalled();
  });

  it('renders restoring instantly off the persisted user, then flips to idle once refresh resolves', async () => {
    mockStore.dispatch(setUser(makeUser()));
    let resolveRefresh: (token: string | null) => void = () => {};
    mockRefreshSessionFromStore.mockReturnValue(
      new Promise<string | null>(resolve => {
        resolveRefresh = resolve;
      })
    );

    await renderProbe();
    expect(screen.getByText('restoring')).toBeTruthy();

    resolveRefresh('new-token');
    await waitFor(() => {
      expect(screen.getByText('idle')).toBeTruthy();
    });
  });
});
