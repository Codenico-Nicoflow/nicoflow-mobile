import {
  createAreaApi,
  createAuthApi,
  createBucketApi,
  createProjectApi,
  createRecurrenceApi,
  createTaskApi,
} from '@nicoflow/shared/api';
import { router } from 'expo-router';
import { combineReducers, configureStore, type UnknownAction } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer, { clearAuth, setToken, setUser } from './slices/auth/authSlice';
import { createBaseQueryWithReauth } from './slices/baseQuery';
import { createMobileTokenStorage } from './slices/tokenStorage';
import { createMobileWSLifecycleAdapter } from './slices/wsLifecycle';

const resolveTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// mobileTokenStorage is constructed before the store exists, so its accessors
// are late-bound — same ordering trick as web's tokenStorage.ts (this module
// closes over `store`, assigned below, rather than capturing it up front).
const lateDispatch = (action: UnknownAction): void => void store.dispatch(action);

export const mobileTokenStorage = createMobileTokenStorage(() => store.getState(), lateDispatch);

// Constructed once alongside tokenStorage — no WS client consumes this yet
// (that's a later real-time story), but the adapter itself belongs here so
// the WS client can be wired in without touching store.ts again.
export const mobileWSLifecycleAdapter = createMobileWSLifecycleAdapter();

// On a definitive session expiry (refresh failed with no recoverable token),
// bounce to sign-in. Only navigate if we're not already there — router.replace
// itself is idempotent, but this avoids clobbering in-flight navigation state.
const baseQueryWithReauth = createBaseQueryWithReauth(mobileTokenStorage, () => {
  router.replace('/sign-in');
});

export const authApi = createAuthApi(baseQueryWithReauth, { clearAuth, setToken, setUser }, resolveTimeZone);
export const taskApi = createTaskApi(baseQueryWithReauth);
export const areaApi = createAreaApi(baseQueryWithReauth);
export const projectApi = createProjectApi(baseQueryWithReauth, areaApi);
export const recurrenceApi = createRecurrenceApi(baseQueryWithReauth);
export const bucketApi = createBucketApi(baseQueryWithReauth);

const apiReducerPaths = [
  authApi.reducerPath,
  taskApi.reducerPath,
  areaApi.reducerPath,
  projectApi.reducerPath,
  recurrenceApi.reducerPath,
  bucketApi.reducerPath,
] as const;

const combinedReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [areaApi.reducerPath]: areaApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [recurrenceApi.reducerPath]: recurrenceApi.reducer,
  [bucketApi.reducerPath]: bucketApi.reducer,
});

type CombinedState = ReturnType<typeof combinedReducer>;

// On logout wipe every RTK Query cache so a different user never sees the
// previous account's cached data. Same pattern as nicoflow-frontend's
// rootReducer — add new api slices to apiReducerPaths as they're wired in.
export const rootReducer = (state: CombinedState | undefined, action: Parameters<typeof combinedReducer>[1]) => {
  if (action.type === clearAuth.type && state) {
    const cleared: Partial<CombinedState> = { ...state };
    for (const path of apiReducerPaths) delete cleared[path];
    return combinedReducer(cleared as CombinedState, action);
  }
  return combinedReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      taskApi.middleware,
      areaApi.middleware,
      projectApi.middleware,
      recurrenceApi.middleware,
      bucketApi.middleware
    ),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
