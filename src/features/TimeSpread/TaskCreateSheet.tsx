import { TaskEnergy, TaskPriority } from '@nicoflow/shared/types';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Sheet, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
import { useCreateTaskMutation, useGetProjectsQuery } from '@/lib/store';

// RecurrenceField (components/fields/RecurrenceField.tsx) is temporarily
// pulled from this form — toggling its Switch reproducibly crashes the app
// natively (SIGABRT, confirmed via device crash log, JS/Hermes threads
// idle) even after removing every nested BottomSheetModal/Sheet it mounted.
// The files stay on disk; re-wire once the actual mechanism is found.

// present(scheduledFor) instead of a plain SheetRef — the caller hands the
// default date directly at the moment it opens the sheet, rather than via a
// prop the component re-derives on its own render cycle. That prop-based
// approach raced: present() was called synchronously right after the
// caller's setState, before React had re-rendered this component with the
// new prop value, so the sheet opened (and later reset) using whichever
// scheduledFor was current on the PREVIOUS render — a stale, one-segment-
// behind default. Passing it straight into present() sidesteps the render
// cycle entirely.
export interface TaskCreateSheetRef {
  present: (scheduledFor: string) => void;
  dismiss: () => void;
}

interface TaskCreateSheetProps {
  onCreated: () => void;
}

const emptyFields = (scheduledFor: string): TaskFieldsValue => ({
  title: '',
  notes: '',
  priority: TaskPriority.LOW,
  energy: TaskEnergy.MEDIUM,
  scheduledFor,
  rollsOver: true,
  estimatedMinutes: null,
  url: '',
});

export const TaskCreateSheet = forwardRef<TaskCreateSheetRef, TaskCreateSheetProps>(function TaskCreateSheet(
  { onCreated },
  ref
) {
  const { data: projectsData } = useGetProjectsQuery();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [fields, setFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [projectId, setProjectId] = useState('');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [projectError, setProjectError] = useState<string | undefined>();
  const [formError, setFormError] = useState<'generic' | null>(null);

  const resetForm = (scheduledFor: string) => {
    setFields(emptyFields(scheduledFor));
    setProjectId('');
    setTitleError(undefined);
    setProjectError(undefined);
    setFormError(null);
  };

  useImperativeHandle(ref, () => ({
    present: scheduledFor => {
      resetForm(scheduledFor);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const setField = <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  const onSubmit = async () => {
    setFormError(null);
    const missingTitle = !fields.title.trim();
    const missingProject = !projectId;
    setTitleError(missingTitle ? 'Name is required' : undefined);
    setProjectError(missingProject ? 'Pick a project' : undefined);
    if (missingTitle || missingProject) return;

    try {
      await createTask({
        projectId,
        title: fields.title,
        notes: fields.notes || undefined,
        priority: fields.priority,
        energy: fields.energy,
        rollsOver: fields.rollsOver,
        scheduledFor: fields.scheduledFor ?? undefined,
        estimatedMinutes: fields.estimatedMinutes ?? undefined,
        url: fields.url || undefined,
      }).unwrap();
      onCreated();
    } catch {
      setFormError('generic');
    }
  };

  return (
    <Sheet ref={sheetRef} snapPoints={['75%']}>
      <View className="gap-4">
        <SheetHeader>
          <SheetTitle>New task</SheetTitle>
        </SheetHeader>

        {formError === 'generic' && (
          <Alert variant="destructive">
            <AlertDescription>Couldn&apos;t create task. Something went wrong. Try again.</AlertDescription>
          </Alert>
        )}

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Project</Text>
          <Select
            value={projectId}
            onValueChange={v => {
              setProjectId(v);
              setProjectError(undefined);
            }}
            options={projectOptions}>
            <SelectTrigger placeholder="Choose a project" />
          </Select>
          {projectError && <Text className="text-xs text-destructive dark:text-destructive-dark">{projectError}</Text>}
        </View>

        <TaskFieldsForm value={fields} onChange={setField} titleError={titleError} />

        <Button label="Create task" onPress={onSubmit} loading={isCreatingTask} />
      </View>
    </Sheet>
  );
});
