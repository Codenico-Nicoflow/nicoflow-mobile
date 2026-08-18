import { authApi } from './store';

// Store exports
export type { AppDispatch, RootState } from './store';
export { authApi, mobileTokenStorage, mobileWSLifecycleAdapter, persistor, store } from './store';

// Hooks exports
export { useAppDispatch, useAppSelector, useAppUser } from './hooks';
export { useSessionRestore } from './useSessionRestore';

// The only sanctioned refresh entry point outside baseQuery (shares its
// single-flight mutex). Same pattern as nicoflow-frontend.
export { refreshSessionFromStore } from './slices/baseQuery';

// Auth exports — hooks are generated on the instance constructed in store.ts
export const {
  useForgotPasswordMutation,
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutAllMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRegisterMutation,
} = authApi;
export { clearAuth, selectUser, setToken, setUser } from './slices/auth/authSlice';
