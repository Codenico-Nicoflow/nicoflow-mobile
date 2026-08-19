import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskFormData } from '@nicoflow/shared/schemas';
import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Sheet, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useGetProjectsQuery, useProcessBucketMutation } from '@/lib/store';

import { captureToDoc, NOTE_TITLE_MAX, truncateNoteTitle } from './noteDraft';

interface BucketProcessSheetProps {
  bucket: IBucket | null;
  onProcessed: () => void;
}

const TYPE_OPTIONS: { value: ProcessingResult; label: string }[] = [
  { value: ProcessingResult.TASK, label: 'Task' },
  { value: ProcessingResult.NOTE, label: 'Note' },
  { value: ProcessingResult.TRASH, label: 'Trash' },
];

export const BucketProcessSheet = forwardRef<SheetRef, BucketProcessSheetProps>(function BucketProcessSheet(
  { bucket, onProcessed },
  ref
) {
  const { data: projectsData } = useGetProjectsQuery();
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const [type, setType] = useState<ProcessingResult>(ProcessingResult.TASK);
  const [projectId, setProjectId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', priority: 'medium', energy: 'medium' },
  });

  useEffect(() => {
    if (!bucket) return;
    setType(ProcessingResult.TASK);
    setError(null);
    setNoteTitle(truncateNoteTitle(bucket.content));
    setNoteBody(bucket.content);
    reset({ title: bucket.content.split('\n')[0]?.trim().slice(0, 255) || '', priority: 'medium', energy: 'medium' });
  }, [bucket, reset]);

  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  const submitTask = async (data: TaskFormData) => {
    if (!bucket) return;
    try {
      await processBucket({
        id: bucket.id,
        data: {
          processingResult: ProcessingResult.TASK,
          projectId,
          taskDetails: { title: data.title, priority: data.priority, energy: data.energy },
        },
      }).unwrap();
      onProcessed();
    } catch {
      setError('generic');
    }
  };

  const submitNote = async () => {
    if (!bucket) return;
    try {
      await processBucket({
        id: bucket.id,
        data: {
          processingResult: ProcessingResult.NOTE,
          projectId,
          noteDetails: { title: truncateNoteTitle(noteTitle), content: captureToDoc(noteBody) },
        },
      }).unwrap();
      onProcessed();
    } catch {
      setError('generic');
    }
  };

  const submitTrash = async () => {
    if (!bucket) return;
    try {
      await processBucket({ id: bucket.id, data: { processingResult: ProcessingResult.TRASH } }).unwrap();
      onProcessed();
    } catch {
      setError('generic');
    }
  };

  const onSubmit =
    type === ProcessingResult.TASK ? handleSubmit(submitTask) : type === ProcessingResult.NOTE ? submitNote : submitTrash;

  const canSubmit = type === ProcessingResult.TRASH || !!projectId;

  return (
    <Sheet ref={ref} snapPoints={['80%']}>
      <BottomSheetScrollView contentContainerClassName="gap-4 pb-8">
        <SheetHeader>
          <SheetTitle>Process item</SheetTitle>
        </SheetHeader>

        {bucket && (
          <View className="rounded-lg bg-muted dark:bg-muted-dark p-3">
            <Text className="text-sm text-foreground dark:text-foreground-dark">{bucket.content}</Text>
          </View>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Couldn&apos;t process this item. Try again.</AlertDescription>
          </Alert>
        )}

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">Turn into</Text>
          <Select value={type} onValueChange={v => setType(v as ProcessingResult)} options={TYPE_OPTIONS}>
            <SelectTrigger />
          </Select>
        </View>

        {type !== ProcessingResult.TRASH && (
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">Project</Text>
            <Select value={projectId} onValueChange={setProjectId} options={projectOptions}>
              <SelectTrigger placeholder="Choose a project" />
            </Select>
          </View>
        )}

        {type === ProcessingResult.TASK && (
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input
                label="Task name"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.title?.message}
              />
            )}
          />
        )}

        {type === ProcessingResult.NOTE && (
          <>
            <Input label="Note title" value={noteTitle} onChangeText={setNoteTitle} maxLength={NOTE_TITLE_MAX} />
            <Textarea value={noteBody} onChangeText={setNoteBody} placeholder="Note body" />
          </>
        )}

        {type === ProcessingResult.TRASH && (
          <Alert>
            <AlertDescription>This item will be discarded and moved to Archived.</AlertDescription>
          </Alert>
        )}

        <Button label="Process" onPress={onSubmit} loading={isLoading} disabled={!canSubmit} />
      </BottomSheetScrollView>
    </Sheet>
  );
});
