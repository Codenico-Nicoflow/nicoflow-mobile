import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import type { AIMessageView } from '@nicoflow/shared/api';
import { AlertTriangle, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useGetAISessionQuery } from '@/lib/store';

import { AIMessage, errorCopyKey } from './AIMessage';
import { Composer } from './Composer';
import { QuotaIndicator } from './QuotaIndicator';
import { QuotaWall } from './QuotaWall';
import { useAIQuota } from './useAIQuota';
import { type PendingMessage, useAIStream } from './useAIStream';

interface AIChatProps {
  sessionId: string;
}

// The chat surface: persisted history from GET /ai/sessions/:id, plus the live
// turns useAIStream holds locally until a refetch pulls the server copies.
export function AIChat({ sessionId }: AIChatProps) {
  const { t } = useTranslation('ai');
  const listRef = useRef<FlatList<AIMessageView | PendingMessage>>(null);
  const { data: session, isLoading, isError, refetch } = useGetAISessionQuery(sessionId);
  const { quota, isLoading: isQuotaLoading, featureDisabled, hardenFromError, isExhausted } = useAIQuota();
  const { pending, isStreaming, send, abort, reset } = useAIStream();

  const history = useMemo(() => session?.messages ?? [], [session?.messages]);
  const historyIds = useMemo(() => new Set(history.map(m => m.id)), [history]);
  // The server never echoes back the client-generated id for the USER half of a
  // turn — the done event carries only the assistant's persisted messageId — so a
  // pending user turn can never match history by id. Match on content instead, or
  // it renders twice once the session refetches.
  const historyUserContents = useMemo(
    () => new Set(history.filter(m => m.role === 'user').map(m => m.content)),
    [history]
  );

  // Only the turns the refetched history doesn't already carry.
  const extraTurns = useMemo(
    () => pending.filter(m => (m.role === 'user' ? !historyUserContents.has(m.content) : !historyIds.has(m.id))),
    [pending, historyIds, historyUserContents]
  );

  // A finished turn that streamed no text (the model went straight to a tool_use,
  // or the stream closed empty) has nothing to show. A turn still sending or
  // streaming stays, so its placeholder remains visible. Filtered here rather than
  // in renderItem: a null row still occupies a FlatList slot and its gap.
  const messages = useMemo<(AIMessageView | PendingMessage)[]>(
    () => [...history, ...extraTurns].filter(m => m.content.trim() !== '' || ('status' in m && m.status !== 'done')),
    [history, extraTurns]
  );

  // Once the assistant turn is persisted, drop the local copies entirely so the
  // next send starts from a clean slate.
  const merged = pending.some(m => m.role === 'assistant' && m.status === 'done' && historyIds.has(m.id));
  useEffect(() => {
    if (!isStreaming && merged) reset();
  }, [isStreaming, merged, reset]);

  const handleSend = useCallback(
    (content: string) => {
      void send(sessionId, content).then(outcome => {
        if (outcome !== 'error') return;
        // The failed turn carries the §4 code; surface it and harden the wall
        // so a stale cached usage can't leave the composer open.
        const failed = pending.find((m): m is PendingMessage => 'errorCode' in m && Boolean(m.errorCode));
        hardenFromError(failed?.errorCode);
        toast.error(t(errorCopyKey(failed?.errorCode)));
      });
    },
    [send, sessionId, pending, hardenFromError, t]
  );

  if (isLoading) {
    return (
      <View className="flex-1 gap-3 p-3" testID="ai-chat-loading">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t('chat.loadErrorTitle')}
        description={t('chat.loadErrorDescription')}
        action={<Button variant="outline" size="sm" label={t('sessions.retry')} onPress={() => void refetch()} />}
        testID="ai-chat-error"
      />
    );
  }

  if (featureDisabled) {
    return (
      <EmptyState
        icon={Sparkles}
        title={t('disabled.title')}
        description={t('disabled.description')}
        testID="ai-disabled"
      />
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} testID="ai-chat">
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerClassName="gap-3 p-3"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <EmptyState icon={Sparkles} title={t('chat.startTitle')} description={t('chat.startDescription')} />
        }
        renderItem={({ item }) => <AIMessage message={item} status={'status' in item ? item.status : undefined} />}
      />

      <QuotaIndicator quota={quota} isLoading={isQuotaLoading} />

      {isExhausted && quota ? (
        <QuotaWall quota={quota} />
      ) : (
        <Composer onSend={handleSend} onAbort={abort} isStreaming={isStreaming} />
      )}
    </KeyboardAvoidingView>
  );
}
