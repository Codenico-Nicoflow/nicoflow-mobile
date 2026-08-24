import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type IProject } from '@nicoflow/shared/types';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { iconComponentFor } from '@/lib/constants/icons';

const STATUS_BADGE_VARIANT = {
  active: 'default',
  completed: 'secondary',
  archived: 'outline',
} as const;

interface ProjectHeaderProps {
  project: IProject;
  onToggleFavorite: () => void;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

// Mirrors web's ProjectHeader.tsx: icon, name, favorite toggle star, status
// badge, "Due {{date}}" line (+ "(Overdue)" suffix when applicable),
// "Created {{date}}" line. Edit/Delete actions live on ProjectRow's actions
// menu (NIC-1978), not duplicated here.
export function ProjectHeader({ project, onToggleFavorite }: ProjectHeaderProps) {
  const { t } = useTranslation(['project']);
  const isDark = useColorScheme() === 'dark';
  const Icon = iconComponentFor(project.folderIcon);
  const isOverdue = !!project.dueDate && new Date(project.dueDate) < new Date() && project.status === 'active';

  return (
    <View className="gap-2 px-4 pb-3">
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
            color={project.isFavorite ? '#eab308' : isDark ? '#94a3b8' : '#64748b'}
            fill={project.isFavorite ? '#eab308' : 'none'}
          />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[project.status]}>{t(`project:status.${project.status}`)}</Badge>
        {!!project.dueDate && (
          <Text
            className={
              isOverdue
                ? 'text-xs text-destructive dark:text-destructive-dark'
                : 'text-xs text-muted-foreground dark:text-muted-foreground-dark'
            }
          >
            {t('project:header.due', { date: formatDate(project.dueDate) })}
            {isOverdue ? ` ${t('project:header.overdue')}` : ''}
          </Text>
        )}
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
          {t('project:header.created', { date: formatDate(project.createdAt) })}
        </Text>
      </View>
    </View>
  );
}
