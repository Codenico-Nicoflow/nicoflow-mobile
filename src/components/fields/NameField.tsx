import { CheckSquare } from 'lucide-react-native';
import { TextInput, useColorScheme, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

import { FieldLabel } from './FieldLabel';

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}

export function NameField({ value, onChange, placeholder, error }: NameFieldProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="gap-1.5">
      <FieldLabel icon={CheckSquare} label="Task Name" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
        className={cn(
          'h-12 rounded-md border px-3 text-base bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark',
          error ? 'border-destructive dark:border-destructive-dark' : 'border-input dark:border-input-dark'
        )}
      />
    </View>
  );
}
