import { View } from 'react-native';

import { cn } from '@/lib/utils/cn';

export function Separator({
  orientation = 'horizontal',
  className,
}: {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <View
      className={cn(
        'bg-border dark:bg-border-dark shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
    />
  );
}
