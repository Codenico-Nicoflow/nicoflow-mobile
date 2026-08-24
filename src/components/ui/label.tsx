import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/utils/cn';

export function Label({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn('text-foreground dark:text-foreground-dark text-sm font-medium', className)} {...props} />;
}
