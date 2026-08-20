import { isRunningInExpoGo } from 'expo';
import { DevSettings } from 'react-native';

// RTL direction (I18nManager.forceRTL) only takes effect after a full reload
// — RN can't hot-swap layout direction. Updates.reloadAsync() is the
// production path but explicitly unsupported in Expo Go/dev mode, which is
// how this app is run day to day, so branch: DevSettings.reload() there,
// the real Updates API in a built app.
export async function reloadApp(): Promise<void> {
  if (isRunningInExpoGo() || __DEV__) {
    DevSettings.reload();
    return;
  }
  const Updates = await import('expo-updates');
  await Updates.reloadAsync();
}
