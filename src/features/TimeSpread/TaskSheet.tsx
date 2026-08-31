import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { normalizeScheduleForFreq } from '@nicoflow/shared/utils';
import { CheckSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProjectPicker } from '@/components/fields/ProjectPicker';
import { type RecurrenceValue } from '@/components/fields/recurrence';
import { RecurrenceField } from '@/components/fields/RecurrenceField';
import { SubtaskSection } from '@/components/fields/SubtaskSection';
import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { TaskStatusField } from '@/components/fields/TaskStatusField';
import { Button } from '@/components/ui/button';
import { PlanLimitAlert } from '@/components/ui/plan-limit-alert';
import { Sheet, SheetDescription, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import {
  useConvertTaskToRecurringMutation,
  useCreateRecurrenceRuleMutation,
  useCreateTaskMutation,
  useDeleteRecurrenceRuleMutation,
  useGetRecurrenceRuleQuery,
  useUpdateRecurrenceRuleMutation,
  useUpdateTaskMutation,
} from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';

// present(task?, scheduledFor?) instead of a plain SheetRef — the caller hands
// the default date / task row directly at the moment it opens the sheet,
// rather than via a prop this component re-derives on its own render cycle.
// A prop-based approach raced: present() was called synchronously right after
// the caller's setState, before React had re-rendered this component with the
// new prop value, so the sheet opened (and later reset) using whichever value
// was current on the PREVIOUS render. Passing straight into present() sidesteps
// the render cycle entirely.
// Edit mode presents an existing task; create mode presents optional seed
// values (Time Spread's FAB seeds scheduledFor, bucket-processing seeds
// title/notes from the captured content). `task` set means edit — the
// create-only fields are simply ignored in that case, keeping callers from
// having to fabricate a partial ITask for the create path.
export interface TaskSheetPresentArg {
  task?: ITask;
  scheduledFor?: string;
  initialTitle?: string;
  initialNotes?: string;
  /** Create-mode only. Seeds the project picker (e.g. opening from a project's own task list). */
  projectId?: string;
}

export interface TaskSheetRef {
  present: (arg?: TaskSheetPresentArg) => void;
  dismiss: () => void;
}

interface TaskSheetProps {
  onSaved: () => void;
  /** Fires on ANY close — save, backdrop tap, or swipe-down — unlike onSaved. */
  onDismiss?: () => void;
  /**
   * Create-mode only. When supplied, replaces the normal `useCreateTaskMutation`
   * call — the caller owns the request, success toast, and error handling.
   * Used by bucket-processing, whose endpoint atomically creates the task AND
   * marks the inbox item processed in one call; a plain createTask here would
   * either double-create the task or leave the bucket item unprocessed. The
   * caller also owns turning a set `recurrence` into whatever the delegated
   * endpoint's contract expects (bucket-process folds it into `taskDetails`
   * rather than a separate `createRule` call).
   */
  onCreateSubmit?: (fields: TaskFieldsValue, projectId: string, recurrence: RecurrenceValue | null) => Promise<void>;
}

const emptyFields = (scheduledFor: string, initialTitle?: string, initialNotes?: string): TaskFieldsValue => ({
  title: initialTitle ?? '',
  notes: initialNotes ?? '',
  priority: TaskPriority.LOW,
  energy: TaskEnergy.MEDIUM,
  scheduledFor,
  scheduledTime: null,
  rollsOver: true,
  estimatedMinutes: null,
  url: '',
});

const toFields = (task: ITask): TaskFieldsValue => ({
  title: task.title,
  notes: task.notes ?? '',
  priority: task.priority,
  energy: task.energy,
  scheduledFor: task.scheduledFor ?? '',
  scheduledTime: task.scheduledTime ?? null,
  rollsOver: task.rollsOver,
  estimatedMinutes: task.estimatedMinutes ?? null,
  url: task.url ?? '',
});

const fieldsEqual = (a: TaskFieldsValue, b: TaskFieldsValue): boolean =>
  a.title === b.title &&
  a.notes === b.notes &&
  a.priority === b.priority &&
  a.energy === b.energy &&
  a.scheduledFor === b.scheduledFor &&
  a.scheduledTime === b.scheduledTime &&
  a.rollsOver === b.rollsOver &&
  a.estimatedMinutes === b.estimatedMinutes &&
  a.url === b.url;

// unwrap() rejects with the mutation's transformErrorResponse output — here
// that's the raw envelope's error half, { data: null, error: { code, message } }.
const isApiErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  typeof (error as { error?: unknown }).error === 'object' &&
  (error as { error?: { code?: unknown } }).error?.code === code;

// Unified create+edit sheet, following the same isEditMode pattern as web's
// TaskDialog.tsx. Replaces the former TaskCreateSheet/TaskEditSheet split —
// both modes now share the project picker and recurrence field, which used
// to be create-only.
export const TaskSheet = forwardRef<TaskSheetRef, TaskSheetProps>(function TaskSheet(
  { onSaved, onDismiss, onCreateSubmit },
  ref
) {
  const { t } = useTranslation(['task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useUpdateTaskMutation();
  const [createRule, { isLoading: isCreatingRule }] = useCreateRecurrenceRuleMutation();
  const [convertTask, { isLoading: isConvertingTask }] = useConvertTaskToRecurringMutation();
  const [updateRule, { isLoading: isUpdatingRule }] = useUpdateRecurrenceRuleMutation();
  const [deleteRule, { isLoading: isDeletingRule }] = useDeleteRecurrenceRuleMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [task, setTask] = useState<ITask | null>(null);
  const isEditMode = !!task;
  // The task's own rule, if it has one — loaded so edit mode can show the real
  // schedule instead of always opening with "not repeating".
  const existingRuleId = task?.recurrenceRuleId ?? undefined;
  const { data: existingRule, isFetching: isLoadingRule } = useGetRecurrenceRuleQuery(existingRuleId as string, {
    skip: !existingRuleId,
  });

  const [fields, setFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [initialFields, setInitialFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [projectId, setProjectId] = useState('');
  const [initialProjectId, setInitialProjectId] = useState('');
  // null = not repeating. In edit mode this is seeded from the task's own rule
  // (see the effect below) so the field reflects reality instead of always
  // opening closed. Whether saving this creates a new rule or updates the
  // existing one is decided at submit time by whether `existingRuleId` is set.
  const [recurrence, setRecurrence] = useState<RecurrenceValue | null>(null);
  // Whether the user actually touched the recurrence field this session — as
  // opposed to it merely being pre-filled from the task's existing rule.
  const [recurrenceDirty, setRecurrenceDirty] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ACTIVE);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>(TaskStatus.ACTIVE);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [projectError, setProjectError] = useState<string | undefined>();
  const [formError, setFormError] = useState<'planLimit' | 'timedScheduling' | null>(null);
  // When editing a recurring task's non-recurrence fields, we need the user to
  // pick scope before firing the mutation. Rather than a nested modal (which
  // the gorhom mock doesn't render in tests), we toggle an inline view inside
  // this same sheet and store the pending mutation payload until the user picks.
  const [showScopeChooser, setShowScopeChooser] = useState(false);
  const pendingScopePayload = useRef<{
    ruleId: string;
    taskId: string;
    updateFields: TaskFieldsValue;
    currentStatus: TaskStatus;
    statusChanged: boolean;
  } | null>(null);

  const resetForm = (arg: TaskSheetPresentArg | undefined) => {
    const nextTask = arg?.task ?? null;
    const seeded = nextTask
      ? toFields(nextTask)
      : emptyFields(arg?.scheduledFor ?? '', arg?.initialTitle, arg?.initialNotes);
    const nextProjectId = nextTask?.projectId ?? arg?.projectId ?? '';
    const nextStatus = nextTask?.status ?? TaskStatus.ACTIVE;
    setTask(nextTask);
    setFields(seeded);
    setInitialFields(seeded);
    setProjectId(nextProjectId);
    setInitialProjectId(nextProjectId);
    setRecurrence(null);
    setRecurrenceDirty(false);
    setStatus(nextStatus);
    setInitialStatus(nextStatus);
    setTitleError(undefined);
    setProjectError(undefined);
    setFormError(null);
    setShowScopeChooser(false);
    pendingScopePayload.current = null;
  };

  useImperativeHandle(ref, () => ({
    present: arg => {
      resetForm(arg);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  // Seed the field from the task's own rule once it loads. Guarded by
  // recurrenceDirty so a background refetch never clobbers an edit the user
  // is mid-way through making.
  //
  // Two staleness traps this used to fall into, both from the sheet never
  // being unmounted between present() calls:
  //  1. existingRuleId truthy but existingRule not loaded yet (still fetching,
  //     or the rule was just deleted and this is a stale 404) used to do
  //     NOTHING — leaving whatever `recurrence` was in state from the PREVIOUS
  //     present() on the screen. Reopening a task right after deleting its
  //     rule showed the old recurring schedule.
  //  2. existingRule could be a different rule's cached data than the one
  //     existingRuleId now points at, if the query result lagged one render
  //     behind its own `skip` flag.
  // Both are closed by only accepting existingRule once its id actually
  // matches existingRuleId, and defaulting to null otherwise (fetching or
  // gone) rather than leaving the prior value untouched.
  useEffect(() => {
    if (!isEditMode || recurrenceDirty) return;
    if (existingRuleId && existingRule && existingRule.id === existingRuleId) {
      setRecurrence({
        freq: existingRule.freq,
        interval: existingRule.interval,
        byWeekday: existingRule.byWeekday,
        byMonthday: existingRule.byMonthday ?? null,
        startDate: existingRule.startDate,
        endDate: existingRule.endDate ?? null,
        scheduledTime: existingRule.scheduledTime ?? null,
      });
    } else {
      setRecurrence(null);
    }
  }, [isEditMode, existingRule, existingRuleId, recurrenceDirty]);

  // Recurrence owns the time-of-day once it's on — clear the task-level one so
  // it can't ride along stale into an update payload.
  useEffect(() => {
    if (recurrence && fields.scheduledTime) {
      setField('scheduledTime', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setField/fields intentionally excluded: this only reacts to recurrence turning on, not every field edit
  }, [recurrence]);

  const setField = <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) =>
    setFields(prev => ({ ...prev, [key]: value }));

  // Same intent as web's hasFormChanges + projectChanged/recurrence OR-ins —
  // only the fields TaskFieldsForm actually edits, compared against the
  // snapshot taken at present() time, so Save stays disabled until something
  // genuinely differs. Recurrence and project aren't form-backed, so each is
  // OR'd in separately: turning recurrence on, or reassigning the project, is
  // itself the change even if nothing else on the form moved.
  const projectChanged = isEditMode && projectId !== initialProjectId;
  const statusChanged = isEditMode && status !== initialStatus;
  const hasChanges = !fieldsEqual(fields, initialFields) || recurrenceDirty || projectChanged || statusChanged;

  const onSubmit = async () => {
    setFormError(null);
    const missingTitle = !fields.title.trim();
    const missingProject = !projectId;
    setTitleError(missingTitle ? 'Name is required' : undefined);
    setProjectError(missingProject ? 'Pick a project' : undefined);
    if (missingTitle || missingProject) return;

    if (isEditMode && !hasChanges) {
      sheetRef.current?.dismiss();
      return;
    }

    try {
      if (isEditMode && recurrenceDirty && recurrence && existingRuleId) {
        // Task already belongs to a rule and the user changed the schedule —
        // update that rule in place rather than creating a duplicate.
        await updateRule({
          id: existingRuleId,
          title: fields.title,
          notes: fields.notes || undefined,
          priority: fields.priority,
          energy: fields.energy,
          estimatedMinutes: fields.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else if (isEditMode && recurrenceDirty && recurrence && !existingRuleId) {
        // Turning a plain task into a repeating one: the SAME task becomes
        // instance #1, in place — never a second task. Template fields are
        // sent for type parity with createRule, but the server ignores them
        // and reads the task's own current values instead.
        await convertTask({
          taskId: task.id,
          title: fields.title,
          notes: fields.notes || undefined,
          priority: fields.priority,
          energy: fields.energy,
          estimatedMinutes: fields.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else if (isEditMode && recurrenceDirty && !recurrence && existingRuleId) {
        // Toggled recurrence off on a task that had a rule — end the series.
        // The current task instance and its history are untouched.
        await deleteRule(existingRuleId).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else if (isEditMode && task && existingRuleId) {
        // Editing a recurring task's non-recurrence fields: show inline scope
        // chooser and bail — the actual mutation fires from onScopeSelect.
        pendingScopePayload.current = {
          ruleId: existingRuleId,
          taskId: task.id,
          updateFields: fields,
          currentStatus: status,
          statusChanged,
        };
        setShowScopeChooser(true);
        return;
      } else if (isEditMode && task) {
        const updatePayload: Parameters<ReturnType<typeof useUpdateTaskMutation>[0]>[0] = {
          id: task.id,
          title: fields.title,
          notes: fields.notes || null,
          priority: fields.priority,
          energy: fields.energy,
          rollsOver: fields.rollsOver,
          scheduledFor: fields.scheduledFor || null,
          scheduledTime: fields.scheduledTime || null,
          estimatedMinutes: fields.estimatedMinutes ?? null,
          url: fields.url || null,
        };
        if (projectChanged) {
          updatePayload.projectId = projectId;
        }
        if (statusChanged) {
          updatePayload.status = status;
        }
        await updateTask(updatePayload).unwrap();
        showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      } else if (onCreateSubmit) {
        // Delegated create — the caller's endpoint does its own create (and any
        // side effect, e.g. marking a bucket item processed) and owns success
        // toasting; this sheet only dismisses. Recurrence is handed through
        // rather than resolved here, since bucket-process folds it into its
        // own taskDetails.recurrence instead of a separate createRule call.
        await onCreateSubmit(fields, projectId, recurrence);
      } else if (recurrence) {
        // A repeating task is created as a rule; the backend stamps instance
        // #1 from this same template inside the same transaction.
        await createRule({
          projectId,
          title: fields.title,
          notes: fields.notes || undefined,
          priority: fields.priority,
          energy: fields.energy,
          estimatedMinutes: fields.estimatedMinutes ?? undefined,
          ...normalizeScheduleForFreq(recurrence),
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      } else {
        await createTask({
          projectId,
          title: fields.title,
          notes: fields.notes || undefined,
          priority: fields.priority,
          energy: fields.energy,
          rollsOver: fields.rollsOver,
          scheduledFor: fields.scheduledFor || undefined,
          scheduledTime: fields.scheduledTime || undefined,
          estimatedMinutes: fields.estimatedMinutes ?? undefined,
          url: fields.url || undefined,
        }).unwrap();
        showSuccessToast(ToastMessages.TASK_CREATED_SUCCESSFULLY, toast);
      }
      onSaved();
    } catch (error) {
      if (isApiErrorCode(error, 'PLAN_LIMIT_EXCEEDED')) {
        // Plan-limit is a terminal, non-retryable state — the user must
        // upgrade, not resend the same payload — so it stays an inline
        // banner, never a Retry toast. Only a submitted time can have tripped
        // the timed-scheduling gate — on either the task or the recurrence
        // rule; any other 403 on this form is a task/project/rule count.
        const submittedTime = fields.scheduledTime || recurrence?.scheduledTime;
        setFormError(submittedTime ? 'timedScheduling' : 'planLimit');
        return;
      }
      // NIC-1958: same payload, same branch, re-fired verbatim on Retry.
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onSubmit();
        },
      });
    }
  };

  const onScopeSelect = async (scope: 'this' | 'future') => {
    const payload = pendingScopePayload.current;
    if (!payload) return;
    setShowScopeChooser(false);
    pendingScopePayload.current = null;
    try {
      if (scope === 'future') {
        await updateRule({
          id: payload.ruleId,
          title: payload.updateFields.title,
          notes: payload.updateFields.notes || undefined,
          priority: payload.updateFields.priority,
          energy: payload.updateFields.energy,
          estimatedMinutes: payload.updateFields.estimatedMinutes ?? undefined,
        }).unwrap();
      } else {
        const updatePayload: Parameters<ReturnType<typeof useUpdateTaskMutation>[0]>[0] = {
          id: payload.taskId,
          title: payload.updateFields.title,
          notes: payload.updateFields.notes || null,
          priority: payload.updateFields.priority,
          energy: payload.updateFields.energy,
          rollsOver: payload.updateFields.rollsOver,
          scheduledFor: payload.updateFields.scheduledFor || null,
          scheduledTime: payload.updateFields.scheduledTime || null,
          estimatedMinutes: payload.updateFields.estimatedMinutes ?? null,
          url: payload.updateFields.url || null,
        };
        if (payload.statusChanged) {
          updatePayload.status = payload.currentStatus;
        }
        await updateTask(updatePayload).unwrap();
      }
      showSuccessToast(ToastMessages.TASK_UPDATED_SUCCESSFULLY, toast);
      onSaved();
    } catch (error) {
      if (isApiErrorCode(error, 'PLAN_LIMIT_EXCEEDED')) {
        setFormError('planLimit');
        return;
      }
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onScopeSelect(scope);
        },
      });
    }
  };

  const onScopeCancel = () => {
    setShowScopeChooser(false);
    pendingScopePayload.current = null;
  };

  const isLoading =
    isCreatingTask || isUpdatingTask || isCreatingRule || isConvertingTask || isUpdatingRule || isDeletingRule;

  return (
    <Sheet ref={sheetRef} snapPoints={['75%']} onDismiss={onDismiss}>
      {showScopeChooser ? (
        <View className="gap-4" testID="scope-chooser">
          <SheetHeader>
            <SheetTitle>Apply changes to…</SheetTitle>
            <SheetDescription>This task repeats. Choose how far your changes should reach.</SheetDescription>
          </SheetHeader>

          <Pressable
            onPress={() => void onScopeSelect('this')}
            accessibilityRole="button"
            testID="scope-this"
            className="rounded-xl border border-input dark:border-input-dark bg-card dark:bg-card-dark p-4 active:opacity-70"
          >
            <Text className="text-foreground dark:text-foreground-dark text-[15px] font-semibold">
              This occurrence only
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm mt-1">
              Just this one date. The series keeps its original template.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void onScopeSelect('future')}
            accessibilityRole="button"
            testID="scope-future"
            className="rounded-xl border border-input dark:border-input-dark bg-card dark:bg-card-dark p-4 active:opacity-70"
          >
            <Text className="text-foreground dark:text-foreground-dark text-[15px] font-semibold">
              This and all future occurrences
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm mt-1">
              Updates the recurring template from this date onward. Past occurrences aren't changed.
            </Text>
          </Pressable>

          <Pressable
            onPress={onScopeCancel}
            accessibilityRole="button"
            testID="scope-cancel"
            className="h-11 rounded-md items-center justify-center border border-input dark:border-input-dark mt-1"
          >
            <Text className="text-foreground dark:text-foreground-dark text-[15px] font-semibold">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          <SheetHeader>
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
                <CheckSquare size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
              </View>
              <View className="flex-1">
                <SheetTitle>{isEditMode ? t('task:dialog.editTitle') : t('task:dialog.createTitle')}</SheetTitle>
                <SheetDescription>
                  {isEditMode ? t('task:dialog.editDescription') : t('task:dialog.createDescription')}
                </SheetDescription>
              </View>
            </View>
          </SheetHeader>

          {formError === 'planLimit' && <PlanLimitAlert />}

          {/* Web's calendar:timedSchedulingLocked copy — mobile has no calendar
              i18n namespace registered yet (that feature isn't built), so this
              is inlined verbatim rather than pulling in a whole namespace for
              one string. */}
          {formError === 'timedScheduling' && (
            <PlanLimitAlert message="Timed scheduling is a Pro feature. Upgrade to drag tasks to a specific time." />
          )}

          <ProjectPicker
            value={projectId}
            onChange={v => {
              setProjectId(v);
              setProjectError(undefined);
            }}
            error={projectError}
          />

          <TaskFieldsForm
            value={fields}
            onChange={setField}
            titleError={titleError}
            hideScheduledTime={!!recurrence}
            statusSlot={
              isEditMode && (
                <TaskStatusField
                  value={status}
                  onChange={next => {
                    // Recurring done tasks can't be un-completed — backend rejects
                    // with TASK_RECURRING_NOT_REVERSIBLE.
                    if (task?.recurrenceRuleId && status === TaskStatus.DONE && next === TaskStatus.ACTIVE) return;
                    setStatus(next);
                  }}
                />
              )
            }
            recurrenceSlot={
              // Editing an already-repeating task loads its real rule (see the
              // effect above) rather than always opening closed. Turning it off
              // ends that rule; turning it on for a plain task starts a new one —
              // see the submit branches for exactly which mutation each case
              // fires. On a delegated create, the value is handed to
              // onCreateSubmit instead of resolved here (see its call site above).
              <RecurrenceField
                value={recurrence}
                onChange={next => {
                  setRecurrence(next);
                  setRecurrenceDirty(true);
                }}
              />
            }
          />

          {isEditMode && task && <SubtaskSection taskId={task.id} />}

          <Button
            label={isEditMode ? t('common:actions.save') : t('common:actions.create')}
            onPress={onSubmit}
            loading={isLoading}
            disabled={(isEditMode && !hasChanges) || isLoading || isLoadingRule}
          />
        </View>
      )}
    </Sheet>
  );
});
