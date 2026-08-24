import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { createAnalyticsClient } from '@nicoflow/shared/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import type { ReactNode } from 'react';

import { env } from '@/constants/env';

const CONSENT_STORAGE_KEY = 'nicoflow.analyticsConsent';

// defaultOptIn: false means PostHog captures nothing until consent.optIn()
// is called (AC3) — the SDK still initializes and usePostHog() is always
// safe to call, it just no-ops until then, same as web's E-041 intent.
// Absent apiKey: the provider is skipped entirely and every capture call
// becomes a plain no-op — matches web's E-038/E-041 "absent key = no-op".
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!env.posthogDsn) {
    return <AnalyticsClientProvider posthog={null}>{children}</AnalyticsClientProvider>;
  }

  return (
    <PostHogProvider apiKey={env.posthogDsn} options={{ host: 'https://us.i.posthog.com', defaultOptIn: false }}>
      <PostHogBridge>{children}</PostHogBridge>
    </PostHogProvider>
  );
}

function PostHogBridge({ children }: { children: ReactNode }) {
  const posthog = usePostHog();
  return <AnalyticsClientProvider posthog={posthog}>{children}</AnalyticsClientProvider>;
}

interface AnalyticsContextValue {
  capture: ReturnType<typeof createAnalyticsClient>['capture'];
  optIn: () => void;
  optOut: () => void;
  hasOptedIn: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function AnalyticsClientProvider({
  posthog,
  children,
}: {
  posthog: ReturnType<typeof usePostHog> | null;
  children: ReactNode;
}) {
  // The SDK doesn't expose a synchronous "has the user opted in" getter, so
  // consent state is tracked locally (persisted the same way the theme
  // override is) and used to gate whether optIn() has ever been called.
  const [hasOptedIn, setHasOptedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_STORAGE_KEY).then(stored => {
      if (stored === 'granted') {
        setHasOptedIn(true);
        posthog?.optIn();
      }
    });
  }, [posthog]);

  const value = useMemo<AnalyticsContextValue>(() => {
    if (!posthog) {
      return { capture: () => {}, optIn: () => {}, optOut: () => {}, hasOptedIn: false };
    }
    const client = createAnalyticsClient(posthog);
    return {
      capture: client.capture,
      optIn: () => {
        posthog.optIn();
        setHasOptedIn(true);
        AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
      },
      optOut: () => {
        posthog.optOut();
        setHasOptedIn(false);
        AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
      },
      hasOptedIn,
    };
  }, [posthog, hasOptedIn]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return ctx;
}
