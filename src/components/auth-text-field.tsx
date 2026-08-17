import { useState } from 'react';

import { Text, TextInput, type TextInputProps, useColorScheme, View } from 'react-native';

interface AuthTextFieldProps extends TextInputProps {
  error?: string;
}

// Mirrors nicoflow-frontend's Input: h-9 (36px), shadow-xs at rest,
// border-input token, focus ring (web's focus-visible:ring-ring/50
// ring-[3px] — RN has no native focus-visible, so onFocus/onBlur drive an
// explicit ring color swap + border-width bump instead).
export function AuthTextField({ error, className, onFocus, onBlur, ...props }: AuthTextFieldProps) {
  const scheme = useColorScheme();
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-destructive dark:border-destructive-dark'
    : focused
      ? 'border-ring dark:border-ring-dark border-[1.5px]'
      : 'border-input dark:border-input-dark';

  return (
    <View className="gap-0.5">
      <TextInput
        className={`h-9 rounded-md border px-4 text-[15px] bg-card dark:bg-card-dark text-foreground dark:text-foreground-dark shadow-xs ${borderClass} ${className ?? ''}`}
        placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text className="text-destructive dark:text-destructive-dark text-[13px]">{error}</Text>}
    </View>
  );
}
