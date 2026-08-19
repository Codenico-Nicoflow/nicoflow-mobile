import { authApi, bucketApi, projectApi, recurrenceApi, taskApi } from './store';

// Store exports
export type { AppDispatch, RootState } from './store';
export {
  areaApi,
  authApi,
  bucketApi,
  mobileTokenStorage,
  mobileWSLifecycleAdapter,
  persistor,
  projectApi,
  recurrenceApi,
  store,
  taskApi,
} from './store';

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
  useUpdateProfileMutation,
} = authApi;
export { clearAuth, selectUser, setToken, setUser } from './slices/auth/authSlice';

// Task exports — hooks are generated on the instance constructed in store.ts
export const { useCreateTaskMutation, useDeleteTaskMutation, useGetTimeSpreadQuery, useUpdateTaskStatusMutation } =
  taskApi;

// Project exports — project selector for the task-creation sheet
export const { useGetProjectsQuery } = projectApi;

// Recurrence exports — a repeating task is created as a rule, not a task field
export const { useCreateRecurrenceRuleMutation } = recurrenceApi;

// Bucket exports — hooks are generated on the instance constructed in store.ts
export const { useCreateBucketMutation, useDeleteBucketMutation, useGetBucketsQuery, useProcessBucketMutation } =
  bucketApi;
