import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { requestPushToken } from './registerPushToken';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));
jest.mock('expo-application', () => ({
  getAndroidId: jest.fn(() => 'android-device-1'),
  getIosIdForVendorAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'p1' } } } }));

const mocked = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
  (Device as { isDevice: boolean }).isDevice = true;
});

describe('requestPushToken', () => {
  it('returns the token when permission is already granted', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
    mocked.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never);

    await expect(requestPushToken()).resolves.toEqual({
      status: 'registered',
      token: 'ExponentPushToken[abc]',
      deviceId: 'android-device-1',
    });
    // Already granted → never re-prompt.
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when permission is undecided and can be asked', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    mocked.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mocked.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never);

    await expect(requestPushToken()).resolves.toMatchObject({ status: 'registered' });
    expect(mocked.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('reports denied without crashing when the user refuses', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
    mocked.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await expect(requestPushToken()).resolves.toEqual({ status: 'denied' });
    expect(mocked.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('does not re-prompt a standing denial', async () => {
    // Re-asking is a no-op on iOS anyway, and hostile besides.
    mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);

    await expect(requestPushToken()).resolves.toEqual({ status: 'denied' });
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports unsupported on a simulator without asking for permission', async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    await expect(requestPushToken()).resolves.toEqual({ status: 'unsupported' });
    expect(mocked.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports failed instead of throwing when the token request errors', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
    mocked.getExpoPushTokenAsync.mockRejectedValue(new Error('network down'));

    // Push is an enhancement — a failure here must never break app startup.
    await expect(requestPushToken()).resolves.toEqual({ status: 'failed' });
  });
});
