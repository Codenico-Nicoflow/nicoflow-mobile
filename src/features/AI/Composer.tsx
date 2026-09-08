import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Send, Square } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/hooks/use-theme';

import { MAX_CONTENT_LENGTH } from './useAIStream';

interface ComposerProps {
  onSend: (content: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

// The message input. While a stream is live the send button becomes a stop
// button — the same control, so the primary action is always in one place.
export function Composer({ onSend, onAbort, isStreaming, disabled = false }: ComposerProps) {
  const { t } = useTranslation('ai');
  const colors = useTheme();
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_CONTENT_LENGTH && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <View className="flex-row items-end gap-2 border-t border-border dark:border-border-dark px-3 py-2">
      <View className="flex-1">
        <Textarea
          value={value}
          onChangeText={setValue}
          editable={!disabled && !isStreaming}
          placeholder={isStreaming ? t('chat.composer.streamingPlaceholder') : t('chat.composer.placeholder')}
          accessibilityLabel={t('chat.composer.label')}
          maxLength={MAX_CONTENT_LENGTH}
          className="min-h-11"
          testID="ai-composer-input"
        />
      </View>

      <Pressable
        onPress={isStreaming ? onAbort : handleSend}
        disabled={!isStreaming && !canSend}
        accessibilityRole="button"
        accessibilityLabel={isStreaming ? t('chat.stop') : t('chat.composer.send')}
        testID={isStreaming ? 'ai-composer-stop' : 'ai-composer-send'}
        className={`h-11 w-11 items-center justify-center rounded-md ${
          isStreaming || canSend ? 'bg-primary' : 'bg-muted dark:bg-muted-dark'
        }`}
      >
        {isStreaming ? (
          <Square size={16} color={colors.primaryForeground} fill={colors.primaryForeground} />
        ) : (
          <Send size={18} color={canSend ? colors.primaryForeground : colors.textSecondary} />
        )}
      </Pressable>
    </View>
  );
}
