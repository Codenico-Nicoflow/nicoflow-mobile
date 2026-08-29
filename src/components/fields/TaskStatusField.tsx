import { useColorScheme, View } from 'react-native';

import { TaskStatus } from '@nicoflow/shared/types';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';

import { FieldLabel } from './FieldLabel';

interface TaskStatusFieldProps {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
}

// Label icon matches web's ProjectStatusField (CheckCircle), not TaskDialog's
// own StatusField — per explicit direction, task status should read the same
// as project status. iconColor makes each option's Circle icon read as a
// solid dot in the status's semantic color (active/done/cancelled).
export function TaskStatusField({ value, onChange }: TaskStatusFieldProps) {
  const { t } = useTranslation(['task', 'common']);
  const isDark = useColorScheme() === 'dark';
  const options = [
    {
      label: t('task:status.active'),
      value: TaskStatus.ACTIVE,
      icon: Circle,
      iconColor: isDark ? '#6366f1' : '#4f46e5',
    },
    { label: t('task:status.done'), value: TaskStatus.DONE, icon: Circle, iconColor: isDark ? '#22c55e' : '#16a34a' },
    {
      label: t('task:status.cancelled'),
      value: TaskStatus.CANCELLED,
      icon: Circle,
      iconColor: isDark ? '#ef4444' : '#dc2626',
    },
  ];

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CheckCircle} label={t('common:fields.statusLabel')} />
      <Select value={value} onValueChange={v => onChange(v as TaskStatus)} options={options}>
        <SelectTrigger placeholder={t('common:fields.statusPlaceholder')} />
      </Select>
    </View>
  );
}
