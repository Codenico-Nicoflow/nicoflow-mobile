import { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { type AreaWithProjects } from '@nicoflow/shared/api';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { iconComponentFor } from '@/lib/constants/icons';

import { ProjectRow } from './ProjectRow';

interface AreaCardProps {
  area: AreaWithProjects;
  onPressProject: (projectId: string) => void;
  dragHandleProps?: { onLongPress?: () => void; disabled?: boolean };
  isDragging?: boolean;
}

// Mirrors web's AreaCard.tsx: icon swatch tinted by area.color, name,
// project-count badge, expandable body listing ProjectRows or the
// "No projects yet" fallback. The 3-dot actions menu (Edit/Delete Area) and
// "Add project" affordance land with the Areas CRUD story (NIC-1976) — this
// story is the read-only list/accordion/navigate/reorder surface.
export function AreaCard({ area, onPressProject, dragHandleProps, isDragging }: AreaCardProps) {
  const { t } = useTranslation(['area']);
  const isDark = useColorScheme() === 'dark';
  const [expanded, setExpanded] = useState(true);
  const Icon = iconComponentFor(area.icon);
  const projects = area.projects ?? [];
  const chevronColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View
      className={`rounded-lg border border-border dark:border-border-dark bg-card dark:bg-card-dark ${isDragging ? 'opacity-70' : ''}`}
      testID={`area-card-${area.id}`}
    >
      <Pressable
        onPress={() => setExpanded(v => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-3 p-3"
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
    </View>
  );
}
