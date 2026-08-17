interface AppEnv {
  apiUrl: string;
  posthogDsn: string | undefined;
  sentryDsn: string | undefined;
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env: AppEnv = {
  apiUrl: requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
  posthogDsn: process.env.EXPO_PUBLIC_POSTHOG_DSN,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
};
