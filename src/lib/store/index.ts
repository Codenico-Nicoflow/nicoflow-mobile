import {
  aiApi,
  areaApi,
  authApi,
  bucketApi,
  noteApi,
  notificationApi,
  projectApi,
  recurrenceApi,
  searchApi,
  subtaskApi,
  taskApi,
} from './store';

export { useSkipTaskOccurrenceMutation } from './store';

// Store exports
export type { AppDispatch, RootState } from './store';
export {
  aiApi,
  areaApi,
  authApi,
  bucketApi,
  mobileTokenStorage,
  mobileWSLifecycleAdapter,
  noteApi,
  notificationApi,
  persistor,
  projectApi,
  recurrenceApi,
  searchApi,
  store,
  subtaskApi,
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
  useChangePasswordMutation,
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
export const {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTaskQuery,
  useGetTasksInfiniteQuery,
  useGetTimeSpreadQuery,
  useMarkTaskMissedMutation,
  useReorderTaskMutation,
  useScheduleTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} = taskApi;

// Area exports — hooks are generated on the instance constructed in store.ts
export const {
  useCreateAreaMutation,
  useDeleteAreaMutation,
  useGetAreasQuery,
  useGetAreasWithProjectsQuery,
  useReorderAreasMutation,
  useUpdateAreaMutation,
} = areaApi;

// Project exports — hooks are generated on the instance constructed in store.ts
export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectQuery,
  useGetProjectsQuery,
  useReorderProjectsMutation,
  useUpdateProjectMutation,
} = projectApi;

// Recurrence exports — a repeating task is created as a rule, not a task field.
// Update/Delete/Get let TaskSheet load and edit a task's EXISTING rule in place
// instead of always creating a new one on every edit.
export const {
  useConvertTaskToRecurringMutation,
  useCreateRecurrenceRuleMutation,
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRuleQuery,
  useUpdateRecurrenceRuleMutation,
} = recurrenceApi;

// Bucket exports — hooks are generated on the instance constructed in store.ts
export const {
  useCreateBucketMutation,
  useDeleteBucketMutation,
  useGetBucketsQuery,
  useProcessBucketMutation,
  useUpdateBucketMutation,
} = bucketApi;

// Note exports — hooks are generated on the instance constructed in store.ts
export const {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetBacklinksQuery,
  useGetNoteQuery,
  useGetNotesInfiniteQuery,
  useLazySearchMentionsQuery,
  useUpdateNoteMutation,
} = noteApi;

// Subtask exports — hooks are generated on the instance constructed in store.ts
export const { useCreateSubtaskMutation, useDeleteSubtaskMutation, useGetSubtasksQuery, useUpdateSubtaskMutation } =
  subtaskApi;

// AI exports — hooks are generated on the instance constructed in store.ts
export const {
  useCreateAISessionMutation,
  useDeleteAISessionMutation,
  useGetAISessionQuery,
  useGetAISessionsQuery,
  useGetAIUsageQuery,
} = aiApi;

// Search exports — hooks are generated on the instance constructed in store.ts
export const { useSearchQuery } = searchApi;
export type { IAreaResult, INoteResult, IProjectResult, ISearchResults, ITaskResult } from '@nicoflow/shared/api';

// Notification exports — hooks are generated on the instance constructed in store.ts
export const { useGetPreferencesQuery, useUpdatePreferencesMutation } = notificationApi;
