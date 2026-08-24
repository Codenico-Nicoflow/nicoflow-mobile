import { Text, View } from 'react-native';

import { TaskPriority } from '@nicoflow/shared/types';
import { Flag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Select, SelectTrigger } from '@/components/ui/select';
import { PRIORITY_DOT_COLOR, PRIORITY_OPTIONS } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

interface PriorityFieldProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
}

export function PriorityField({ value, onChange }: PriorityFieldProps) {
  const { t } = useTranslation(['common', 'task']);
  const options = PRIORITY_OPTIONS.map(o => ({ ...o, label: t(`task:priority.${o.value}`) }));

  return (
    <View className="gap-1.5">
      <FieldLabel icon={Flag} label={t('common:fields.priorityLabel')} />
      <Select value={value} onValueChange={v => onChange(v as TaskPriority)} options={options}>
        <SelectTrigger
          placeholder={t('common:fields.priorityPlaceholder')}
          renderValue={selected =>
            selected ? (
              <View className="flex-row items-center gap-2">
                <View className={cn('size-2 rounded-full', PRIORITY_DOT_COLOR[selected.value as TaskPriority])} />
                <Text className="text-sm text-foreground dark:text-foreground-dark">{selected.label}</Text>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                {t('common:fields.priorityPlaceholder')}
              </Text>
            )
          }
        />
      </Select>
    </View>
  );
}
