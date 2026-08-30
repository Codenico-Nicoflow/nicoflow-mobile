import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, SectionList, Text, View } from 'react-native';

import { type ITask, TaskStatus } from '@nicoflow/shared/types';
import { CalendarDays, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import {
  useDeleteRecurrenceRuleMutation,
  useDeleteTaskMutation,
  useGetTimeSpreadQuery,
  useScheduleTaskMutation,
  useSkipTaskOccurrenceMutation,
  useUpdateTaskStatusMutation,
} from '@/lib/store';
import { showErrorToast, showSuccessToast, ToastMessages } from '@/lib/toast';

import {
  groupByDay,
  nextStatus,
  type Segment,
  SEGMENT_KEYS,
  segmentToScheduledFor,
  selectSegmentTasks,
} from './segments';
import { SwipeableTaskRow } from './SwipeableTaskRow';
import { TaskSheet, type TaskSheetRef } from './TaskSheet';
import { TimeSpreadCombinedView } from './TimeSpreadCombinedView';
import { getStoredViewMode, setStoredViewMode, type ViewMode } from './viewMode';
import { ViewModeToggle } from './ViewModeToggle';

const todayISO = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
};

export function TimeSpreadView() {
  const { t, i18n } = useTranslation('task');
  const [segment, setSegment] = useState<Segment>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const { data, isLoading, isFetching, refetch } = useGetTimeSpreadQuery();
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [scheduleTask] = useScheduleTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [skipOccurrence] = useSkipTaskOccurrenceMutation();
  const [deleteRule] = useDeleteRecurrenceRuleMutation();
  const taskSheetRef = useRef<TaskSheetRef>(null);

  useEffect(() => {
    void getStoredViewMode().then(setViewMode);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    void setStoredViewMode(mode);
  };

  const tasks = selectSegmentTasks(segment, data);
  // isLoading only covers the very first request; a segment switch after that
  // is a refetch (same query, no args) so isFetching is what avoids showing
  // the previous segment's stale list while the new one loads (AC1).
  const showLoading = isLoading || isFetching;

  const weekGroups = useMemo(
    () => (segment === 'week' || viewMode === 'combined' ? groupByDay(data?.thisWeek ?? []) : []),
    [segment, viewMode, data?.thisWeek]
  );

  const dayHeaderFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: 'long', month: 'short', day: 'numeric' }),
    [i18n.resolvedLanguage]
  );

  // Mirrors web's TimeSpreadRow `run()` — every optimistic-feeling row action
  // (status/schedule) stays silent on success but surfaces an error toast on
  // failure, never a crash or a silently dropped tap.
  const run = async (op: Promise<unknown>) => {
    try {
      await op;
    } catch (error) {
      showErrorToast(error, toast);
    }
  };

  const handleToggleStatus = (task: ITask) => {
    const next = nextStatus(task.status);
    void updateStatus({ id: task.id, status: next })
      .unwrap()
      .then(() => {
        if (next === TaskStatus.DONE) showSuccessToast(ToastMessages.TASK_COMPLETED, toast);
      })
      .catch(error => showErrorToast(error, toast));
  };

  const handleEdit = (task: ITask) => {
    taskSheetRef.current?.present({ task });
  };

  const handleScheduleToday = (task: ITask) => {
    void run(scheduleTask({ id: task.id, scheduledFor: todayISO() }).unwrap());
  };

  const handleScheduleTomorrow = (task: ITask) => {
    void run(scheduleTask({ id: task.id, scheduledFor: tomorrowISO() }).unwrap());
  };

  const handleUnschedule = (task: ITask) => {
    void run(scheduleTask({ id: task.id, scheduledFor: null }).unwrap());
  };

  const handleDelete = (task: ITask) => {
    void deleteTask(task.id)
      .unwrap()
      .then(() => showSuccessToast(ToastMessages.TASK_DELETED_SUCCESSFULLY, toast))
      .catch(error => showErrorToast(error, toast));
  };

  const handleSkip = (task: ITask) => {
    void skipOccurrence(task.id)
      .unwrap()
      .then(() => showSuccessToast('Occurrence skipped.', toast))
      .catch(error => showErrorToast(error, toast));
  };

  const handleEndSeries = (task: ITask) => {
    if (!task.recurrenceRuleId) return;
    void deleteRule(task.recurrenceRuleId)
      .unwrap()
      .then(() => showSuccessToast('Series ended. Past occurrences kept.', toast))
      .catch(error => showErrorToast(error, toast));
  };

  const renderRow = (item: ITask) => (
    <SwipeableTaskRow
      task={item}
      segment={segment}
      onToggleStatus={handleToggleStatus}
      onEdit={handleEdit}
      onScheduleToday={handleScheduleToday}
      onScheduleTomorrow={handleScheduleTomorrow}
      onUnschedule={handleUnschedule}
      onDelete={handleDelete}
      onSkip={handleSkip}
      onEndSeries={handleEndSeries}
    />
  );

  const emptyState = (
    <EmptyState
      icon={CalendarDays}
      title={t(`timeSpread.${segment}.emptyTitle`)}
      description={t(`timeSpread.${segment}.emptyDescription`)}
      testID="timespread-empty"
    />
  );

  return (
    <View className="flex-1">
      <View className="flex-1 gap-4 px-4 pt-4">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
              {t('timeSpread.title')}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {t('timeSpread.subtitle')}
            </Text>
          </View>
          <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
        </View>

        {viewMode === 'tabs' && (
          <Tabs value={segment} onValueChange={value => setSegment(value as Segment)}>
            <TabsList>
              {SEGMENT_KEYS.map(key => (
                <TabsTrigger key={key} value={key}>
                  {t(`timeSpread.${key}.title`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {viewMode === 'combined' ? (
          <ScrollView contentContainerClassName="pb-4" testID="timespread-combined-scroll">
            <TimeSpreadCombinedView
              today={data?.today ?? []}
              tomorrow={data?.tomorrow ?? []}
              weekGroups={weekGroups}
              dayHeaderFormatter={dayHeaderFormatter}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
              onScheduleToday={handleScheduleToday}
              onScheduleTomorrow={handleScheduleTomorrow}
              onUnschedule={handleUnschedule}
              onDelete={handleDelete}
              onSkip={handleSkip}
              onEndSeries={handleEndSeries}
            />
          </ScrollView>
        ) : segment === 'week' ? (
          <SectionList
            sections={
              showLoading
                ? []
                : weekGroups.map(g => ({ title: dayHeaderFormatter.format(g.date), key: g.key, data: g.tasks }))
            }
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderSectionHeader={({ section }) => (
              <Text className="pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => <View className="pb-2">{renderRow(item)}</View>}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={showLoading ? null : emptyState}
          />
        ) : (
          <FlatList
            data={showLoading ? [] : tasks}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderItem={({ item }) => renderRow(item)}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={showLoading ? null : emptyState}
          />
        )}
      </View>

      <Button
        onPress={() => taskSheetRef.current?.present({ scheduledFor: segmentToScheduledFor(segment) })}
        className="absolute bottom-6 right-6 size-14 rounded-full"
        accessibilityLabel={t('quickAdd.fabLabel')}
      >
        <Plus size={24} color="#ffffff" />
      </Button>

      <TaskSheet ref={taskSheetRef} onSaved={() => taskSheetRef.current?.dismiss()} />
    </View>
  );
}
