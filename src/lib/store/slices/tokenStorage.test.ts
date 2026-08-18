import * as SecureStore from 'expo-secure-store';

import { createMobileTokenStorage } from './tokenStorage';

describe('createMobileTokenStorage', () => {
  const makeStorage = () => {
    let state = { auth: { token: null as string | null } };
    const dispatch = jest.fn(action => {
      if (action.type === 'auth/setToken') state = { auth: { token: action.payload } };
      if (action.type === 'auth/clearAuth') state = { auth: { token: null } };
    });
    const getState = () => state;
    return { storage: createMobileTokenStorage(getState, dispatch), getState, dispatch };
  };

  it('getAccessToken reads from Redux state, not SecureStore', () => {
    const { storage, dispatch } = makeStorage();
    storage.setAccessToken('access-1');

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setToken', payload: 'access-1' }));
    expect(storage.getAccessToken()).toBe('access-1');
  });

  it('setRefreshToken persists only to SecureStore, never plain storage', async () => {
    const { storage } = makeStorage();
    await storage.setRefreshToken('refresh-1');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nicoflow.refreshToken', 'refresh-1');
  });

  it('setRefreshToken(null) deletes the SecureStore entry', async () => {
    const { storage } = makeStorage();
    await storage.setRefreshToken('refresh-1');
    await storage.setRefreshToken(null);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nicoflow.refreshToken');
  });

  it('getRefreshToken reads back from SecureStore', async () => {
    const { storage } = makeStorage();
    await storage.setRefreshToken('refresh-2');

    await expect(storage.getRefreshToken()).resolves.toBe('refresh-2');
  });

  it('clear wipes SecureStore and dispatches clearAuth', async () => {
    const { storage, dispatch } = makeStorage();
    await storage.setRefreshToken('refresh-3');
    await storage.clear();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('nicoflow.refreshToken');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/clearAuth' }));
    await expect(storage.getRefreshToken()).resolves.toBeNull();
  });
});
