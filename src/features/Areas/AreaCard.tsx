import { useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type AreaWithProjects } from '@nicoflow/shared/api';
import { ChevronDown, ChevronRight, GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
import { useDeleteAreaMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';
import { splitTransName } from '@/lib/utils/transName';

import { ProjectRow } from './ProjectRow';

interface AreaCardProps {
  area: AreaWithProjects;
  onPressProject: (projectId: string) => void;
  onEdit: (area: AreaWithProjects) => void;
  dragHandleProps?: { onLongPress?: () => void; disabled?: boolean };
  isDragging?: boolean;
}

// Mirrors web's AreaCard.tsx: icon swatch tinted by area.color, name,
// project-count badge, 3-dot actions menu (Edit Area/Delete Area), expandable
// body listing ProjectRows or the "No projects yet. Add one below." fallback.
// Delete cascades (deletes nested projects too) — matches web's actual wired
// behavior, not the unused "kept and moved out" copy that exists elsewhere in
// web's i18n bundle. Web's dashed "Add project" affordance lands with the
// Projects CRUD story (NIC-1978), once there's a ProjectDialog to open.
export function AreaCard({ area, onPressProject, onEdit, dragHandleProps, isDragging }: AreaCardProps) {
  const { t } = useTranslation(['area', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [expanded, setExpanded] = useState(true);
  const [deleteArea, { isLoading: isDeleting }] = useDeleteAreaMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const Icon = iconComponentFor(area.icon);
  const projects = area.projects ?? [];
  const chevronColor = isDark ? '#94a3b8' : '#64748b';

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
      className={`relative rounded-lg border border-border dark:border-border-dark bg-card dark:bg-card-dark ${isDragging ? 'opacity-70' : ''}`}
      testID={`area-card-${area.id}`}
    >
      <Pressable
        onPress={() => setExpanded(v => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-3 p-3 pr-11"
      >
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
          {t(projects.length === 1 ? 'area:board.projectCount_one' : 'area:board.projectCount_other', {
            count: projects.length,
          })}
        </Badge>

        {expanded ? <ChevronDown size={18} color={chevronColor} /> : <ChevronRight size={18} color={chevronColor} />}
      </Pressable>

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

      {expanded && (
        <View className="gap-0.5 px-2 pb-3">
          {projects.length === 0 ? (
            <Text className="px-2 py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {t('area:card.noProjects')}
            </Text>
          ) : (
            projects.map(project => (
              <ProjectRow key={project.id} project={project} onPress={() => onPressProject(project.id)} />
            ))
          )}
        </View>
      )}

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
