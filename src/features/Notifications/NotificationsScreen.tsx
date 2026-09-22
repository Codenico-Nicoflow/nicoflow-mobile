import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import type { INotification } from '@nicoflow/shared/types';
import { BellOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { type AlertDialogRef } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useGetNotificationsPagedInfiniteQuery, useMarkAllReadMutation, useMarkReadMutation } from '@/lib/store';

import { NotificationDeleteAlert } from './NotificationDeleteAlert';
import { NotificationRow } from './NotificationRow';
import { useUnreadCount } from './useUnreadCount';

// First page size. The list is unbounded server-side, so an old account must
// never pull its whole history in one request.
const PAGE_SIZE = 30;

function NotificationsSkeleton() {
  return (
    <View className="gap-2 px-4" testID="notifications-loading">
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </View>
  );
}

// The in-app notification list — the other half of Settings' preferences card.
// Preferences decide whether you're told; this is the record of what you were
// told, which is the only place a missed or dismissed push can still be read.
//
// Shows read and unread alike (read rows dim), unlike web's popover, which
// filters to unread only. A full screen has the room, and seeing what you
// already missed is the reason this screen exists.
export function NotificationsScreen() {
  const { t } = useTranslation(['notification', 'common']);
  const [deleting, setDeleting] = useState<INotification | null>(null);
  const deleteAlertRef = useRef<AlertDialogRef>(null);

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useGetNotificationsPagedInfiniteQuery({ limit: PAGE_SIZE });
  const [markRead] = useMarkReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation();
  const unreadCount = useUnreadCount();

  const items = useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data?.pages]);

  const handleDelete = (notification: INotification) => {
    setDeleting(notification);
    deleteAlertRef.current?.present();
  };

  const handleMarkAll = () => {
    markAllRead()
      .unwrap()
      .then(() => toast.success(t('notification:toast.markedAllRead')))
      .catch(() => undefined);
  };

  // Pages accumulate in one cache entry, and a mutation's tag invalidation
  // refetches every page held — so a delete can't leave a stale row behind a
  // fresh first page.
  const handleEndReached = () => {
    if (isFetchingNextPage || !hasNextPage) return;
    void fetchNextPage();
  };

  return (
    <View className="flex-1">
      <ScreenHeader
        title={t('notification:panel.title')}
        subtitle={unreadCount > 0 ? t('notification:panel.unreadCount', { count: unreadCount }) : undefined}
        actions={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAll}
              disabled={isMarkingAll}
              accessibilityRole="button"
              accessibilityLabel={t('notification:panel.markAllRead')}
              hitSlop={8}
              className="rounded-md px-2 py-1"
              testID="mark-all-read-button"
            >
              <Text className="text-sm font-medium text-primary dark:text-primary-dark">
                {t('notification:panel.markAllRead')}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <NotificationsSkeleton />
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={item => item.id}
          contentContainerClassName="gap-2 px-4 pb-6"
          onRefresh={refetch}
          // Paging forward is also a fetch, but it isn't a pull-to-refresh —
          // without the guard the spinner fires every time the list scrolls on.
          refreshing={isFetching && !isLoading && !isFetchingNextPage}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <NotificationRow notification={item} onMarkRead={id => markRead(id)} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <EmptyState icon={BellOff} title={t('notification:panel.empty')} testID="notifications-empty" />
          }
        />
      )}

      <NotificationDeleteAlert ref={deleteAlertRef} notification={deleting} />
    </View>
  );
}
