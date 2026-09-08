import { Pressable, Text, useColorScheme } from 'react-native';

import { ChevronRight, type LucideIcon } from 'lucide-react-native';

interface MoreRowProps {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  /** Last row drops the divider so the list doesn't end on a hanging line. */
  isLast?: boolean;
}

export function MoreRow({ id, label, icon: Icon, onPress, isLast = false }: MoreRowProps) {
  const isDark = useColorScheme() === 'dark';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const iconColor = isDark ? '#e2e8f0' : '#0f172a';

  return (
    <Pressable
      onPress={onPress}
      testID={`more-row-${id}`}
      accessibilityRole="link"
      accessibilityLabel={label}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${isLast ? '' : 'border-b border-border dark:border-border-dark'}`}
    >
      <Icon size={20} color={iconColor} />
      <Text className="flex-1 text-base text-foreground dark:text-foreground-dark">{label}</Text>
      <ChevronRight size={18} color={mutedColor} />
    </Pressable>
  );
}
