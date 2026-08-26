import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import type { IBucket } from '@nicoflow/shared/types';
import { Inbox } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type AlertDialogRef } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { type SheetRef } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetBucketsQuery } from '@/lib/store';

import { ArchivedList } from './ArchivedList';
import { BucketDeleteAlert } from './BucketDeleteAlert';
import { BucketEditSheet } from './BucketEditSheet';
import { BucketProcessSheet } from './BucketProcessSheet';
import { BucketRow } from './BucketRow';
import { InboxCapture } from './InboxCapture';

function TabCountBadge({ count }: { count: number }) {
  return (
    <View className="h-5 min-w-5 items-center justify-center rounded-full border border-border dark:border-border-dark px-1">
      <Text className="text-[11px] font-medium text-foreground dark:text-foreground-dark">{count}</Text>
    </View>
  );
}

export function InboxView() {
  const { t } = useTranslation('bucket');
  const { data, isLoading, isFetching, refetch } = useGetBucketsQuery();
  const [processingBucket, setProcessingBucket] = useState<IBucket | null>(null);
  const [editingBucket, setEditingBucket] = useState<IBucket | null>(null);
  const [deletingBucket, setDeletingBucket] = useState<IBucket | null>(null);
  const processSheetRef = useRef<SheetRef>(null);
  const editSheetRef = useRef<SheetRef>(null);
  const deleteAlertRef = useRef<AlertDialogRef>(null);

  const items = data?.items ?? [];
  const unprocessed = items.filter(b => !b.processedAt);
  const archived = items.filter(b => !!b.processedAt);

  const handleOpenProcess = (bucket: IBucket) => {
    setProcessingBucket(bucket);
    processSheetRef.current?.present();
  };

  const handleOpenEdit = (bucket: IBucket) => {
    setEditingBucket(bucket);
    editSheetRef.current?.present();
  };

  const handleOpenDelete = (bucket: IBucket) => {
    setDeletingBucket(bucket);
    deleteAlertRef.current?.present();
  };

  const subtitle = isLoading
    ? ''
    : unprocessed.length === 0
      ? t('page.subtitleClear')
      : t('page.subtitle', { count: unprocessed.length });

  return (
    <View className="flex-1 gap-4 px-4 pt-4">
      <View>
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t('page.heading')}</Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{subtitle}</Text>
      </View>

      <Tabs defaultValue="inbox" className="flex-1">
        <TabsList>
          <TabsTrigger value="inbox" badge={!isLoading && <TabCountBadge count={unprocessed.length} />}>
            {t('page.tabs.inbox')}
          </TabsTrigger>
          <TabsTrigger value="archived" badge={!isLoading && <TabCountBadge count={archived.length} />}>
            {t('page.tabs.archived')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="flex-1 gap-4">
          <InboxCapture />

          <Animated.FlatList
            data={isLoading ? [] : unprocessed}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            itemLayoutAnimation={LinearTransition}
            renderItem={({ item }) => (
              <BucketRow
                bucket={item}
                onProcess={handleOpenProcess}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            )}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            ListEmptyComponent={
              isLoading ? null : (
                <EmptyState
                  icon={Inbox}
                  title={t('list.emptyTitle')}
                  description={t('list.emptyDescription')}
                  testID="inbox-empty"
                />
              )
            }
          />
        </TabsContent>

        <TabsContent value="archived" className="flex-1">
          <ArchivedList items={archived} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <BucketProcessSheet
        ref={processSheetRef}
        bucket={processingBucket}
        onProcessed={() => processSheetRef.current?.dismiss()}
      />
      <BucketEditSheet ref={editSheetRef} bucket={editingBucket} />
      <BucketDeleteAlert ref={deleteAlertRef} bucket={deletingBucket} />
    </View>
  );
}
