import { type IBucket, ProcessingResult, TaskEnergy, TaskPriority } from '@nicoflow/shared/types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CheckSquare } from 'lucide-react-native';
import { forwardRef, useEffect, useState } from 'react';
import { Text, TextInput, useColorScheme, View } from 'react-native';

import { TaskFieldsForm, type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Sheet, SheetDescription, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
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

const emptyFields = (content: string): TaskFieldsValue => ({
  title: content.split('\n')[0]?.trim().slice(0, 255) || '',
  notes: content.split('\n').slice(1).join('\n').trim(),
  priority: TaskPriority.LOW,
  energy: TaskEnergy.MEDIUM,
  scheduledFor: null,
  rollsOver: true,
  estimatedMinutes: null,
  url: '',
});

export const BucketProcessSheet = forwardRef<SheetRef, BucketProcessSheetProps>(function BucketProcessSheet(
  { bucket, onProcessed },
  ref
) {
  const isDark = useColorScheme() === 'dark';
  const { data: projectsData } = useGetProjectsQuery();
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const [type, setType] = useState<ProcessingResult>(ProcessingResult.TASK);
  const [projectId, setProjectId] = useState('');
  const [fields, setFields] = useState<TaskFieldsValue>(() => emptyFields(''));
  const [titleError, setTitleError] = useState<string | undefined>();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bucket) return;
    setType(ProcessingResult.TASK);
    setProjectId('');
    setError(null);
    setTitleError(undefined);
    setNoteTitle(truncateNoteTitle(bucket.content));
    setNoteBody(bucket.content);
    setFields(emptyFields(bucket.content));
  }, [bucket]);

  const setField = <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  const submitTask = async () => {
    if (!bucket) return;
    if (!fields.title.trim()) {
      setTitleError('Name is required');
      return;
    }
    setTitleError(undefined);
    try {
      await processBucket({
        id: bucket.id,
        data: {
          processingResult: ProcessingResult.TASK,
          projectId,
          taskDetails: {
            title: fields.title,
            notes: fields.notes || undefined,
            priority: fields.priority,
            energy: fields.energy,
            rollsOver: fields.rollsOver,
            scheduledFor: fields.scheduledFor ?? undefined,
            estimatedMinutes: fields.estimatedMinutes ?? undefined,
            url: fields.url || undefined,
          },
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
    type === ProcessingResult.TASK ? submitTask : type === ProcessingResult.NOTE ? submitNote : submitTrash;

  const canSubmit = type === ProcessingResult.TRASH || !!projectId;

  return (
    <Sheet ref={ref} snapPoints={['90%']}>
      <BottomSheetScrollView contentContainerClassName="gap-4 pb-8">
        <SheetHeader>
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
              <CheckSquare size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
            </View>
            <View className="flex-1">
              <SheetTitle>Process Bucket Item</SheetTitle>
              <SheetDescription>Transform this item into a task, note, or idea for later.</SheetDescription>
            </View>
          </View>
        </SheetHeader>

        {bucket && (
          <View className="gap-1 rounded-lg bg-muted dark:bg-muted-dark p-3">
            <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
              Original content
            </Text>
            <Text className="text-sm text-foreground dark:text-foreground-dark">{bucket.content}</Text>
          </View>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Couldn&apos;t process this item. Try again.</AlertDescription>
          </Alert>
        )}

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Turn into</Text>
          <Select value={type} onValueChange={v => setType(v as ProcessingResult)} options={TYPE_OPTIONS}>
            <SelectTrigger />
          </Select>
        </View>

        {type !== ProcessingResult.TRASH && (
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Project</Text>
            <Select value={projectId} onValueChange={setProjectId} options={projectOptions}>
              <SelectTrigger placeholder="Choose a project" />
            </Select>
          </View>
        )}

        {type === ProcessingResult.TASK && (
          <TaskFieldsForm value={fields} onChange={setField} titleError={titleError} />
        )}

        {type === ProcessingResult.NOTE && (
          <>
            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Note title</Text>
              <TextInput
                value={noteTitle}
                onChangeText={setNoteTitle}
                maxLength={NOTE_TITLE_MAX}
                className="h-12 rounded-md border border-input dark:border-input-dark px-3 text-base bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark"
              />
            </View>
            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Note body</Text>
              <Textarea value={noteBody} onChangeText={setNoteBody} placeholder="Note body" className="min-h-24" />
            </View>
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
