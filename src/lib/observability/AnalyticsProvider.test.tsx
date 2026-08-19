import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AnalyticsProvider, useAnalytics } from './AnalyticsProvider';

const mockCapture = jest.fn();
const mockOptIn = jest.fn();
const mockOptOut = jest.fn();

jest.mock('posthog-react-native', () => ({
  PostHogProvider: ({ children }: { children: ReactNode }) => children,
  usePostHog: () => ({ capture: mockCapture, optIn: mockOptIn, optOut: mockOptOut }),
}));
jest.mock('@/constants/env', () => ({ env: { posthogDsn: 'phc_test_key' } }));

const wrapper = ({ children }: { children: ReactNode }) => <AnalyticsProvider>{children}</AnalyticsProvider>;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCapture.mockClear();
  mockOptIn.mockClear();
  mockOptOut.mockClear();
});

// AC3/AC4's actual gating happens inside the PostHog SDK itself via
// defaultOptIn: false (options passed to PostHogProvider) — a mocked
// usePostHog() can't prove the SDK's internal drop behavior, only that this
// provider wires consent through correctly: optIn()/optOut() call the real
// SDK methods, a restored consent calls optIn() on mount, and capture()
// always forwards to the (consent-respecting) SDK rather than gating twice.
describe('AnalyticsProvider', () => {
  it('capture forwards to the SDK client unconditionally (SDK owns the gate)', async () => {
    const { result } = await renderHook(() => useAnalytics(), { wrapper });

    result.current.capture('app_opened');

    expect(mockCapture).toHaveBeenCalledWith('app_opened', undefined);
  });

  it('optIn calls posthog.optIn and updates hasOptedIn', async () => {
    const { result } = await renderHook(() => useAnalytics(), { wrapper });

    result.current.optIn();

    expect(mockOptIn).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.hasOptedIn).toBe(true));
  });

  it('optOut calls posthog.optOut and updates hasOptedIn', async () => {
    const { result } = await renderHook(() => useAnalytics(), { wrapper });

    result.current.optOut();

    expect(mockOptOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.hasOptedIn).toBe(false));
  });

  it('restores a previously granted consent on mount by calling optIn', async () => {
    await AsyncStorage.setItem('nicoflow.analyticsConsent', 'granted');

    await renderHook(() => useAnalytics(), { wrapper });

    await waitFor(() => expect(mockOptIn).toHaveBeenCalledTimes(1));
  });

  it('does not call optIn on mount when no consent was ever granted', async () => {
    await renderHook(() => useAnalytics(), { wrapper });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockOptIn).not.toHaveBeenCalled();
  });
});

