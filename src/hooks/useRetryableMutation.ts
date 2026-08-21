import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/toast';

// Any RTK Query mutation trigger: a function returning an object with
// `.unwrap()`. Matches the shape of every `use*Mutation()`'s first tuple
// element without importing RTK's internal generics, which don't unify
// cleanly across mutations with different BaseQuery types.
type UnwrappableTrigger<Arg, Result> = (arg: Arg) => { unwrap: () => Promise<Result> };

/**
 * Wraps an RTK Query mutation trigger with NIC-1958's error/retry pattern:
 * on failure, shows an error toast with a "Retry" action that re-fires the
 * exact same payload. This is the shared pattern every online-only mutation
 * site (bucket capture/process, task create) is meant to consume rather than
 * inventing its own try/catch + toast handling.
 *
 * Returns a `run(arg)` that resolves the mutation's success value, or
 * `undefined` on failure (the failure itself is already surfaced via toast —
 * callers don't need a second catch).
 */
export function useRetryableMutation<Arg, Result>(trigger: UnwrappableTrigger<Arg, Result>) {
  const { t } = useTranslation('common');

  // A ref, not a second useCallback dep, so `run` can call itself on Retry
  // without a self-referential closure tripping the immutability lint.
  const runRef = useRef<(arg: Arg) => Promise<Result | undefined>>(async () => undefined);

  const run = useCallback(
    async (arg: Arg): Promise<Result | undefined> => {
      try {
        return await trigger(arg).unwrap();
      } catch {
        // Re-runs `run(arg)` itself on Retry — the payload is closed over, so
        // a retry always resends exactly what the first attempt sent
        // (AC2), and can itself fail and re-offer Retry (AC3).
        toast.errorWithRetry(t('mutationError'), {
          label: t('actions.retry'),
          onPress: () => {
            void runRef.current(arg);
          },
        });
        return undefined;
      }
    },
    [trigger, t]
  );

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  return run;
}
