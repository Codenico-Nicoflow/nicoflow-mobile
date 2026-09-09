import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dynamic layer over app.json. Everything static stays there; this only adds the
// parts that must vary by build profile.
//
// Cleartext HTTP: Android API 28+ blocks plain http:// at the platform level, so
// a dev build talking to a local API (emulator alias or LAN address) cannot
// connect at all without this. It is scoped to non-production builds
// deliberately — shipping it in a release would weaken the store build to solve
// a development problem. EAS sets EAS_BUILD_PROFILE; local runs are dev too.
//
// Set through expo-build-properties rather than `android.usesCleartextTraffic`:
// that key is a valid manifest property and resolves correctly at runtime, but
// is absent from @expo/config-types, so writing it directly fails type-check.
export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production';

  return {
    ...config,
    name: config.name ?? 'Nicoflow',
    slug: config.slug ?? 'nicoflow-mobile',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic: !isProduction } }],
    ],
  };
};
