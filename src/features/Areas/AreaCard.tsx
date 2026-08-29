import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type AreaWithProjects } from '@nicoflow/shared/api';
import { type IProject } from '@nicoflow/shared/types';
import { GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { NestableDraggableFlatList, type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogRef,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem, type DropdownMenuRef } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { iconComponentFor } from '@/lib/constants/icons';
import { useDeleteAreaMutation, useReorderProjectsMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';
import { splitTransName } from '@/lib/utils/transName';

import { ProjectRow } from './ProjectRow';

interface AreaCardProps {
  area: AreaWithProjects;
  onPressProject: (projectId: string) => void;
  onEdit: (area: AreaWithProjects) => void;
  onEditProject: (project: IProject) => void;
  onAddProject: (areaId: string) => void;
  onMoveProjectToArea: (project: IProject) => void;
  dragHandleProps?: { onLongPress?: () => void; disabled?: boolean };
  isDragging?: boolean;
}

// Mirrors web's AreaCard.tsx: icon swatch tinted by area.color, name,
// project-count badge, 3-dot actions menu (Edit Area/Delete Area). Body is
// ALWAYS visible (web has no collapse/accordion) listing ProjectRows or the
// "No projects yet. Add one below." fallback, plus a dashed "Add project"
// affordance. Delete cascades (deletes nested projects too) — matches web's
// actual wired behavior, not the unused "kept and moved out" copy that
// exists elsewhere in web's i18n bundle.
export function AreaCard({
  area,
  onPressProject,
  onEdit,
  onEditProject,
  onAddProject,
  onMoveProjectToArea,
  dragHandleProps,
  isDragging,
}: AreaCardProps) {
  const { t } = useTranslation(['area', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [deleteArea, { isLoading: isDeleting }] = useDeleteAreaMutation();
  const [reorderProjects] = useReorderProjectsMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const Icon = iconComponentFor(area.icon);
  const chevronColor = isDark ? '#94a3b8' : '#64748b';

  // Local state so NestableDraggableFlatList has something to animate
  // against mid-drag, same rationale as AreasList's own localOrder — server
  // data (area.projects) is the source of truth once a drag settles.
  const [localProjects, setLocalProjects] = useState<IProject[]>(area.projects ?? []);
  useEffect(() => {
    setLocalProjects(area.projects ?? []);
  }, [area.projects]);

  const onProjectsDragEnd = ({ data }: { data: IProject[] }) => {
    setLocalProjects(data);
    void reorderProjects({
      items: data.map((project, index) => ({ id: project.id, displayOrder: index })),
    });
  };

  const onConfirmDelete = async () => {
    try {
      await deleteArea(area.id).unwrap();
      showSuccessToast(ToastMessages.AREA_DELETED, toast);
    } catch {
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onConfirmDelete();
        },
      });
      return;
    }
    alertRef.current?.dismiss();
  };

  return (
    <View
      className={`relative rounded-lg border border-border dark:border-border-dark ${
        isDragging ? 'bg-primary/25 dark:bg-primary-dark/25' : 'bg-card dark:bg-card-dark'
      }`}
      testID={`area-card-${area.id}`}
    >
      <View className="flex-row items-center gap-3 p-3 pr-11">
        <Pressable
          onLongPress={dragHandleProps?.onLongPress}
          disabled={dragHandleProps?.disabled}
          accessibilityLabel={t('area:card.dragHandle')}
          hitSlop={8}
        >
          <GripVertical size={16} color={chevronColor} />
        </Pressable>

        <View className="size-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${area.color}20` }}>
          <Icon size={18} color={area.color} />
        </View>

        <Text
          className="flex-1 text-base font-medium text-foreground dark:text-foreground-dark"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {area.name}
        </Text>

        <Badge variant="secondary">
          {t(localProjects.length === 1 ? 'area:board.projectCount_one' : 'area:board.projectCount_other', {
            count: localProjects.length,
          })}
        </Badge>
      </View>

      <View className="absolute right-2 top-2">
        <DropdownMenu
          ref={menuRef}
          trigger={
            <View className="size-8 items-center justify-center" accessibilityLabel={t('area:card.actionsMenu')}>
              <MoreVertical size={18} color={chevronColor} />
            </View>
          }
        >
          <DropdownMenuItem
            icon={<Pencil size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
            onPress={() => {
              menuRef.current?.dismiss();
              onEdit(area);
            }}
          >
            {t('area:contextMenu.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<Trash2 size={16} color={isDark ? '#f87171' : '#ef4444'} />}
            variant="destructive"
            onPress={() => {
              menuRef.current?.dismiss();
              alertRef.current?.present();
            }}
          >
            {t('area:contextMenu.delete')}
          </DropdownMenuItem>
        </DropdownMenu>
      </View>

      <View className="gap-0.5 px-2 pb-3">
        {localProjects.length === 0 ? (
          <Text className="px-2 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('area:card.noProjects')}
          </Text>
        ) : (
          <NestableDraggableFlatList
            data={localProjects}
            onDragEnd={onProjectsDragEnd}
            keyExtractor={project => project.id}
            scrollEnabled={false}
            renderItem={({ item: project, drag, isActive }: RenderItemParams<IProject>) => (
              <ScaleDecorator>
                <ProjectRow
                  project={project}
                  onPress={() => onPressProject(project.id)}
                  onEdit={onEditProject}
                  onMoveToArea={onMoveProjectToArea}
                  dragHandleProps={{ onLongPress: drag, disabled: isActive }}
                  isDragging={isActive}
                />
              </ScaleDecorator>
            )}
          />
        )}
        <Pressable
          onPress={() => onAddProject(area.id)}
          accessibilityRole="button"
          className="mt-1 flex-row items-center justify-center gap-1.5 rounded-md border border-dashed border-border dark:border-border-dark px-2 py-2"
        >
          <Plus size={14} color={chevronColor} />
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {t('area:card.addProject')}
          </Text>
        </Pressable>
      </View>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('area:card.confirmDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {(() => {
              const { before, name, after } = splitTransName(
                t('area:card.confirmDeleteDescription', { name: area.name })
              );
              return (
                <>
                  {before}
                  <Text className="font-semibold text-foreground dark:text-foreground-dark">{name}</Text>
                  {after}
                </>
              );
            })()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => void onConfirmDelete()}>
            {isDeleting ? `${t('area:card.confirmDeleteButton')}...` : t('area:card.confirmDeleteButton')}
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  );
}
