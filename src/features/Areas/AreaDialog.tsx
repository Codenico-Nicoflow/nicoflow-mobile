import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { type IArea, type IconId } from '@nicoflow/shared/types';
import { Layers, Tag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ColorField } from '@/components/fields/ColorField';
import { IconField } from '@/components/fields/IconField';
import { NameField } from '@/components/fields/NameField';
import { Button } from '@/components/ui/button';
import { PlanLimitAlert } from '@/components/ui/plan-limit-alert';
import { Sheet, SheetDescription, SheetHeader, type SheetRef, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/toast';
import { useCreateAreaMutation, useUpdateAreaMutation } from '@/lib/store';
import { showSuccessToast, ToastMessages } from '@/lib/toast';

const DEFAULT_COLOR = '#3B82F6';
const DEFAULT_ICON: IconId = 'briefcase';
const AREA_NAME_MAX = 30;

export interface AreaDialogRef {
  present: (area?: IArea) => void;
  dismiss: () => void;
}

interface AreaDialogProps {
  onSaved: () => void;
}

interface Fields {
  name: string;
  color: string;
  icon: IconId;
}

const emptyFields = (): Fields => ({ name: '', color: DEFAULT_COLOR, icon: DEFAULT_ICON });

const toFields = (area: IArea): Fields => ({
  name: area.name,
  color: area.color,
  icon: (area.icon as IconId) ?? DEFAULT_ICON,
});

const fieldsEqual = (a: Fields, b: Fields): boolean => a.name === b.name && a.color === b.color && a.icon === b.icon;

const isApiErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  typeof (error as { error?: unknown }).error === 'object' &&
  (error as { error?: { code?: unknown } }).error?.code === code;

// Unified create+edit sheet, mirroring web's AreaDialog.tsx: same field
// order (Name, Color, Icon), same copy, same edit-disabled-until-dirty gate.
// Delete lives on AreaCard's actions menu, not here — same split as web
// (AreaDialog handles create/edit only, AreaCard owns its own delete
// ConfirmDialog).
export const AreaDialog = forwardRef<AreaDialogRef, AreaDialogProps>(function AreaDialog({ onSaved }, ref) {
  const { t } = useTranslation(['area', 'common']);
  const isDark = useColorScheme() === 'dark';
  const [createArea, { isLoading: isCreating }] = useCreateAreaMutation();
  const [updateArea, { isLoading: isUpdating }] = useUpdateAreaMutation();
  const sheetRef = useRef<SheetRef>(null);

  const [area, setArea] = useState<IArea | null>(null);
  const isEditMode = !!area;
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [initialFields, setInitialFields] = useState<Fields>(emptyFields);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<'planLimit' | null>(null);

  useImperativeHandle(ref, () => ({
    present: nextArea => {
      const seeded = nextArea ? toFields(nextArea) : emptyFields();
      setArea(nextArea ?? null);
      setFields(seeded);
      setInitialFields(seeded);
      setNameError(undefined);
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
    // Web's areaNameRequired/areaNameMax messages live in nicoflow-frontend's
    // own zod-error-map, not in @nicoflow/shared/i18n — the copy is ported
    // verbatim here since there's no shared key to translate through.
    const trimmed = fields.name.trim();
    if (!trimmed) {
      setNameError('Area name is required');
      return;
    }
    if (trimmed.length > AREA_NAME_MAX) {
      setNameError('Area name must be less than 30 characters');
      return;
    }
    setNameError(undefined);

    if (isEditMode && !hasChanges) {
      sheetRef.current?.dismiss();
      return;
    }

    try {
      if (isEditMode && area) {
        await updateArea({ id: area.id, name: fields.name, color: fields.color, icon: fields.icon }).unwrap();
        showSuccessToast(ToastMessages.AREA_UPDATED, toast);
      } else {
        await createArea({ name: fields.name, color: fields.color, icon: fields.icon }).unwrap();
        showSuccessToast(ToastMessages.AREA_CREATED, toast);
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
    <Sheet ref={sheetRef} snapPoints={['65%']}>
      <View className="gap-4">
        <SheetHeader>
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/10">
              <Layers size={20} color={isDark ? '#6366f1' : '#4f46e5'} />
            </View>
            <View className="flex-1">
              <SheetTitle>{isEditMode ? t('area:dialog.editTitle') : t('area:dialog.createTitle')}</SheetTitle>
              <SheetDescription>
                {isEditMode ? t('area:dialog.editDescription') : t('area:dialog.createDescription')}
              </SheetDescription>
            </View>
          </View>
        </SheetHeader>

        {formError === 'planLimit' && <PlanLimitAlert />}

        <NameField
          value={fields.name}
          onChange={v => {
            setField('name', v);
            setNameError(undefined);
          }}
          label={t('area:dialog.nameLabel')}
          placeholder={t('area:dialog.namePlaceholder')}
          error={nameError}
          icon={Tag}
        />

        <ColorField value={fields.color} onChange={v => setField('color', v)} label={t('area:dialog.colorLabel')} />

        <IconField value={fields.icon} onChange={v => setField('icon', v)} label={t('area:dialog.iconLabel')} />

        <Button
          label={isEditMode ? t('common:actions.save') : t('common:actions.create')}
          onPress={onSubmit}
          loading={isLoading}
          disabled={(isEditMode && !hasChanges) || isLoading}
        />
      </View>
    </Sheet>
  );
});
