import { useState } from 'react';
import { Text, View } from 'react-native';

import { router } from 'expo-router';

import { FolderX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpandableText } from '@/components/ui/expandable-text';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetProjectQuery, useUpdateProjectMutation } from '@/lib/store';

import { TasksSection } from './tasks/TasksSection';
import { ProjectHeader } from './ProjectHeader';

type ProjectTab = 'tasks' | 'notes';

function ProjectViewSkeleton() {
  return (
    <View className="gap-3 px-4 pt-3" testID="project-loading">
      <Skeleton className="h-11 w-11 rounded-lg" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </View>
  );
}

interface ProjectViewProps {
  projectId: string;
}

// Mirrors web's ProjectView.tsx: header, optional description, Tasks/Notes
// tab switcher. Web keeps both tab panels mounted (forceMount/hidden) so
// switching never refetches — TabsContent from components/ui/tabs.tsx
// unmounts on switch instead (fine for its other, simpler consumers), so
// this screen keeps its own two panels always mounted and toggles visibility
// with `hidden` rather than delegating to TabsContent. Tab *content* (task
// list, note list) are separate stories (NIC-1979, NIC-1983) — this shell
// renders empty mount points either can fill in without touching this file's
// tab-switching logic.
export function ProjectView({ projectId }: ProjectViewProps) {
  const { t } = useTranslation(['project']);
  const { data: project, isLoading, isError } = useGetProjectQuery(projectId);
  const [updateProject] = useUpdateProjectMutation();
  const [tab, setTab] = useState<ProjectTab>('tasks');

  if (isLoading) return <ProjectViewSkeleton />;

  if (isError || !project) {
    return (
      <EmptyState
        icon={FolderX}
        title={t('project:view.notFound')}
        description={t('project:view.notFoundDescription')}
        action={<Button label={t('project:view.backToAreas')} onPress={() => router.replace('/areas')} />}
        testID="project-not-found"
      />
    );
  }

  return (
    <View className="flex-1">
      <ProjectHeader
        project={project}
        onToggleFavorite={() => void updateProject({ id: project.id, isFavorite: !project.isFavorite })}
      />

      {!!project.description && (
        <View className="gap-1 px-4 pb-3">
          <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('project:view.description')}
          </Text>
          <ExpandableText>{project.description}</ExpandableText>
        </View>
      )}

      <View className="px-4">
        <Tabs value={tab} onValueChange={v => setTab(v as ProjectTab)}>
          <TabsList>
            <TabsTrigger value="tasks">{t('project:view.tabTasks')}</TabsTrigger>
            <TabsTrigger value="notes">{t('project:view.tabNotes')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      <View className="flex-1" style={tab === 'tasks' ? undefined : { display: 'none' }} testID="project-tasks-panel">
        <TasksSection projectId={projectId} />
      </View>
      <View className="flex-1" style={tab === 'notes' ? undefined : { display: 'none' }} testID="project-notes-panel">
        {/* Note list content lands with NIC-1983 */}
      </View>
    </View>
  );
}
