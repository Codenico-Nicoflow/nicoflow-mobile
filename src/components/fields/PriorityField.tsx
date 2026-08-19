import { TaskPriority } from '@nicoflow/shared/types';
import { Flag } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Select, SelectTrigger } from '@/components/ui/select';
import { PRIORITY_DOT_COLOR, PRIORITY_OPTIONS } from '@/lib/constants/priority';
import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

interface PriorityFieldProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
}

export function PriorityField({ value, onChange }: PriorityFieldProps) {
  return (
    <View className="gap-1.5">
      <FieldLabel icon={Flag} label="Priority" />
      <Select value={value} onValueChange={v => onChange(v as TaskPriority)} options={PRIORITY_OPTIONS}>
        <SelectTrigger
          placeholder="Choose priority"
          renderValue={selected =>
            selected ? (
              <View className="flex-row items-center gap-2">
                <View className={cn('size-2 rounded-full', PRIORITY_DOT_COLOR[selected.value as TaskPriority])} />
                <Text className="text-sm text-foreground dark:text-foreground-dark">{selected.label}</Text>
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">Choose priority</Text>
            )
          }
        />
      </Select>
    </View>
  );
}
