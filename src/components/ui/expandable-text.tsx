import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils/cn';

export interface ExpandableTextProps {
  children: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableText({ children, maxLength = 280, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = children.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? children : `${children.slice(0, maxLength)}...`;

  return (
    <View className="gap-2">
      <Pressable onPress={() => shouldTruncate && setIsExpanded(!isExpanded)} disabled={!shouldTruncate}>
        <Text className={cn('text-sm text-foreground dark:text-foreground-dark leading-relaxed', className)}>
          {displayText}
        </Text>
      </Pressable>
      {shouldTruncate && (
        <Pressable onPress={() => setIsExpanded(!isExpanded)} accessibilityRole="button">
          <Text className="text-xs text-primary dark:text-primary-dark">{isExpanded ? 'Show less' : 'Show more'}</Text>
        </Pressable>
      )}
    </View>
  );
}
