import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { USER_STATUS } from '@nicoflow/shared/types';

import { isWSConnected } from '@/lib/realtime/connectionState';
import { useAppUser, useSubscribeExpoPushMutation } from '@/lib/store';

import { shouldShowAlert } from './foregroundPolicy';
import { requestPushToken } from './registerPushToken';
import { resolveTapTarget, type TappedNotification } from './tapRouting';

// Registered at module scope because expo-notifications calls it outside React —
// it must exist before the first notification arrives, and it cannot read hooks
// or the store, which is why WS state is published to a module-level flag.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const show = shouldShowAlert({
      isForeground: AppState.currentState === 'active',
      isWSConnected: isWSConnected(),
    });
    return {
      shouldShowBanner: show,
      // The notification list is the OS-level history; keep it even when the
      // banner is suppressed, so a user who missed the in-app update can still
      // find it in the shade.
      shouldShowList: true,
      shouldPlaySound: show,
      shouldSetBadge: false,
    };
  },
});

// navigateFromNotification routes a tap by category (NIC-1992): reminder and
// celebration deep-link to their entity, summary and system open the in-app list.
const navigateFromNotification = (data: TappedNotification) => {
  const target = resolveTapTarget(data);
  router.push(target.kind === 'deepLink' ? target.href : '/notifications');
};

// usePushNotifications registers the device's Expo token with the backend and
// wires tap handling. Push is Pro-gated server-side, so a free user is never
// prompted for permission — asking for a permission we cannot use is a bad trade.
export const usePushNotifications = (): void => {
  const user = useAppUser();
  const [subscribeExpoPush] = useSubscribeExpoPushMutation();
  const registeredRef = useRef(false);

  const isPro = user?.status === USER_STATUS.PREMIUM;

  useEffect(() => {
    if (!user || !isPro || registeredRef.current) return;
    let cancelled = false;

    void (async () => {
      const outcome = await requestPushToken();
      // denied / unsupported / failed are all normal — push is an enhancement,
      // and none of them should surface an error to the user.
      if (cancelled || outcome.status !== 'registered') return;

      try {
        await subscribeExpoPush({ expoPushToken: outcome.token, deviceId: outcome.deviceId }).unwrap();
        registeredRef.current = true;
      } catch {
        // A failed subscribe leaves registeredRef false so the next mount retries.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isPro, subscribeExpoPush]);

  // Tap handling. Two entry points: a tap while the app is running, and the tap
  // that launched a cold app — the latter is not delivered to the listener, so it
  // has to be read once at startup or the navigation is silently lost.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      navigateFromNotification(response.notification.request.content.data as TappedNotification);
    });

    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        navigateFromNotification(response.notification.request.content.data as TappedNotification);
      }
    });

    return () => subscription.remove();
  }, []);
};
