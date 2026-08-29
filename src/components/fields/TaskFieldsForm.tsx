import { type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { type TaskEnergy, type TaskPriority } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { DescriptionField } from './DescriptionField';
import { EnergyField } from './EnergyField';
import { EstimatedTimeField } from './EstimatedTimeField';
import { NameField } from './NameField';
import { PriorityField } from './PriorityField';
import { RollOverField } from './RollOverField';
import { ScheduledForField } from './ScheduledForField';
import { ScheduledTimeField } from './ScheduledTimeField';
import { UrlField } from './UrlField';

export interface TaskFieldsValue {
  title: string;
  notes: string;
  priority: TaskPriority;
  energy: TaskEnergy;
  scheduledFor: string | null;
  scheduledTime: string | null;
  rollsOver: boolean;
  estimatedMinutes: number | null;
  url: string;
}

interface TaskFieldsFormProps {
  value: TaskFieldsValue;
  onChange: <K extends keyof TaskFieldsValue>(key: K, value: TaskFieldsValue[K]) => void;
  titleError?: string;
  /**
   * Hides the time-of-day input. Set by the caller while recurrence is on —
   * the rule's own scheduledTime is what's stamped onto every occurrence, and
   * showing both this and the rule's time field invited setting one and
   * submitting the other. Matches web's TaskDialog.
   */
  hideScheduledTime?: boolean;
  /** Rendered right after Description, before Priority — edit-mode-only StatusField from the caller. */
  statusSlot?: ReactNode;
  /** Rendered right after the scheduling block, before EstimatedTime — RecurrenceField from the caller. */
  recurrenceSlot?: ReactNode;
}

// The full task field set, shared by TaskCreateSheet (Today tab FAB) and
// BucketProcessSheet (Inbox process-to-task) — both create a task from
// scratch and need identical fields, matching web's TaskDialog/
// BucketProcessDialog task path field-for-field.
export function TaskFieldsForm({
  value,
  onChange,
  titleError,
  hideScheduledTime = false,
  statusSlot,
  recurrenceSlot,
}: TaskFieldsFormProps) {
  const { t } = useTranslation('task');
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="gap-4">
      <NameField
        value={value.title}
        onChange={v => onChange('title', v)}
        label={t('dialog.taskNameLabel')}
        placeholder={t('dialog.taskNamePlaceholder')}
        error={titleError}
      />

      <DescriptionField
        value={value.notes}
        onChange={v => onChange('notes', v)}
        label={t('dialog.descriptionLabel')}
        placeholder={t('dialog.descriptionPlaceholder')}
      />

      {statusSlot}

      <PriorityField value={value.priority} onChange={v => onChange('priority', v)} />

      <EnergyField value={value.energy} onChange={v => onChange('energy', v)} isDark={isDark} />

      <View className="gap-3 rounded-lg border border-border dark:border-border-dark p-3">
        <ScheduledForField value={value.scheduledFor} onChange={v => onChange('scheduledFor', v)} />
        {!hideScheduledTime && (
          <ScheduledTimeField
            value={value.scheduledTime}
            onChange={v => onChange('scheduledTime', v)}
            disabled={!value.scheduledFor}
          />
        )}
        <RollOverField value={value.rollsOver} onChange={v => onChange('rollsOver', v)} />
      </View>

      {recurrenceSlot}

      <EstimatedTimeField value={value.estimatedMinutes} onChange={v => onChange('estimatedMinutes', v)} />

      <UrlField value={value.url} onChange={v => onChange('url', v)} />
    </View>
  );
}
