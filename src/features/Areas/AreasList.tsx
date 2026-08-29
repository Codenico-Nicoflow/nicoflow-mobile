import { useEffect, useRef, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';

import { router } from 'expo-router';

import { type AreaWithProjects } from '@nicoflow/shared/api';
import { FREE_PLAN_AREA_LIMIT, FREE_PLAN_PROJECT_LIMIT, type IProject } from '@nicoflow/shared/types';
import { Layers, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAreasWithProjectsQuery, useReorderAreasMutation } from '@/lib/store';

import { ProjectDialog, type ProjectDialogRef } from '../Project/ProjectDialog';

import { AreaCard } from './AreaCard';
import { AreaDialog, type AreaDialogRef } from './AreaDialog';
import { MoveToAreaSheet, type MoveToAreaSheetRef } from './MoveToAreaSheet';

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

// Mirrors web's AreasBoard.tsx: header (title, counts, "New Area"/"New
// Project" actions) + list of AreaCards (accordion, nested projects), empty
// state, skeleton loading. Drag-to-reorder persists displayOrder server-side
// via reorderAreas.
export function AreasList() {
  const { t } = useTranslation(['area']);
  const isDark = useColorScheme() === 'dark';
  const { data: areas, isLoading, isFetching } = useGetAreasWithProjectsQuery();
  const [reorderAreas] = useReorderAreasMutation();
  const [localOrder, setLocalOrder] = useState<AreaWithProjects[]>([]);
  const areaDialogRef = useRef<AreaDialogRef>(null);
  const projectDialogRef = useRef<ProjectDialogRef>(null);
  const moveToAreaSheetRef = useRef<MoveToAreaSheetRef>(null);

  // Server data is the source of truth; local state only exists so
  // DraggableFlatList has something to animate against mid-drag without
  // waiting on a round trip for every frame.
  useEffect(() => {
    if (areas && !isFetching) setLocalOrder(areas);
  }, [areas, isFetching]);

  if (isLoading) return <AreasListSkeleton />;

  const allProjects: IProject[] = localOrder.flatMap(a => a.projects ?? []);
  const favoriteCount = allProjects.filter(p => p.isFavorite).length;
  const atAreaLimit = (areas?.length ?? 0) >= FREE_PLAN_AREA_LIMIT;
  const atProjectLimit = allProjects.length >= FREE_PLAN_PROJECT_LIMIT;

  if (!areas || areas.length === 0) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EmptyState
          icon={Layers}
          title={t('area:board.empty')}
          description={t('area:board.emptyDescription')}
          action={<Button label={t('area:board.newArea')} onPress={() => areaDialogRef.current?.present()} />}
          testID="areas-empty-state"
        />
        <AreaDialog ref={areaDialogRef} onSaved={() => {}} />
      </GestureHandlerRootView>
    );
  }

  const projectTotal = allProjects.length;

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
          onEdit={editArea => areaDialogRef.current?.present(editArea)}
          onEditProject={editProject => projectDialogRef.current?.present(editProject)}
          onAddProject={areaId => projectDialogRef.current?.present(undefined, areaId)}
          onMoveProjectToArea={project => moveToAreaSheetRef.current?.present(project)}
          dragHandleProps={{ onLongPress: drag, disabled: isActive }}
          isDragging={isActive}
        />
      </View>
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-row items-start justify-between gap-2 px-4 pt-2 pb-3">
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
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={atProjectLimit}
            accessibilityLabel={atProjectLimit ? t('area:board.planLimitTooltip') : t('area:board.newProject')}
            onPress={() => projectDialogRef.current?.present()}
          >
            <Plus size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />
            <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
              {t('area:board.newProject')}
            </Text>
          </Button>
          <Button
            size="sm"
            disabled={atAreaLimit}
            accessibilityLabel={atAreaLimit ? t('area:board.planLimitTooltip') : t('area:board.newArea')}
            onPress={() => areaDialogRef.current?.present()}
          >
            <Plus size={16} color="#ffffff" />
            <Text className="text-sm font-medium text-primary-foreground">{t('area:board.newArea')}</Text>
          </Button>
        </View>
      </View>
      <NestableScrollContainer contentContainerStyle={{ paddingBottom: 24 }}>
        <NestableDraggableFlatList
          data={localOrder}
          onDragEnd={onDragEnd}
          keyExtractor={item => item.id}
          renderItem={renderItem}
        />
      </NestableScrollContainer>
      <AreaDialog ref={areaDialogRef} onSaved={() => {}} />
      <ProjectDialog
        ref={projectDialogRef}
        onSaved={() => {}}
        onCreateAreaRequested={() => areaDialogRef.current?.present()}
        favoriteCount={favoriteCount}
      />
      <MoveToAreaSheet ref={moveToAreaSheetRef} />
    </GestureHandlerRootView>
  );
}
