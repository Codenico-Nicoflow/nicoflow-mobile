import { useRef } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type IProject } from '@nicoflow/shared/types';
import {
  Calendar,
  ExternalLink,
  FolderInput,
  GripVertical,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react-native';
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
import { projectStatusBadgeStyle } from '@/lib/constants/projectStatus';
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';
import { splitTransName } from '@/lib/utils/transName';

interface ProjectRowProps {
  project: IProject;
  onPress: () => void;
  onEdit: (project: IProject) => void;
  onMoveToArea: (project: IProject) => void;
  dragHandleProps?: { onLongPress?: () => void; disabled?: boolean };
  isDragging?: boolean;
}

// Mirrors web's ProjectRow.tsx: folder icon, name, favorite star (if set),
// due-date chip (red if overdue + active), status badge, 3-dot actions menu
// (Open / Favorite toggle / Edit / Move to Area / Delete). Delete matches
// web's exact copy (bold name via splitTransName — same pattern as
// AreaCard's delete dialog). "Move to Area" has no web equivalent — web
// does this by dragging the card across area boundaries; mobile's drag lib
// only reorders within one list, so cross-area move is this menu action.
export function ProjectRow({ project, onPress, onEdit, onMoveToArea, dragHandleProps, isDragging }: ProjectRowProps) {
  const { t } = useTranslation(['project', 'common']);
  const isDark = useColorScheme() === 'dark';
  const Icon = iconComponentFor(project.folderIcon);
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const menuRef = useRef<DropdownMenuRef>(null);
  const alertRef = useRef<AlertDialogRef>(null);

  const isOverdue = !!project.dueDate && new Date(project.dueDate) < new Date() && project.status === 'active';
  const statusBadge = projectStatusBadgeStyle(project.status, isDark);

  const onConfirmDelete = async () => {
    try {
      await deleteProject(project.id).unwrap();
      showSuccessToast(ToastMessages.PROJECT_DELETED, toast);
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
    <View className={`flex-row items-center rounded-md ${isDragging ? 'bg-primary/25 dark:bg-primary-dark/25' : ''}`}>
      <Pressable
        onLongPress={dragHandleProps?.onLongPress}
        disabled={dragHandleProps?.disabled}
        accessibilityLabel={t('project:row.dragHandle')}
        hitSlop={8}
        className="px-1"
      >
        <GripVertical size={14} color={mutedColor} />
      </Pressable>
      <Pressable
        className="flex-1 flex-row items-center gap-2.5 rounded-md px-2 py-2.5 active:bg-accent dark:active:bg-accent-dark"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={project.name}
      >
        <Icon size={16} color={isDark ? '#6366f1' : '#4f46e5'} />
        <Text
          className="flex-1 text-sm text-foreground dark:text-foreground-dark"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {project.name}
        </Text>
        {!!project.isFavorite && <Star size={14} color="#eab308" fill="#eab308" />}
        {!!project.dueDate && (
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color={isOverdue ? '#ef4444' : mutedColor} />
            <Text
              className={
                isOverdue
                  ? 'text-xs text-destructive dark:text-destructive-dark'
                  : 'text-xs text-muted-foreground dark:text-muted-foreground-dark'
              }
            >
              {new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
            </Text>
          </View>
        )}
        <Badge style={{ backgroundColor: statusBadge.backgroundColor }} textStyle={{ color: statusBadge.color }}>
          {t(`project:status.${project.status}`)}
        </Badge>
      </Pressable>

      <DropdownMenu
        ref={menuRef}
        trigger={
          <View className="size-8 items-center justify-center" accessibilityLabel={t('project:row.actionsMenu')}>
            <MoreVertical size={16} color={mutedColor} />
          </View>
        }
      >
        <DropdownMenuItem
          icon={<ExternalLink size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
          onPress={() => {
            menuRef.current?.dismiss();
            onPress();
          }}
        >
          {t('project:row.open')}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Star size={16} color="#eab308" fill={project.isFavorite ? '#eab308' : 'none'} />}
          onPress={() => {
            menuRef.current?.dismiss();
            void updateProject({ id: project.id, isFavorite: !project.isFavorite });
          }}
        >
          {project.isFavorite ? t('project:row.unfavorite') : t('project:row.favorite')}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Pencil size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
          onPress={() => {
            menuRef.current?.dismiss();
            onEdit(project);
          }}
        >
          {t('project:row.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<FolderInput size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />}
          onPress={() => {
            menuRef.current?.dismiss();
            onMoveToArea(project);
          }}
        >
          Move to Area
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Trash2 size={16} color={isDark ? '#f87171' : '#ef4444'} />}
          variant="destructive"
          onPress={() => {
            menuRef.current?.dismiss();
            alertRef.current?.present();
          }}
        >
          {t('project:row.delete')}
        </DropdownMenuItem>
      </DropdownMenu>

      <AlertDialog ref={alertRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('project:delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {(() => {
              const { before, name, after } = splitTransName(
                t('project:delete.confirmDescription', { name: project.name })
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
            {isDeleting ? `${t('project:delete.confirmLabel')}...` : t('project:delete.confirmLabel')}
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  );
}
