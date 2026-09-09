import { env } from '@/constants/env';

// Derive the WebSocket URL from the same base the REST client uses, so there is
// one source of truth for the API origin. `EXPO_PUBLIC_API_URL` is an http(s)
// origin ending in `/v1`; swap the scheme to ws(s) and append `/ws?token=`.
//
// The token goes in the query string because browsers — and RN's WebSocket —
// cannot set headers on the upgrade request. The API closes with 1008 when it
// is missing or expired.
export const buildWsUrl = (token: string): string =>
  `${env.apiUrl.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
