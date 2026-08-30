import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { FileX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskSheet, type TaskSheetRef } from '@/features/TimeSpread/TaskSheet';
import { useGetTaskQuery } from '@/lib/store';

// Deep-link target for `nicoflow://task/:id` and "view what this became" from
// a processed bucket item (ArchivedList). No standalone detail layout exists
// on mobile — editing happens in the same TaskSheet every other surface uses,
// presented as soon as the scalar loads. Back-navigation (not dismiss alone)
// on close, since this route has nothing else to show once the sheet shuts.
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(['task', 'common']);
  const { data: task, isLoading, isError } = useGetTaskQuery(id, { skip: !id });
  const sheetRef = useRef<TaskSheetRef>(null);

  useEffect(() => {
    if (task) sheetRef.current?.present({ task });
  }, [task]);

  if (isLoading) {
    return (
      <View className="flex-1 gap-3 px-4 pt-3" testID="task-detail-loading">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full rounded-md" />
      </View>
    );
  }

  if (isError || !task) {
    return (
      <EmptyState
        icon={FileX}
        title={t('task:detail.notFoundTitle')}
        description={t('task:detail.notFoundDescription')}
        action={<Button label={t('common:actions.back')} variant="outline" onPress={() => router.back()} />}
        testID="task-not-found"
      />
    );
  }

  return <TaskSheet ref={sheetRef} onSaved={() => sheetRef.current?.dismiss()} onDismiss={() => router.back()} />;
}
