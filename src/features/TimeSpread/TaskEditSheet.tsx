import { type ITask } from '@nicoflow/shared/types';
import { CheckSquare } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme, View } from 'react-native';

import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, type SheetRef } from '@/components/ui/sheet';
import { useUpdateTaskMutation } from '@/lib/store';

export interface TaskEditSheetRef {
  present: (task: ITask) => void;
  dismiss: () => void;
}

const toFields = (task: ITask): TaskFieldsValue => ({
  title: task.title,
  notes: task.notes ?? '',
  priority: task.priority,
  energy: task.energy,
  scheduledFor: task.scheduledFor ?? '',
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
  a.rollsOver === b.rollsOver &&
  a.estimatedMinutes === b.estimatedMinutes &&
  a.url === b.url;

// Edit counterpart to TaskCreateSheet — same field set (TaskFieldsForm), but
// patches an existing task rather than creating one. present(task) takes the
// row directly, same imperative pattern as TaskCreateSheet.present(scheduledFor),
// to avoid the render-cycle prop race documented there.
export const TaskEditSheet = forwardRef<TaskEditSheetRef, { onUpdated: () => void }>(function TaskEditSheet(
  { onUpdated },
  ref
) {
  const { t } = useTranslation(['task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [initialFields, setInitialFields] = useState<TaskFieldsValue | null>(null);
  const [fields, setFields] = useState<TaskFieldsValue | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [formError, setFormError] = useState(false);

  useImperativeHandle(ref, () => ({
    present: task => {
      const seeded = toFields(task);
      setTaskId(task.id);
      setInitialFields(seeded);
      setFields(seeded);
      setTitleError(undefined);
      setFormError(false);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const setField = <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) =>
    setFields(prev => (prev ? { ...prev, [key]: value } : prev));

  // Same intent as web's hasFormChanges (nicoflow-frontend/src/lib/utils/index.ts) —
  // only the fields TaskFieldsForm actually edits, compared against the
  // snapshot taken at present() time, so Save stays disabled until something
  // in the form genuinely differs from the task as it currently stands.
  const hasChanges = !!fields && !!initialFields && !fieldsEqual(fields, initialFields);

  const onSubmit = async () => {
    if (!taskId || !fields) return;
    setFormError(false);
    const missingTitle = !fields.title.trim();
    setTitleError(missingTitle ? 'Name is required' : undefined);
    if (missingTitle) return;

    try {
      await updateTask({
        id: taskId,
        title: fields.title,
        notes: fields.notes || null,
        priority: fields.priority,
        energy: fields.energy,
        rollsOver: fields.rollsOver,
        scheduledFor: fields.scheduledFor || null,
        estimatedMinutes: fields.estimatedMinutes ?? null,
        url: fields.url || null,
      }).unwrap();
      onUpdated();
    } catch {
      setFormError(true);
    }
  };

  return (
    <Sheet ref={sheetRef} snapPoints={['75%']}>
      <View className="gap-4">
        <SheetHeader>
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
              <CheckSquare size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
            </View>
            <View className="flex-1">
              <SheetTitle>{t('dialog.editTitle')}</SheetTitle>
              <SheetDescription>{t('dialog.editDescription')}</SheetDescription>
            </View>
          </View>
        </SheetHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>{t('dialog.saveErrorTitle')}</AlertTitle>
            <AlertDescription>{t('dialog.genericErrorDescription')}</AlertDescription>
          </Alert>
        )}

        {fields && <TaskFieldsForm value={fields} onChange={setField} titleError={titleError} />}

        <Button label={t('common:actions.save')} onPress={onSubmit} loading={isLoading} disabled={!hasChanges || isLoading} />
      </View>
    </Sheet>
  );
});
