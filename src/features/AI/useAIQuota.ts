import { useCallback, useState } from 'react';

import { applyServerBlock, deriveQuota, isFeatureDisabled, isQuotaBlocked } from '@nicoflow/shared/utils';

import { useGetAIUsageQuery } from '@/lib/store';

// Reads GET /ai/usage and derives the render decision with the shared pure
// helpers. `hardenFromError` folds an authoritative send failure into the
// derived state: cached counters can lag the server, so a live AI_LIMIT_REACHED
// wins over a stale "ok". Never reimplement the quota math here — it lives in
// @nicoflow/shared/utils so web and mobile agree.
export const useAIQuota = () => {
  const { data: usage, isLoading } = useGetAIUsageQuery();
  const [serverBlocked, setServerBlocked] = useState(false);
  const [featureDisabled, setFeatureDisabled] = useState(false);

  const derived = deriveQuota(usage);
  const quota = serverBlocked ? applyServerBlock(derived) : derived;

  const hardenFromError = useCallback((code: string | undefined) => {
    if (isQuotaBlocked(code)) setServerBlocked(true);
    if (isFeatureDisabled(code)) setFeatureDisabled(true);
  }, []);

  return {
    quota,
    isLoading,
    featureDisabled,
    hardenFromError,
    isExhausted: quota?.state === 'exhausted',
  };
};
