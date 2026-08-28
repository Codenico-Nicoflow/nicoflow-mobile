import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { router } from 'expo-router';

import { FolderX } from 'lucide-react-native';
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
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpandableText } from '@/components/ui/expandable-text';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import {
  useDeleteProjectMutation,
  useGetAreasWithProjectsQuery,
  useGetNotesInfiniteQuery,
  useGetProjectQuery,
  useGetTasksInfiniteQuery,
  useUpdateProjectMutation,
} from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';
import { splitTransName } from '@/lib/utils/transName';

import { NotesSection } from './notes/NotesSection';
import { TasksSection } from './tasks/TasksSection';
import { ProjectDialog, type ProjectDialogRef } from './ProjectDialog';
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
// with `hidden` rather than delegating to TabsContent.
export function ProjectView({ projectId }: ProjectViewProps) {
  const { t } = useTranslation(['project', 'common']);
  const { data: project, isLoading, isError } = useGetProjectQuery(projectId);
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [tab, setTab] = useState<ProjectTab>('tasks');
  const projectDialogRef = useRef<ProjectDialogRef>(null);
  const deleteAlertRef = useRef<AlertDialogRef>(null);

  // Counts only, for the tab badges — RTK Query dedupes this against the
  // identical infinite query TasksSection/NotesSection already run, no extra
  // network cost. Counts reflect every page loaded so far, same as web.
  const { data: tasksData } = useGetTasksInfiniteQuery({ projectId }, { skip: !projectId });
  const { data: notesData } = useGetNotesInfiniteQuery({ projectId }, { skip: !projectId });
  const taskCount = tasksData?.pages.flatMap(p => p.items).length ?? 0;
  const noteCount = notesData?.pages.flatMap(p => p.items).length ?? 0;

  // Dedupes against AreasList's identical call — just for the 5-favorite cap
  // ProjectDialog enforces when toggling favorite mid-edit.
  const { data: areasWithProjects } = useGetAreasWithProjectsQuery();
  const favoriteCount = (areasWithProjects ?? []).flatMap(a => a.projects ?? []).filter(p => p.isFavorite).length;

  const onConfirmDelete = async () => {
    try {
      await deleteProject(projectId).unwrap();
      showSuccessToast(ToastMessages.PROJECT_DELETED, toast);
      deleteAlertRef.current?.dismiss();
      router.replace('/areas');
    } catch {
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onConfirmDelete();
        },
      });
    }
  };

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
        onEdit={() => projectDialogRef.current?.present(project)}
        onDelete={() => deleteAlertRef.current?.present()}
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
            <TabsTrigger
              value="tasks"
              badge={
                taskCount > 0 ? (
                  <Badge variant="secondary" className="px-1.5 py-0" textClassName="text-[11px]">
                    {taskCount}
                  </Badge>
                ) : undefined
              }
            >
              {t('project:view.tabTasks')}
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              badge={
                noteCount > 0 ? (
                  <Badge variant="outline" className="px-1.5 py-0" textClassName="text-[11px]">
                    {noteCount}
                  </Badge>
                ) : undefined
              }
            >
              {t('project:view.tabNotes')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      <View className="flex-1" style={tab === 'tasks' ? undefined : { display: 'none' }} testID="project-tasks-panel">
        <TasksSection projectId={projectId} />
      </View>
      <View className="flex-1" style={tab === 'notes' ? undefined : { display: 'none' }} testID="project-notes-panel">
        <NotesSection projectId={projectId} />
      </View>

      <ProjectDialog
        ref={projectDialogRef}
        onSaved={() => projectDialogRef.current?.dismiss()}
        onCreateAreaRequested={() => router.replace('/areas')}
        favoriteCount={favoriteCount}
      />

      <AlertDialog ref={deleteAlertRef}>
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
          <AlertDialogCancel onPress={() => deleteAlertRef.current?.dismiss()}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </View>
  );
}
