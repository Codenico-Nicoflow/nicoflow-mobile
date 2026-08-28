import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type IProject } from '@nicoflow/shared/types';
import { Calendar, Clock, Pencil, Star, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { iconComponentFor } from '@/lib/constants/icons';
import { projectStatusBadgeStyle } from '@/lib/constants/projectStatus';

interface ProjectHeaderProps {
  project: IProject;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
const formatFull = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Mirrors web's ProjectHeader.tsx (nicoflow-frontend/src/features/Project/components/ProjectHeader):
// icon, name, favorite star, status badge (green/blue/gray, same source as
// ProjectRow's), "Due {{date}}" (short + "(Overdue)"), Clock icon +
// full "Created MMM d, yyyy", and Edit/Pencil + Delete/Trash2 buttons.
export function ProjectHeader({ project, onToggleFavorite, onEdit, onDelete }: ProjectHeaderProps) {
  const { t } = useTranslation(['project']);
  const isDark = useColorScheme() === 'dark';
  const Icon = iconComponentFor(project.folderIcon);
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const isOverdue = !!project.dueDate && new Date(project.dueDate) < new Date() && project.status === 'active';
  const statusBadge = projectStatusBadgeStyle(project.status, isDark);

  return (
    <View className="gap-3 px-4 pb-3">
      <View className="flex-row items-center gap-3">
        <View className="size-11 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
          <Icon size={22} color={isDark ? '#6366f1' : '#4f46e5'} />
        </View>
        <Text
          className="flex-1 text-xl font-bold text-foreground dark:text-foreground-dark"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {project.name}
        </Text>
        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityState={{ selected: !!project.isFavorite }}
          accessibilityLabel={project.isFavorite ? t('project:row.unfavorite') : t('project:row.favorite')}
          hitSlop={8}
        >
          <Star
            size={22}
            color={project.isFavorite ? '#eab308' : mutedColor}
            fill={project.isFavorite ? '#eab308' : 'none'}
          />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <Badge style={{ backgroundColor: statusBadge.backgroundColor }} textStyle={{ color: statusBadge.color }}>
          {t(`project:status.${project.status}`)}
        </Badge>
        {!!project.dueDate && (
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color={isOverdue ? (isDark ? '#f87171' : '#dc2626') : mutedColor} />
            <Text
              className={
                isOverdue
                  ? 'text-xs text-destructive dark:text-destructive-dark'
                  : 'text-xs text-muted-foreground dark:text-muted-foreground-dark'
              }
            >
              {t('project:header.due', { date: formatShort(project.dueDate) })}
              {isOverdue ? ` ${t('project:header.overdue')}` : ''}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={mutedColor} />
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {t('project:header.created', { date: formatFull(project.createdAt) })}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          testID="project-header-edit"
          className="flex-row items-center gap-1.5 rounded-md border border-border dark:border-border-dark px-3 py-1.5"
        >
          <Pencil size={14} color={isDark ? '#e2e8f0' : '#1e293b'} />
          <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
            {t('project:header.edit')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          testID="project-header-delete"
          className="flex-row items-center gap-1.5 rounded-md px-3 py-1.5"
        >
          <Trash2 size={14} color={isDark ? '#f87171' : '#ef4444'} />
          <Text className="text-sm font-medium text-destructive dark:text-destructive-dark">
            {t('project:header.delete')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
