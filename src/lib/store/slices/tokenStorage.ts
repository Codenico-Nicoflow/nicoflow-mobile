import * as SecureStore from 'expo-secure-store';

import type { TokenStorage } from '@nicoflow/shared/api/adapters';
import type { UnknownAction } from '@reduxjs/toolkit';

import { clearAuth, setToken } from './auth/authSlice';

const REFRESH_TOKEN_KEY = 'nicoflow.refreshToken';

// Mobile's TokenStorage: the access token lives in the Redux `auth` slice
// (memory-only, same reasoning as web — never persisted, XSS/exfil surface
// stays small). RN has no HttpOnly-cookie mechanism, so unlike web the refresh
// token is a real value the app must hold — expo-secure-store (Keychain/Keystore
// backed) is the persistence layer. getState/dispatch are structurally typed
// and late-bound for the same reason as web's tokenStorage.ts: this module is
// constructed inside store.ts before configureStore() returns.
export const createMobileTokenStorage = (
  getState: () => { auth: { token: string | null } },
  dispatch: (action: UnknownAction) => void
): TokenStorage => ({
  getAccessToken: () => getState().auth.token,
  setAccessToken: token => {
    dispatch(setToken(token));
  },
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: async token => {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    dispatch(clearAuth());
  },
});
