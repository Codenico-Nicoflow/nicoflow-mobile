import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { type ITask, TaskEnergy, TaskPriority, TaskStatus } from '@nicoflow/shared/types';
import { normalizeScheduleForFreq } from '@nicoflow/shared/utils';
import { CheckSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ProjectPicker } from '@/components/fields/ProjectPicker';
import { type RecurrenceValue } from '@/components/fields/recurrence';
import { RecurrenceField } from '@/components/fields/RecurrenceField';
import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { TaskStatusField } from '@/components/fields/TaskStatusField';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { useCreateRecurrenceRuleMutation, useCreateTaskMutation, useUpdateTaskMutation } from '@/lib/store';
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
export const TaskSheet = forwardRef<TaskSheetRef, TaskSheetProps>(function TaskSheet({ onSaved, onCreateSubmit }, ref) {
  const { t } = useTranslation(['task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useUpdateTaskMutation();
  const [createRule, { isLoading: isCreatingRule }] = useCreateRecurrenceRuleMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [task, setTask] = useState<ITask | null>(null);
  const isEditMode = !!task;

  const [fields, setFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [initialFields, setInitialFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [projectId, setProjectId] = useState('');
  const [initialProjectId, setInitialProjectId] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceValue | null>(null);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ACTIVE);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>(TaskStatus.ACTIVE);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [projectError, setProjectError] = useState<string | undefined>();
  const [formError, setFormError] = useState<'planLimit' | 'timedScheduling' | null>(null);

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
    setStatus(nextStatus);
    setInitialStatus(nextStatus);
    setTitleError(undefined);
    setProjectError(undefined);
    setFormError(null);
  };

  useImperativeHandle(ref, () => ({
    present: arg => {
      resetForm(arg);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

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
  const hasChanges = !fieldsEqual(fields, initialFields) || !!recurrence || projectChanged || statusChanged;

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
      if (isEditMode && recurrence) {
        // A repeating edit starts a NEW rule from this task forward rather than
        // mutating any rule the task already belongs to — same createRule call
        // as create-mode, just reachable from here too.
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

  const isLoading = isCreatingTask || isUpdatingTask || isCreatingRule;

  return (
    <Sheet ref={sheetRef} snapPoints={['75%']}>
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

        {formError === 'planLimit' && (
          <Alert>
            <AlertTitle>{t('common:planLimit.title')}</AlertTitle>
            <AlertDescription>{t('common:planLimit.description')}</AlertDescription>
          </Alert>
        )}

        {formError === 'timedScheduling' && (
          <Alert>
            <AlertTitle>{t('common:planLimit.title')}</AlertTitle>
            {/* Web's calendar:timedSchedulingLocked copy — mobile has no
                calendar i18n namespace registered yet (that feature isn't
                built), so this is inlined verbatim rather than pulling in a
                whole namespace for one string. */}
            <AlertDescription>
              Timed scheduling is a Pro feature. Upgrade to drag tasks to a specific time.
            </AlertDescription>
          </Alert>
        )}

        <ProjectPicker
          value={projectId}
          onChange={v => {
            setProjectId(v);
            setProjectError(undefined);
          }}
          error={projectError}
        />

        <TaskFieldsForm value={fields} onChange={setField} titleError={titleError} />

        {isEditMode && <TaskStatusField value={status} onChange={setStatus} />}

        {/* Turning this on for an existing task starts a NEW series from here
            forward — it never edits the rule the task already belongs to.
            Managing/pausing an existing rule stays in Settings. On a delegated
            create, the value is handed to onCreateSubmit instead of resolved
            here (see its call site above). */}
        <RecurrenceField value={recurrence} onChange={setRecurrence} />

        <Button
          label={isEditMode ? t('common:actions.save') : t('common:actions.create')}
          onPress={onSubmit}
          loading={isLoading}
          disabled={(isEditMode && !hasChanges) || isLoading}
        />
      </View>
    </Sheet>
  );
});
