import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { IGoogleCalendar } from '@nicoflow/shared/api';
import { MAX_SELECTED_CALENDARS } from '@nicoflow/shared/api';
import { USER_STATUS } from '@nicoflow/shared/types';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import {
  useAppUser,
  useDisconnectGoogleMutation,
  useGetGoogleCalendarsQuery,
  useGetGoogleConnectionQuery,
  useLazyGetGoogleAuthUrlQuery,
  useUpdateGoogleCalendarSelectionMutation,
} from '@/lib/store';
import { getApiErrorCode } from '@/lib/utils/apiError';

import { googleOAuthResult, toggleGoogleCalendar } from './googleConnection';
import { SettingsCard } from './SettingsCard';

export function GoogleConnectionCard() {
  const user = useAppUser();
  if (user?.status !== USER_STATUS.PREMIUM) return null;
  return <ProGoogleConnectionCard />;
}

function ProGoogleConnectionCard() {
  const { t } = useTranslation('common');
  const [message, setMessage] = useState('');
  const connection = useGetGoogleConnectionQuery(undefined);
  const calendars = useGetGoogleCalendarsQuery(undefined, { skip: connection.isError || !connection.data });
  const [requestAuthUrl, authUrl] = useLazyGetGoogleAuthUrlQuery();
  const [disconnect, disconnectState] = useDisconnectGoogleMutation();
  const [updateSelection, selectionState] = useUpdateGoogleCalendarSelectionMutation();
  const copy = (key: string, options?: Record<string, string | number>) => t(`pages.settings.google.${key}`, options);

  const connect = async () => {
    setMessage('');
    try {
      const returnUrl = Linking.createURL('settings', { scheme: 'nicoflow', isTripleSlashed: true });
      const result = await requestAuthUrl(returnUrl).unwrap();
      const browser = await WebBrowser.openAuthSessionAsync(result.authUrl, returnUrl);
      const outcome = googleOAuthResult(browser);
      if (outcome === 'connected') {
        setMessage(copy('connected'));
        await connection.refetch();
      } else if (outcome === 'denied') setMessage(copy('denied'));
      else if (outcome === 'failed') setMessage(copy('oauthFailed'));
      else setMessage(copy('cancelled'));
    } catch {
      setMessage(copy('oauthFailed'));
    }
  };

  const confirmDisconnect = () =>
    Alert.alert(copy('disconnectTitle'), copy('disconnectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: copy('disconnect'),
        style: 'destructive',
        onPress: () =>
          void disconnect()
            .unwrap()
            .catch(() => toast.error(copy('error'))),
      },
    ]);

  const changeSelection = (calendar: IGoogleCalendar) => {
    const ids = toggleGoogleCalendar(calendars.data ?? [], calendar.id);
    setMessage('');
    void updateSelection(ids)
      .unwrap()
      .catch(() => setMessage(copy('saveFailed')));
  };

  const loading = connection.isLoading || connection.isFetching;
  const isDisconnected = getApiErrorCode(connection.error) === 'GOOGLE_NOT_CONNECTED';
  const recoverableConnectionError = connection.isError && !isDisconnected;
  const notConnected = isDisconnected || (!connection.isError && !connection.data);

  return (
    <SettingsCard title={copy('title')} testID="settings-google-calendar-card">
      {message ? (
        <Text accessibilityRole="alert" className="mb-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {message}
        </Text>
      ) : null}
      {loading ? (
        <View testID="google-calendar-loading">
          <Skeleton className="h-10 w-full" />
        </View>
      ) : recoverableConnectionError ? (
        <View className="gap-2">
          <Text accessibilityRole="alert" className="text-sm text-destructive">
            {copy('loadFailed')}
          </Text>
          <Button label={copy('retry')} variant="outline" onPress={() => void connection.refetch()} />
        </View>
      ) : notConnected ? (
        <View className="gap-2">
          {connection.isError ? <Text className="text-sm text-destructive">{copy('notConnected')}</Text> : null}
          <Button
            label={copy('connect')}
            onPress={() => void connect()}
            loading={authUrl.isLoading}
            testID="google-calendar-connect"
          />
          {connection.isError ? (
            <Button label={copy('retry')} variant="outline" onPress={() => void connection.refetch()} />
          ) : null}
        </View>
      ) : connection.data ? (
        <View className="gap-2">
          <Text className="text-sm text-foreground dark:text-foreground-dark">
            {connection.data.googleAccountEmail}
          </Text>
          {connection.data.lastError ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              {connection.data.lastError}
            </Text>
          ) : null}
          {calendars.isLoading ? (
            <View testID="google-calendar-list-loading">
              <Skeleton className="h-10 w-full" />
            </View>
          ) : null}
          {calendars.isError ? (
            <View className="gap-2">
              <Text accessibilityRole="alert" className="text-sm text-destructive">
                {copy('loadFailed')}
              </Text>
              <Button label={copy('retry')} variant="outline" onPress={() => void calendars.refetch()} />
            </View>
          ) : null}
          {!calendars.isLoading && !calendars.isError && (calendars.data?.length ?? 0) === 0 ? (
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">{copy('noCalendars')}</Text>
          ) : null}
          {calendars.data?.map(calendar => {
            const atLimit =
              !calendar.selected && calendars.data?.filter(item => item.selected).length === MAX_SELECTED_CALENDARS;
            return (
              <Pressable
                key={calendar.id}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: calendar.selected,
                  disabled: Boolean(atLimit || selectionState.isLoading),
                }}
                accessibilityHint={atLimit ? copy('maxSelected') : undefined}
                disabled={Boolean(atLimit || selectionState.isLoading)}
                onPress={() => changeSelection(calendar)}
                className="flex-row items-center gap-3 border-b border-border py-2 dark:border-border-dark"
                testID={`google-calendar-${calendar.id}`}
              >
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.backgroundColor }} />
                <Text className="flex-1 text-sm text-foreground dark:text-foreground-dark">
                  {calendar.summary}
                  {calendar.primary ? ` · ${copy('primary')}` : ''}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {calendar.selected ? '✓' : ''}
                </Text>
              </Pressable>
            );
          })}
          <Button
            label={copy('disconnect')}
            variant="outline"
            onPress={confirmDisconnect}
            loading={disconnectState.isLoading}
          />
        </View>
      ) : null}
    </SettingsCard>
  );
}
