import { useState } from 'react';

import { ActivityIndicator, Pressable, Text } from 'react-native';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// Mirrors nicoflow-frontend's Button (default variant, size="xl"): shadow-sm
// at rest, shadow-md on hover/press, 44px height, 200ms transition. RN has no
// CSS transitions for shadow, so press state swaps the static shadow token
// instead of animating between them — visually equivalent at this scale.
export function AuthButton({ label, onPress, loading, disabled }: AuthButtonProps) {
  const isDisabled = Boolean(loading || disabled);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      className={`h-11 rounded-md items-center justify-center mt-2 bg-primary dark:bg-primary-dark ${pressed ? 'shadow-md' : 'shadow-sm'} ${isDisabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-primary-foreground text-[15px] font-semibold">{label}</Text>
      )}
    </Pressable>
  );
}
