import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AnalyticsProvider, useAnalytics } from './AnalyticsProvider';

jest.mock('@/constants/env', () => ({ env: { posthogDsn: undefined } }));

const wrapper = ({ children }: { children: ReactNode }) => <AnalyticsProvider>{children}</AnalyticsProvider>;

// Separate file (own module registry) so the no-key branch — which skips
// PostHogProvider entirely — never shares a React instance with the
// with-key tests. Mixing them via jest.resetModules() mid-suite triggers an
// "Invalid hook call" from a duplicate React copy.
describe('AnalyticsProvider without a PostHog key', () => {
  it('capture and optIn/optOut are safe no-ops', async () => {
    const { result } = await renderHook(() => useAnalytics(), { wrapper });

    expect(() => {
      result.current.capture('app_opened');
      result.current.optIn();
      result.current.optOut();
    }).not.toThrow();
    expect(result.current.hasOptedIn).toBe(false);
  });
});
