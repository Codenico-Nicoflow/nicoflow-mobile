import { CalendarClock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DateField } from './DateField';
import { FieldLabel } from './FieldLabel';

interface ScheduledForFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ScheduledForField({ value, onChange }: ScheduledForFieldProps) {
  const { t } = useTranslation('common');

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CalendarClock} label={t('fields.scheduledForLabel')} optional />
      <DateField value={value} onChange={onChange} placeholder={t('fields.pickDate')} />
      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
        {t('fields.scheduledForHint')}
      </Text>
    </View>
  );
}
