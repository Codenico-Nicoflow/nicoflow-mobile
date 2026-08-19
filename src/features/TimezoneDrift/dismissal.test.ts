import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearDriftDismissal, dismissDrift, isDriftDismissed } from './dismissal';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('timezone drift dismissal', () => {
  it('is not dismissed by default', async () => {
    await expect(isDriftDismissed('Asia/Jerusalem', 'America/New_York')).resolves.toBe(false);
  });

  it('dismissing a pair suppresses only that exact pair', async () => {
    await dismissDrift('Asia/Jerusalem', 'America/New_York');

    await expect(isDriftDismissed('Asia/Jerusalem', 'America/New_York')).resolves.toBe(true);
    await expect(isDriftDismissed('Asia/Jerusalem', 'Europe/London')).resolves.toBe(false);
  });

  it('a new mismatching pair (e.g. after travel) is not suppressed by an old dismissal', async () => {
    await dismissDrift('Asia/Jerusalem', 'America/New_York');

    await expect(isDriftDismissed('Asia/Jerusalem', 'Europe/Paris')).resolves.toBe(false);
  });

  it('clearDriftDismissal removes the record', async () => {
    await dismissDrift('Asia/Jerusalem', 'America/New_York');
    await clearDriftDismissal();

    await expect(isDriftDismissed('Asia/Jerusalem', 'America/New_York')).resolves.toBe(false);
  });
});
