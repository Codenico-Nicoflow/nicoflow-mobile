import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { CheckSquare } from 'lucide-react-native';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, useColorScheme, View } from 'react-native';

import { type RecurrenceValue } from '@/components/fields/recurrence';
import { type TaskFieldsValue } from '@/components/fields/TaskFieldsForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger } from '@/components/ui/select';
import { Sheet, SheetDescription, SheetHeader, SheetTitle, type SheetRef } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useRetryableMutation } from '@/hooks/useRetryableMutation';
import { useGetProjectsQuery, useProcessBucketMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';

import { captureToDoc, NOTE_TITLE_MAX, truncateNoteTitle } from './noteDraft';
import { TaskSheet, type TaskSheetRef } from '../TimeSpread/TaskSheet';

// POST /v1/bucket/:id/process's taskDetails accepts scheduledTime + recurrence
// (companion backend work, nicoflow-api PR #174). @nicoflow/shared 0.8.4's
// TaskDetails/ProcessBucketDto don't carry them yet — widen locally until the
// shared package publishes (nicoflow-shared PR #63), same workaround as
// TaskSheet's UpdateTaskRequestWithProject, then delete this and pass the
// fields straight through.
type ProcessBucketRequestArg = Parameters<ReturnType<typeof useProcessBucketMutation>[0]>[0];
type ProcessBucketRequestWithRecurringTaskDetails = Omit<ProcessBucketRequestArg, 'data'> & {
  data: Omit<ProcessBucketRequestArg['data'], 'taskDetails'> & {
    taskDetails?: NonNullable<ProcessBucketRequestArg['data']['taskDetails']> & {
      scheduledTime?: string;
      recurrence?: {
        freq: string;
        interval?: number;
        byWeekday?: number[];
        byMonthday?: number | null;
        startDate: string;
        endDate?: string | null;
      };
    };
  };
};

interface BucketProcessSheetProps {
  bucket: IBucket | null;
  onProcessed: () => void;
}

export const BucketProcessSheet = forwardRef<SheetRef, BucketProcessSheetProps>(function BucketProcessSheet(
  { bucket, onProcessed },
  ref
) {
  const { t } = useTranslation(['bucket', 'task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const { data: projectsData } = useGetProjectsQuery();
  const [processBucket, { isLoading }] = useProcessBucketMutation();
  const runProcess = useRetryableMutation(processBucket);
  const [type, setType] = useState<ProcessingResult>(ProcessingResult.TASK);
  const [projectId, setProjectId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const taskSheetRef = useRef<TaskSheetRef>(null);

  const TYPE_OPTIONS: { value: ProcessingResult; label: string }[] = [
    { value: ProcessingResult.TASK, label: t('process.asTask') },
    { value: ProcessingResult.NOTE, label: t('process.asNote') },
    { value: ProcessingResult.TRASH, label: t('process.asTrash') },
  ];

  const projectOptions = (projectsData?.items ?? []).map(p => ({ label: p.name, value: p.id }));

  // Reseeds from the tapped bucket's content whenever a different item is
  // targeted (bucket.id changes) AND on every close (see Sheet's onDismiss
  // below) — the latter covers Cancel/backdrop/swipe-down, none of which
  // change bucket.id, so without it a dismissed-and-reopened sheet on the
  // same item would keep showing whatever the user last typed.
  const resetForm = () => {
    setType(ProcessingResult.TASK);
    setProjectId('');
    const content = bucket?.content ?? '';
    setNoteTitle(truncateNoteTitle(content));
    setNoteBody(content);
  };

  useEffect(() => {
    if (!bucket) return;
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket?.id]);

  // Bucket-processing creates the task and marks the item processed in one
  // atomic backend call (POST /bucket/:id/process) — there is no endpoint to
  // link an already-created task back to an inbox item. So TaskSheet can't
  // call useCreateTaskMutation like it normally does; it goes through
  // useProcessBucketMutation directly via the onCreateSubmit override. When
  // recurrence is set, it folds into taskDetails.recurrence rather than a
  // separate createRule call — the backend materializes instance #1 and marks
  // the bucket item processed in the same request. Errors are rethrown, not
  // toasted here — TaskSheet's own catch turns PLAN_LIMIT_EXCEEDED into its
  // inline alert and everything else into a retry toast; toasting here too
  // would double them up.
  const handleTaskCreateSubmit = async (
    fields: TaskFieldsValue,
    pickedProjectId: string,
    recurrence: RecurrenceValue | null
  ) => {
    if (!bucket) return;
    const request: ProcessBucketRequestWithRecurringTaskDetails = {
      id: bucket.id,
      data: {
        processingResult: ProcessingResult.TASK,
        projectId: pickedProjectId,
        taskDetails: {
          title: fields.title,
          notes: fields.notes || undefined,
          priority: fields.priority,
          energy: fields.energy,
          rollsOver: fields.rollsOver,
          scheduledFor: fields.scheduledFor ?? undefined,
          scheduledTime: fields.scheduledTime ?? undefined,
          estimatedMinutes: fields.estimatedMinutes ?? undefined,
          url: fields.url || undefined,
          ...(recurrence && {
            recurrence: {
              freq: recurrence.freq,
              interval: recurrence.interval,
              byWeekday: recurrence.byWeekday,
              byMonthday: recurrence.byMonthday,
              startDate: recurrence.startDate,
              endDate: recurrence.endDate,
            },
          }),
        },
      },
    };
    await processBucket(request as ProcessBucketRequestArg).unwrap();
    showSuccessToast(ToastMessages.BUCKET_PROCESSED_TASK, toast);
    onProcessed();
  };

  const submitNote = async () => {
    if (!bucket) return;
    const result = await runProcess({
      id: bucket.id,
      data: {
        processingResult: ProcessingResult.NOTE,
        projectId,
        noteDetails: { title: truncateNoteTitle(noteTitle), content: captureToDoc(noteBody) },
      },
    });
    if (!result) return;
    showSuccessToast(ToastMessages.BUCKET_PROCESSED_NOTE, toast);
    onProcessed();
  };

  const submitTrash = async () => {
    if (!bucket) return;
    const result = await runProcess({ id: bucket.id, data: { processingResult: ProcessingResult.TRASH } });
    if (!result) return;
    showSuccessToast(ToastMessages.BUCKET_PROCESSED_TRASH, toast);
    onProcessed();
  };

  const onSubmit = () => {
    if (type === ProcessingResult.TASK) {
      // Pre-fills from the bucket item's captured content, same split as web
      // (first line -> title, remainder -> notes). Opens as a second, stacked
      // sheet — the outer type-picker sheet stays mounted underneath.
      const content = bucket?.content ?? '';
      const initialTitle = content.split('\n')[0]?.trim().slice(0, 255) || '';
      const initialNotes = content.split('\n').slice(1).join('\n').trim();
      taskSheetRef.current?.present({ initialTitle, initialNotes });
      return;
    }
    void (type === ProcessingResult.NOTE ? submitNote() : submitTrash());
  };

  const canSubmit = type === ProcessingResult.TASK || type === ProcessingResult.TRASH || !!projectId;

  return (
    <>
      <Sheet ref={ref} snapPoints={['75%']} onDismiss={resetForm}>
        <View className="gap-4">
          <SheetHeader>
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
                <CheckSquare size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
              </View>
              <View className="flex-1">
                <SheetTitle>{t('processDialog.title')}</SheetTitle>
                <SheetDescription>{t('processDialog.description')}</SheetDescription>
              </View>
            </View>
          </SheetHeader>

          {bucket && (
            <View className="gap-1 rounded-lg bg-muted dark:bg-muted-dark p-3">
              <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                {t('processDialog.originalContent')}
              </Text>
              <Text className="text-sm text-foreground dark:text-foreground-dark">{bucket.content}</Text>
            </View>
          )}

          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
              {t('processDialog.processAs')}
            </Text>
            <Select value={type} onValueChange={v => setType(v as ProcessingResult)} options={TYPE_OPTIONS}>
              <SelectTrigger />
            </Select>
          </View>

          {type === ProcessingResult.NOTE && (
            <>
              <View className="gap-1.5">
                <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {t('projectSelector.label')}
                </Text>
                <Select value={projectId} onValueChange={setProjectId} options={projectOptions}>
                  <SelectTrigger placeholder={t('projectSelector.placeholder')} />
                </Select>
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {t('processDialog.noteTitleLabel')}
                </Text>
                <TextInput
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  maxLength={NOTE_TITLE_MAX}
                  placeholder={t('processDialog.noteTitlePlaceholder')}
                  className="h-12 rounded-md border border-input dark:border-input-dark px-3 text-base bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark"
                />
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                  {t('processDialog.noteBodyLabel')}
                </Text>
                <Textarea
                  value={noteBody}
                  onChangeText={setNoteBody}
                  placeholder={t('processDialog.noteBodyPlaceholder')}
                  className="min-h-24"
                />
              </View>
            </>
          )}

          {type === ProcessingResult.TRASH && (
            <Alert>
              <AlertDescription>{t('processDialog.trashAlert')}</AlertDescription>
            </Alert>
          )}

          <Button
            label={type === ProcessingResult.TASK ? t('common:actions.create') : t('actions.process')}
            onPress={onSubmit}
            loading={isLoading}
            disabled={!canSubmit}
          />
        </View>
      </Sheet>

      <TaskSheet ref={taskSheetRef} onSaved={() => taskSheetRef.current?.dismiss()} onCreateSubmit={handleTaskCreateSubmit} />
    </>
  );
});
