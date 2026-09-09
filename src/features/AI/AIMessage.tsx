import { ActivityIndicator, Text, View } from 'react-native';

import type { AIMessageView } from '@nicoflow/shared/api';
import { useTranslation } from 'react-i18next';

import { Radius } from '@/constants/theme';

import { Markdown } from './markdown/Markdown';
import type { PendingStatus } from './useAIStream';

interface AIMessageProps {
  message: AIMessageView;
  status?: PendingStatus;
}

// Maps a §4 error code to its copy. Unknown codes fall back to the generic
// message rather than leaking a raw code into the UI.
const ERROR_KEY: Record<string, string> = {
  AI_LIMIT_REACHED: 'chat.error.limitReached',
  AI_UNAVAILABLE: 'chat.error.unavailable',
  AI_PROVIDER_ERROR: 'chat.error.provider',
  INVALID_INPUT: 'chat.error.invalidInput',
};

export const errorCopyKey = (code: string | undefined): string => (code && ERROR_KEY[code]) || 'chat.error.generic';

// One chat turn. User messages sit on --primary, assistant on --card, both at
// --radius-lg (14px) — same treatment as web's chat panel.
export function AIMessage({ message, status }: AIMessageProps) {
  const { t } = useTranslation('ai');
  const isUser = message.role === 'user';
  const isStreaming = status === 'streaming' && !message.content;

  return (
    <View className={`w-full ${isUser ? 'items-end' : 'items-start'}`} testID={`ai-message-${message.id}`}>
      <View
        className={`max-w-[85%] px-3 py-2 ${isUser ? 'bg-primary' : 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'}`}
        style={{ borderRadius: Radius.lg }}
      >
        {isStreaming ? (
          <View className="flex-row items-center gap-2" accessibilityLabel={t('chat.streamingStatus')}>
            <ActivityIndicator size="small" />
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {t('chat.streamingStatus')}
            </Text>
          </View>
        ) : isUser ? (
          // User text is echoed verbatim — never markdown-parsed, so a user's
          // own asterisks or brackets can't be reinterpreted as formatting.
          <Text className="text-sm leading-5 text-primary-foreground">{message.content}</Text>
        ) : (
          <Markdown content={message.content} testID={`ai-markdown-${message.id}`} />
        )}
      </View>
    </View>
  );
}
