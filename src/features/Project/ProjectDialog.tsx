import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { type IconId, type IProject } from '@nicoflow/shared/types';
import { FolderPlus, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AreaPicker } from '@/components/fields/AreaPicker';
import { CheckboxField } from '@/components/fields/CheckboxField';
import { DateField } from '@/components/fields/DateField';
import { DescriptionField } from '@/components/fields/DescriptionField';
import { IconField } from '@/components/fields/IconField';
import { NameField } from '@/components/fields/NameField';
import { type ProjectStatus, ProjectStatusField } from '@/components/fields/ProjectStatusField';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetDescription, SheetFooter, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { useCreateProjectMutation, useGetAreasQuery, useUpdateProjectMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';

const DEFAULT_ICON: IconId = 'folder';
const PROJECT_NAME_MAX = 50;
const DESCRIPTION_MAX = 2000;
const MAX_FAVORITES = 5;

export interface ProjectDialogRef {
  present: (project?: IProject, areaId?: string) => void;
  dismiss: () => void;
}

interface ProjectDialogProps {
  onSaved: () => void;
  onCreateAreaRequested: () => void;
  favoriteCount: number;
}

interface Fields {
  name: string;
  areaId: string;
  folderIcon: IconId;
  status: ProjectStatus;
  description: string;
  dueDate: string | null;
  isFavorite: boolean;
}

const emptyFields = (areaId = ''): Fields => ({
  name: '',
  areaId,
  folderIcon: DEFAULT_ICON,
  status: 'active',
  description: '',
  dueDate: null,
  isFavorite: false,
});

const toFields = (project: IProject): Fields => ({
  name: project.name,
  areaId: project.areaId,
  folderIcon: (project.folderIcon as IconId) ?? DEFAULT_ICON,
  status: project.status,
  description: project.description ?? '',
  dueDate: project.dueDate ?? null,
  isFavorite: !!project.isFavorite,
});

const DIRTY_KEYS = ['name', 'areaId', 'folderIcon', 'status', 'dueDate', 'isFavorite', 'description'] as const;

const fieldsEqual = (a: Fields, b: Fields): boolean => DIRTY_KEYS.every(key => a[key] === b[key]);

const isApiErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  typeof (error as { error?: unknown }).error === 'object' &&
  (error as { error?: { code?: unknown } }).error?.code === code;

// Unified create+edit sheet, mirroring web's ProjectDialog.tsx: no-areas
// guard (swaps to a "Create an Area first" prompt), same field order (Name,
// Area+Icon, Status[edit-only], Description, Due Date, Favorite), same
// client-enforced 5-favorite cap, same edit-disabled-until-dirty gate.
export const ProjectDialog = forwardRef<ProjectDialogRef, ProjectDialogProps>(function ProjectDialog(
  { onSaved, onCreateAreaRequested, favoriteCount },
  ref
) {
  const { t } = useTranslation(['project', 'common']);
  const isDark = useColorScheme() === 'dark';
  const { data: areasData } = useGetAreasQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const sheetRef = useRef<SheetRef>(null);
  const noAreaDialogRef = useRef<SheetRef>(null);

  const [project, setProject] = useState<IProject | null>(null);
  const isEditMode = !!project;
  const [fields, setFields] = useState<Fields>(() => emptyFields());
  const [initialFields, setInitialFields] = useState<Fields>(() => emptyFields());
  const [nameError, setNameError] = useState<string | undefined>();
  const [areaError, setAreaError] = useState<string | undefined>();
  const [formError, setFormError] = useState<'planLimit' | null>(null);

  useImperativeHandle(ref, () => ({
    present: (nextProject, presetAreaId) => {
      if (!nextProject && (areasData?.items?.length ?? 0) === 0) {
        noAreaDialogRef.current?.present();
        return;
      }
      const seeded = nextProject ? toFields(nextProject) : emptyFields(presetAreaId);
      setProject(nextProject ?? null);
      setFields(seeded);
      setInitialFields(seeded);
      setNameError(undefined);
      setAreaError(undefined);
      setFormError(null);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const setField = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields(prev => ({ ...prev, [key]: value }));

  const hasChanges = !fieldsEqual(fields, initialFields);
  const isLoading = isCreating || isUpdating;

  const onSubmit = async () => {
    setFormError(null);
    const trimmed = fields.name.trim();
    if (!trimmed) {
      setNameError('Project name is required');
      return;
    }
    if (trimmed.length > PROJECT_NAME_MAX) {
      setNameError('Project name must be less than 50 characters');
      return;
    }
    if (!fields.areaId) {
      setAreaError('Please select an Area');
      return;
    }
    setNameError(undefined);
    setAreaError(undefined);

    if (isEditMode && !hasChanges) {
      sheetRef.current?.dismiss();
      return;
    }

    // Client-enforced cap, matching web: only blocks when newly starring
    // would exceed the limit — un-favoriting or leaving isFavorite untouched
    // never trips it.
    const startingToFavorite = fields.isFavorite && !initialFields.isFavorite;
    if (startingToFavorite && favoriteCount >= MAX_FAVORITES) {
      toast.error('You can pin up to 5 favorites. Unstar one to make room.');
      return;
    }

    try {
      if (isEditMode && project) {
        await updateProject({
          id: project.id,
          name: fields.name,
          areaId: fields.areaId,
          status: fields.status,
          folderIcon: fields.folderIcon,
          description: fields.description || null,
          dueDate: fields.dueDate,
          isFavorite: fields.isFavorite,
        }).unwrap();
        showSuccessToast(ToastMessages.PROJECT_UPDATED, toast);
      } else {
        await createProject({
          name: fields.name,
          areaId: fields.areaId,
          folderIcon: fields.folderIcon,
          description: fields.description || undefined,
          dueDate: fields.dueDate ?? undefined,
          isFavorite: fields.isFavorite,
        }).unwrap();
        showSuccessToast(ToastMessages.PROJECT_CREATED, toast);
      }
      onSaved();
      sheetRef.current?.dismiss();
    } catch (error) {
      if (isApiErrorCode(error, 'PLAN_LIMIT_EXCEEDED')) {
        setFormError('planLimit');
        return;
      }
      toast.errorWithRetry(t('common:mutationError'), {
        label: t('common:actions.retry'),
        onPress: () => {
          void onSubmit();
        },
      });
    }
  };

  return (
    <>
      <Sheet ref={sheetRef} snapPoints={['85%']}>
        <View className="gap-4">
          <SheetHeader>
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
                <FolderPlus size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
              </View>
              <View className="flex-1">
                <SheetTitle>{isEditMode ? t('project:dialog.editTitle') : t('project:dialog.createTitle')}</SheetTitle>
                <SheetDescription>
                  {isEditMode ? t('project:dialog.editDescription') : t('project:dialog.createDescription')}
                </SheetDescription>
              </View>
            </View>
          </SheetHeader>

          {formError === 'planLimit' && (
            <Alert>
              <AlertTitle>{t('common:planLimit.title')}</AlertTitle>
              <AlertDescription>{t('common:planLimit.description')}</AlertDescription>
            </Alert>
          )}

          <NameField
            value={fields.name}
            onChange={v => {
              setField('name', v);
              setNameError(undefined);
            }}
            label={t('project:dialog.nameLabel')}
            placeholder={t('project:dialog.namePlaceholder')}
            error={nameError}
          />

          <AreaPicker
            value={fields.areaId}
            onChange={v => {
              setField('areaId', v);
              setAreaError(undefined);
            }}
            label={t('project:areaField.label')}
            placeholder={t('project:areaField.placeholder')}
            loadingPlaceholder={t('project:areaField.loading')}
            error={areaError}
          />

          <IconField
            value={fields.folderIcon}
            onChange={v => setField('folderIcon', v)}
            label={t('project:dialog.iconLabel')}
          />

          {isEditMode && <ProjectStatusField value={fields.status} onChange={v => setField('status', v)} />}

          <DescriptionField
            value={fields.description}
            onChange={v => setField('description', v.slice(0, DESCRIPTION_MAX))}
            label={t('project:dialog.descriptionLabel')}
            placeholder={t('project:dialog.descriptionPlaceholder')}
          />

          <View className="gap-1.5">
            <DateField
              value={fields.dueDate}
              onChange={v => setField('dueDate', v)}
              placeholder={t('common:fields.pickDate')}
            />
          </View>

          <CheckboxField
            value={fields.isFavorite}
            onChange={v => setField('isFavorite', v)}
            label={t('project:dialog.favoriteLabel')}
            description={t('project:dialog.favoriteDescription')}
            icon={Star}
            iconColor="#eab308"
          />

          <Button
            label={isEditMode ? t('common:actions.save') : t('common:actions.create')}
            onPress={onSubmit}
            loading={isLoading}
            disabled={(isEditMode && !hasChanges) || isLoading}
          />
        </View>
      </Sheet>

      <Sheet ref={noAreaDialogRef} snapPoints={['35%']}>
        <SheetHeader>
          <SheetTitle>{t('project:dialog.noAreaTitle')}</SheetTitle>
          <SheetDescription>{t('project:dialog.noAreaDescription')}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button
            label={t('project:dialog.createAreaButton')}
            onPress={() => {
              noAreaDialogRef.current?.dismiss();
              onCreateAreaRequested();
            }}
          />
        </SheetFooter>
      </Sheet>
    </>
  );
});
