import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Why registration can be skipped. Returned rather than thrown: none of these is
// an error the user should see — push is an enhancement, and a denied permission
// or a simulator is a perfectly normal state.
export type RegisterOutcome =
  | { status: 'registered'; token: string; deviceId?: string }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'failed' };

// Expo push tokens are only issued to real hardware — a simulator has no APNs/FCM
// registration to back one.
const isRealDevice = (): boolean => Device.isDevice;

// A stable per-install identifier, so a device that reinstalls or rotates its Expo
// token updates its existing subscription row instead of adding another (the
// backend upserts on deviceId when present — NIC-1991).
const resolveDeviceId = async (): Promise<string | undefined> => {
  try {
    const id = await Application.getAndroidId?.();
    if (id) return id;
  } catch {
    // Android-only; iOS falls through to the identifierForVendor below.
  }
  try {
    const id = await Application.getIosIdForVendorAsync?.();
    return id ?? undefined;
  } catch {
    return undefined;
  }
};

// The EAS project id the push service issues tokens against. Required by
// getExpoPushTokenAsync outside of a classic Expo Go session.
const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

// requestPushToken asks for permission (only prompting when not already decided)
// and fetches the Expo token. Never throws — every failure path is a typed
// outcome, because a push problem must not break app startup.
export const requestPushToken = async (): Promise<RegisterOutcome> => {
  if (!isRealDevice()) return { status: 'unsupported' };

  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    // Only prompt when the user hasn't already answered — re-prompting a denial
    // is a no-op on iOS anyway, and re-asking is hostile.
    if (!granted && existing.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return { status: 'denied' };

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    if (!data) return { status: 'failed' };

    return { status: 'registered', token: data, deviceId: await resolveDeviceId() };
  } catch {
    return { status: 'failed' };
  }
};
