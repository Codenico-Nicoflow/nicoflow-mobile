import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { router } from 'expo-router';

import { type AreaWithProjects } from '@nicoflow/shared/api';
import { FREE_PLAN_AREA_LIMIT } from '@nicoflow/shared/types';
import { Layers, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAreasWithProjectsQuery, useReorderAreasMutation } from '@/lib/store';

import { AreaCard } from './AreaCard';
import { AreaDialog, type AreaDialogRef } from './AreaDialog';

function AreasListSkeleton() {
  return (
    <View className="gap-3 px-4 pt-2" testID="areas-loading">
      <Skeleton className="h-6 w-32" />
      {[0, 1, 2].map(i => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </View>
  );
}

// Mirrors web's AreasBoard.tsx: header (title, counts, "New Area" action) +
// list of AreaCards (accordion, nested projects), empty state, skeleton
// loading. Drag-to-reorder persists displayOrder server-side via
// reorderAreas. "New Project" header action and per-area "Add project" land
// with the Projects CRUD story (NIC-1978).
export function AreasList() {
  const { t } = useTranslation(['area']);
  const { data: areas, isLoading, isFetching } = useGetAreasWithProjectsQuery();
  const [reorderAreas] = useReorderAreasMutation();
  const [localOrder, setLocalOrder] = useState<AreaWithProjects[]>([]);
  const dialogRef = useRef<AreaDialogRef>(null);

  // Server data is the source of truth; local state only exists so
  // DraggableFlatList has something to animate against mid-drag without
  // waiting on a round trip for every frame.
  useEffect(() => {
    if (areas && !isFetching) setLocalOrder(areas);
  }, [areas, isFetching]);

  if (isLoading) return <AreasListSkeleton />;

  const atAreaLimit = (areas?.length ?? 0) >= FREE_PLAN_AREA_LIMIT;

  if (!areas || areas.length === 0) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EmptyState
          icon={Layers}
          title={t('area:board.empty')}
          description={t('area:board.emptyDescription')}
          action={<Button label={t('area:board.newArea')} onPress={() => dialogRef.current?.present()} />}
          testID="areas-empty-state"
        />
        <AreaDialog ref={dialogRef} onSaved={() => {}} />
      </GestureHandlerRootView>
    );
  }

  const projectTotal = localOrder.reduce((sum, a) => sum + (a.projects?.length ?? 0), 0);

  const onDragEnd = ({ data }: { data: AreaWithProjects[] }) => {
    setLocalOrder(data);
    void reorderAreas({
      items: data.map((area, index) => ({ id: area.id, displayOrder: index })),
    });
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<AreaWithProjects>) => (
    <ScaleDecorator>
      <View className="px-4 pb-3">
        <AreaCard
          area={item}
          onPressProject={projectId => router.push(`/project/${projectId}`)}
          onEdit={editArea => dialogRef.current?.present(editArea)}
          dragHandleProps={{ onLongPress: drag, disabled: isActive }}
          isDragging={isActive}
        />
      </View>
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-row items-start justify-between px-4 pt-2 pb-3">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {t('area:board.yourAreas')}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t(localOrder.length === 1 ? 'area:board.areaCount_one' : 'area:board.areaCount_other', {
              count: localOrder.length,
            })}
            {' · '}
            {t(projectTotal === 1 ? 'area:board.projectCount_one' : 'area:board.projectCount_other', {
              count: projectTotal,
            })}
          </Text>
        </View>
        <Button
          size="sm"
          disabled={atAreaLimit}
          accessibilityLabel={atAreaLimit ? t('area:board.planLimitTooltip') : t('area:board.newArea')}
          onPress={() => dialogRef.current?.present()}
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-sm font-medium text-primary-foreground">{t('area:board.newArea')}</Text>
        </Button>
      </View>
      <DraggableFlatList
        data={localOrder}
        onDragEnd={onDragEnd}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <AreaDialog ref={dialogRef} onSaved={() => {}} />
    </GestureHandlerRootView>
  );
}
