import { type ITask } from '@nicoflow/shared/types';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
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

// Edit counterpart to TaskCreateSheet — same field set (TaskFieldsForm), but
// patches an existing task rather than creating one. present(task) takes the
// row directly, same imperative pattern as TaskCreateSheet.present(scheduledFor),
// to avoid the render-cycle prop race documented there.
export const TaskEditSheet = forwardRef<TaskEditSheetRef, { onUpdated: () => void }>(function TaskEditSheet(
  { onUpdated },
  ref
) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [fields, setFields] = useState<TaskFieldsValue | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [formError, setFormError] = useState(false);

  useImperativeHandle(ref, () => ({
    present: task => {
      setTaskId(task.id);
      setFields(toFields(task));
      setTitleError(undefined);
      setFormError(false);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const setField = <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) =>
    setFields(prev => (prev ? { ...prev, [key]: value } : prev));

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
          <SheetTitle>Edit task</SheetTitle>
        </SheetHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save changes</AlertTitle>
            <AlertDescription>Something went wrong. Try again.</AlertDescription>
          </Alert>
        )}

        {fields && <TaskFieldsForm value={fields} onChange={setField} titleError={titleError} />}

        <Button label="Save changes" onPress={onSubmit} loading={isLoading} />
      </View>
    </Sheet>
  );
});
