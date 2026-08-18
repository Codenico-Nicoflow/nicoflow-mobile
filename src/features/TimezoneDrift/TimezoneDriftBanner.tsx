import { detectTimezoneDrift, formatZoneOffset } from '@nicoflow/shared/utils';
import { Globe } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, useColorScheme, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useAppUser, useUpdateProfileMutation } from '@/lib/store';

import { dismissDrift, isDriftDismissed } from './dismissal';

const resolveDeviceTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const zoneLabel = (timezone: string, now: Date): string => {
  const offset = formatZoneOffset(timezone, now);
  const name = timezone.replace(/_/g, ' ');
  return offset ? `${name} (${offset})` : name;
};

// Non-blocking, app-wide banner shown when the device zone disagrees with
// the account zone — arguably more valuable on mobile than web since users
// travel with phones (NIC-1946). Rendered at the tab-shell level rather
// than scoped to a single tab, unlike web's Calendar-page-only placement:
// the drift matters everywhere reminders and scheduled times are shown, not
// just on a calendar grid. Never auto-applies the device zone — that stays
// an explicit choice, same reasoning as web.
export function TimezoneDriftBanner() {
  const user = useAppUser();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [now] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const drift = user?.timezone ? detectTimezoneDrift(user.timezone, resolveDeviceTimeZone(), now) : null;

  useEffect(() => {
    if (!drift) return;
    isDriftDismissed(drift.accountZone, drift.browserZone).then(setDismissed);
    // Re-check dismissal only when the actual drift pair changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drift?.accountZone, drift?.browserZone]);

  if (!drift || dismissed) return null;

  const handleDismiss = () => {
    setIsDismissing(true);
    dismissDrift(drift.accountZone, drift.browserZone).then(() => setDismissed(true));
  };

  const handleUpdate = async () => {
    try {
      await updateProfile({ timezone: drift.browserZone }).unwrap();
      setDismissed(true);
    } catch {
      // An unresolvable zone comes back as a typed error — keep the banner
      // open so the user can still dismiss it. No toast plumbing on mobile
      // yet, so this fails silently rather than half-wiring one.
    }
  };

  const isBusy = isLoading || isDismissing;

  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-3 rounded-xl border border-border dark:border-border-dark bg-muted dark:bg-muted-dark p-4 mx-4 mt-2">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-accent dark:bg-accent-dark">
        <Globe size={18} color={isDark ? '#c7d2fe' : '#4f46e5'} />
      </View>

      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">Timezone mismatch</Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          Your account is set to {zoneLabel(drift.accountZone, now)}, but this device is on{' '}
          {zoneLabel(drift.browserZone, now)}.
        </Text>
        <View className="flex-row gap-2 mt-2">
          <Button
            label={isLoading ? undefined : 'Update to device timezone'}
            size="sm"
            disabled={isBusy}
            onPress={handleUpdate}>
            {isLoading && <ActivityIndicator size="small" />}
          </Button>
          <Pressable onPress={handleDismiss} disabled={isBusy} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark px-2 py-2">Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
