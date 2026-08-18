import { useState } from 'react';
import { TextInput, type TextInputProps, useColorScheme } from 'react-native';

import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextInputProps {
  error?: boolean;
}

export function Textarea({ error, className, onFocus, onBlur, style, ...props }: TextareaProps) {
  const scheme = useColorScheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
      className={cn(
        'min-h-20 w-full rounded-md border px-3 py-2 text-base bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark',
        error
          ? 'border-destructive dark:border-destructive-dark'
          : focused
            ? 'border-ring dark:border-ring-dark'
            : 'border-input dark:border-input-dark',
        className
      )}
      onFocus={e => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={e => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={style}
      {...props}
    />
  );
}
