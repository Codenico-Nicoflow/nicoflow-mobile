import { CalendarClock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { DateField } from './DateField';
import { FieldLabel } from './FieldLabel';

interface ScheduledForFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ScheduledForField({ value, onChange }: ScheduledForFieldProps) {
  return (
    <View className="gap-1.5">
      <FieldLabel icon={CalendarClock} label="Scheduled for" optional />
      <DateField value={value} onChange={onChange} />
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        Carries forward if not done, never marked overdue.
      </Text>
    </View>
  );
}
