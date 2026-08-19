import { zodResolver } from '@hookform/resolvers/zod';
import { RecurrenceFreq } from '@nicoflow/shared/types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Sheet, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
import { useCreateRecurrenceRuleMutation, useCreateTaskMutation, useGetProjectsQuery } from '@/lib/store';

import { buildRecurrenceSchedule, RECURRENCE_OPTIONS } from './recurrence';
import { taskCreateSchema, type TaskCreateFormData, type TaskCreateFormOutput } from './taskCreateSchema';

interface TaskCreateSheetProps {
  scheduledFor: string;
  onCreated: () => void;
}

// unwrap() rejects with the mutation's transformErrorResponse output — here
// that's the raw envelope's error half, { data: null, error: { code, message } }.
const isApiErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  typeof (error as { error?: unknown }).error === 'object' &&
  (error as { error?: { code?: unknown } }).error?.code === code;

export const TaskCreateSheet = forwardRef<SheetRef, TaskCreateSheetProps>(function TaskCreateSheet(
  { scheduledFor, onCreated },
  ref
) {
  const { data: projectsData } = useGetProjectsQuery();
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();
  const [createRule, { isLoading: isCreatingRule }] = useCreateRecurrenceRuleMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaskCreateFormData, unknown, TaskCreateFormOutput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: { title: '', projectId: '', priority: 'medium', energy: 'medium', recurrence: 'none' },
  });

  useEffect(() => {
    reset({ title: '', projectId: '', priority: 'medium', energy: 'medium', recurrence: 'none' });
  }, [scheduledFor, reset]);

  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  const onSubmit = async (data: TaskCreateFormOutput) => {
    try {
      if (data.recurrence === 'none') {
        await createTask({
          projectId: data.projectId,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          scheduledFor,
        }).unwrap();
      } else {
        await createRule({
          projectId: data.projectId,
          title: data.title,
          priority: data.priority,
          energy: data.energy,
          ...buildRecurrenceSchedule(data.recurrence as (typeof RecurrenceFreq)['DAILY' | 'WEEKLY' | 'MONTHLY']),
        }).unwrap();
      }
      onCreated();
    } catch (error) {
      if (isApiErrorCode(error, 'PLAN_LIMIT_EXCEEDED')) {
        setError('root', { message: 'planLimit' });
        return;
      }
      setError('root', { message: 'generic' });
    }
  };

  return (
    <Sheet ref={ref} snapPoints={['75%']}>
      <BottomSheetScrollView contentContainerClassName="gap-4 pb-8">
        <SheetHeader>
          <SheetTitle>New task</SheetTitle>
        </SheetHeader>

        {errors.root?.message === 'planLimit' && (
          <Alert>
            <AlertTitle>Recurrence limit reached</AlertTitle>
            <AlertDescription>Upgrade to Pro for unlimited recurring tasks.</AlertDescription>
          </Alert>
        )}
        {errors.root?.message === 'generic' && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t create task</AlertTitle>
            <AlertDescription>Something went wrong. Try again.</AlertDescription>
          </Alert>
        )}

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Input label="Task name" value={field.value} onChangeText={field.onChange} error={errors.title?.message} />
          )}
        />

        <Controller
          control={control}
          name="projectId"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">Project</Text>
              <Select value={field.value} onValueChange={field.onChange} options={projectOptions}>
                <SelectTrigger placeholder="Choose a project" />
              </Select>
              {errors.projectId && (
                <Text className="text-xs text-destructive dark:text-destructive-dark">Pick a project</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">Priority</Text>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]}>
                <SelectTrigger placeholder="Priority" />
              </Select>
            </View>
          )}
        />

        <Controller
          control={control}
          name="recurrence"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">Repeat</Text>
              <Select value={field.value} onValueChange={field.onChange} options={RECURRENCE_OPTIONS}>
                <SelectTrigger placeholder="None" />
              </Select>
            </View>
          )}
        />

        <Button
          label="Create task"
          onPress={handleSubmit(onSubmit)}
          loading={isCreatingTask || isCreatingRule}
        />
      </BottomSheetScrollView>
    </Sheet>
  );
});
