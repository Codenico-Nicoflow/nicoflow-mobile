import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

// Mirrors nicoflow-frontend's SignForm (src/features/SignForm/SignForm.tsx):
// title + subtitle header, content below. The outer page chrome (logo
// header, scroll, footer, safe area) lives in (auth)/_layout.tsx now — this
// only owns the form card itself.
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <View className="w-full max-w-md">
      <View className="items-center gap-1 mb-8">
        <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold tracking-tight">
          {title}
        </Text>
        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm text-center max-w-xs">
          {description}
        </Text>
      </View>
      {children}
    </View>
  );
}
