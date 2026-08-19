import * as Sentry from '@sentry/react-native';

import { env } from '@/constants/env';

// Passing dsn: undefined is a documented no-op — the SDK logs a warning and
// disables native capture, but never throws or sends anything. Matches web's
// E-038 pattern: absent key = silent no-op, safe for local dev.
export function initSentry() {
  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: 1.0,
  });
}
