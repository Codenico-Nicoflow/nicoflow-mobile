import { FlatList, View } from 'react-native';

import { AlertTriangle, MessageSquarePlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAISessionsQuery } from '@/lib/store';

import { AISessionRow } from './AISessionRow';

interface AISessionListProps {
  activeId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDeleted?: (id: string) => void;
  isCreating?: boolean;
}

// The conversations list — sessions come back updatedAt DESC from the backend,
// so no client-side sort. Mirrors web's AISessionList (rail on desktop, this
// full screen on mobile).
export function AISessionList({ activeId, onSelect, onCreate, onDeleted, isCreating = false }: AISessionListProps) {
  const { t } = useTranslation('ai');
  const { data: sessions, isLoading, isError, refetch } = useGetAISessionsQuery();

  if (isLoading) {
    return (
      <View className="gap-2 p-3" testID="ai-session-list-loading">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t('sessions.loadErrorTitle')}
        description={t('sessions.loadErrorDescription')}
        action={<Button variant="outline" size="sm" label={t('sessions.retry')} onPress={() => void refetch()} />}
        testID="ai-session-list-error"
      />
    );
  }

  return (
    <View className="flex-1" testID="ai-session-list">
      <View className="px-3 pb-2">
        <Button
          label={t('sessions.new')}
          onPress={onCreate}
          loading={isCreating}
          testID="ai-new-session"
          accessibilityLabel={t('sessions.new')}
        />
      </View>

      <FlatList
        data={sessions ?? []}
        keyExtractor={session => session.id}
        contentContainerClassName="gap-2 px-3 pb-6"
        ListEmptyComponent={
          <EmptyState
            icon={MessageSquarePlus}
            title={t('sessions.emptyTitle')}
            description={t('sessions.emptyDescription')}
            testID="ai-session-list-empty"
          />
        }
        renderItem={({ item }) => (
          <AISessionRow session={item} isActive={item.id === activeId} onOpen={onSelect} onDeleted={onDeleted} />
        )}
      />
    </View>
  );
}
