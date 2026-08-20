import type { IBucket } from '@nicoflow/shared/types';
import { Inbox } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { type SheetRef } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeleteBucketMutation, useGetBucketsQuery } from '@/lib/store';

import { ArchivedList } from './ArchivedList';
import { BucketProcessSheet } from './BucketProcessSheet';
import { BucketRow } from './BucketRow';
import { InboxCapture } from './InboxCapture';

export function InboxView() {
  const { t } = useTranslation('bucket');
  const { data, isLoading, isFetching, refetch } = useGetBucketsQuery();
  const [deleteBucket] = useDeleteBucketMutation();
  const [processingBucket, setProcessingBucket] = useState<IBucket | null>(null);
  const processSheetRef = useRef<SheetRef>(null);

  const items = data?.items ?? [];
  const unprocessed = items.filter(b => !b.processedAt);
  const archived = items.filter(b => !!b.processedAt);

  const handleDelete = (bucket: IBucket) => {
    void deleteBucket(bucket.id);
  };

  const handleOpenProcess = (bucket: IBucket) => {
    setProcessingBucket(bucket);
    processSheetRef.current?.present();
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
          <TabsTrigger value="inbox">
            {isLoading ? t('page.tabs.inbox') : `${t('page.tabs.inbox')} ${unprocessed.length}`}
          </TabsTrigger>
          <TabsTrigger value="archived">
            {isLoading ? t('page.tabs.archived') : `${t('page.tabs.archived')} ${archived.length}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="flex-1 gap-4">
          <InboxCapture />

          <FlatList
            data={isLoading ? [] : unprocessed}
            keyExtractor={item => item.id}
            contentContainerClassName="gap-2 pb-4"
            renderItem={({ item }) => <BucketRow bucket={item} onPress={handleOpenProcess} onDelete={handleDelete} />}
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
    </View>
  );
}
