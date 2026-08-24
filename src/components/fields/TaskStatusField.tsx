import { Text, View } from 'react-native';

import { TaskStatus } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';

interface TaskStatusFieldProps {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
}

// Edit-mode only, matching web's StatusField — a new task always starts
// 'active' server-side, so create mode never shows this.
export function TaskStatusField({ value, onChange }: TaskStatusFieldProps) {
  const { t } = useTranslation(['task', 'common']);
  const options = [
    { label: t('task:status.active'), value: TaskStatus.ACTIVE },
    { label: t('task:status.done'), value: TaskStatus.DONE },
    { label: t('task:status.cancelled'), value: TaskStatus.CANCELLED },
  ];

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
        {t('common:fields.statusLabel')}
      </Text>
      <Select value={value} onValueChange={v => onChange(v as TaskStatus)} options={options}>
        <SelectTrigger placeholder={t('common:fields.statusPlaceholder')} />
      </Select>
    </View>
  );
}
