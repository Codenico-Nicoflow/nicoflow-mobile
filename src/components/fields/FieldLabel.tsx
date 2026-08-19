import { type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';

interface FieldLabelProps {
  icon: LucideIcon;
  label: string;
  optional?: boolean;
  iconColor?: string;
}

export function FieldLabel({ icon: Icon, label, optional, iconColor }: FieldLabelProps) {
  const { t } = useTranslation('common');
  const mutedColor = useColorScheme() === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <View className="flex-row items-center gap-2">
      <Icon size={16} color={iconColor ?? mutedColor} />
      <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">{label}</Text>
      {optional && (
        <Text className="text-xs font-normal text-muted-foreground dark:text-muted-foreground-dark">
          {t('fields.optional')}
        </Text>
      )}
    </View>
  );
}
