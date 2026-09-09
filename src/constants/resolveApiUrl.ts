import { Platform } from 'react-native';

// Hosts that mean "this machine" from the app's point of view. On a device or
// emulator that is the phone itself, not the developer's laptop.
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

// The Android emulator reaches its host machine through this alias — 10.0.2.2 is
// mapped to the host's loopback by the emulator's NAT.
const ANDROID_EMULATOR_HOST = '10.0.2.2';

// resolveApiUrl rewrites a loopback API host for the platform actually running.
//
// `http://localhost:8080/v1` works on the iOS simulator, which shares the host's
// network stack, and on web. On Android it does NOT: `localhost` resolves to the
// emulator's own loopback, so every request fails to connect and the app looks
// like it has no backend — including sign-in. That is the bug this fixes.
//
// A PHYSICAL Android device is a third case: 10.0.2.2 is an emulator-only alias
// and means nothing there, so a real device needs the host machine's LAN address.
// Set EXPO_PUBLIC_API_URL to that address (e.g. http://192.168.1.20:8080/v1) and
// this passes it straight through — only loopback hosts are ever rewritten, so a
// LAN, staging or production URL is never redirected.
export const resolveApiUrl = (rawUrl: string, platform: string = Platform.OS): string => {
  if (platform !== 'android') return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!LOOPBACK_HOSTS.includes(url.hostname)) return rawUrl;

    url.hostname = ANDROID_EMULATOR_HOST;
    return url.toString().replace(/\/$/, '');
  } catch {
    // A malformed URL is a configuration problem for the caller to surface, not
    // something to mangle further here.
    return rawUrl;
  }
};
