import { Pressable, Text, View } from 'react-native';

import { type LucideIcon } from 'lucide-react-native';

import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

// Generic version of RollOverField's checkbox-with-label-and-description
// pattern — extracted so ProjectDialog's "Mark as favorite" field (same
// shape, different copy/icon) doesn't duplicate the whole component.
export function CheckboxField({ value, onChange, label, description, icon: Icon, iconColor }: CheckboxFieldProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className="flex-row items-center gap-3 rounded-lg border border-border dark:border-border-dark bg-muted/40 dark:bg-muted-dark/40 p-3"
    >
      <Checkbox checked={value} onCheckedChange={onChange} />
      <Icon size={16} color={iconColor} />
      <View className="flex-1 gap-0.5">
        <Text className="text-sm text-foreground dark:text-foreground-dark">{label}</Text>
        <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{description}</Text>
      </View>
    </Pressable>
  );
}
