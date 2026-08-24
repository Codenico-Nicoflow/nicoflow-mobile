import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type IProject } from '@nicoflow/shared/types';
import { Calendar, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { iconComponentFor } from '@/lib/constants/icons';
import { cn } from '@/lib/utils/cn';

const STATUS_BADGE_VARIANT = {
  active: 'default',
  completed: 'secondary',
  archived: 'outline',
} as const;

interface ProjectRowProps {
  project: IProject;
  onPress: () => void;
}

// Mirrors web's ProjectRow.tsx (nicoflow-frontend/src/features/Project/components/ProjectRow):
// folder icon, name, favorite star (if set), due-date chip (red if overdue +
// active), status badge — read-only row, tap navigates. Actions menu
// (Open/Favorite/Edit/Delete) and drag-reorder land with the Projects CRUD
// story; this row is the shared visual shell both stories build on.
export function ProjectRow({ project, onPress }: ProjectRowProps) {
  const { t } = useTranslation(['project']);
  const isDark = useColorScheme() === 'dark';
  const Icon = iconComponentFor(project.folderIcon);
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  const isOverdue = !!project.dueDate && new Date(project.dueDate) < new Date() && project.status === 'active';

  return (
    <Pressable
      className="flex-row items-center gap-2.5 rounded-md px-2 py-2.5 active:bg-accent dark:active:bg-accent-dark"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={project.name}
    >
      <Icon size={16} color={mutedColor} />
      <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark" numberOfLines={1} ellipsizeMode="tail">
        {project.name}
      </Text>
      {!!project.isFavorite && <Star size={14} color="#eab308" fill="#eab308" />}
      {!!project.dueDate && (
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color={isOverdue ? '#ef4444' : mutedColor} />
          <Text
            className={cn(
              'text-xs',
              isOverdue
                ? 'text-destructive dark:text-destructive-dark'
                : 'text-muted-foreground dark:text-muted-foreground-dark'
            )}
          >
            {new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}
          </Text>
        </View>
      )}
      <Badge variant={STATUS_BADGE_VARIANT[project.status]}>{t(`project:status.${project.status}`)}</Badge>
    </Pressable>
  );
}
