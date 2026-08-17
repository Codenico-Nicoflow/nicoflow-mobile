import type { TokenStorage } from '@nicoflow/shared/api/adapters';
import { AUTH_API } from '@nicoflow/shared/types';
import type {
  BaseQueryApi,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

import { env } from '@/constants/env';

// Single global mutex coordinating EVERY refresh-token call in the app so only
// one /refresh-token request is ever in flight. Ported from nicoflow-frontend's
// baseQuery.ts — see that file for the full design rationale (reuse-detection,
// single-flight refresh). The only platform-specific seams here are: no
// `credentials: 'include'` (RN has no cookie jar — the refresh token is read
// from tokenStorage and sent explicitly in the body), the API base URL source,
// and there's no toast/rate-limit UI wiring yet (out of scope for auth screens).
const authMutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
});

export type RefreshOutcome = 'refreshed' | 'failed';

const DEFINITIVE_AUTH_FAILURES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'INVALID_REFRESH_TOKEN']);

const PRE_SESSION_401_ENDPOINTS = new Set<string>([
  AUTH_API.LOGIN,
  AUTH_API.REGISTER,
  AUTH_API.FORGOT_PASSWORD,
  AUTH_API.RESET_PASSWORD,
  AUTH_API.CHANGE_PASSWORD,
]);

// See nicoflow-frontend's baseQuery.ts extractErrorCode for why this reads
// error.data.error.code (rawBaseQuery does not run transformErrorResponse).
const extractErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const readCode = (obj: unknown): string | undefined => {
    if (obj && typeof obj === 'object' && 'code' in obj) {
      const code = (obj as { code?: unknown }).code;
      if (typeof code === 'string') return code;
    }
    return undefined;
  };

  const data = (error as { data?: unknown }).data;
  if (data && typeof data === 'object') {
    const inner = (data as { error?: unknown }).error;
    return readCode(inner) ?? readCode(data) ?? readCode(error);
  }

  return readCode((error as { error?: unknown }).error) ?? readCode(error);
};

let inFlightRefresh: Promise<RefreshOutcome> | null = null;

// Unlike web (HttpOnly cookie the browser attaches automatically), mobile has
// no cookie jar: the raw refresh token must be read from tokenStorage and sent
// explicitly in the body. The backend accepts both (cookie preferred, body
// fallback — nicoflow-api handler.go:119-141), so this is the fallback path.
const refreshSession = async (
  tokenStorage: TokenStorage,
  api: Pick<BaseQueryApi, 'dispatch' | 'getState' | 'signal' | 'abort' | 'endpoint' | 'extra' | 'type'>
): Promise<RefreshOutcome> => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = authMutex.runExclusive(async (): Promise<RefreshOutcome> => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await tokenStorage.clear();
      return 'failed';
    }

    const refreshResult = await rawBaseQuery(
      { url: AUTH_API.REFRESH_TOKEN, method: 'POST', body: { refreshToken } },
      api as BaseQueryApi,
      {}
    );

    if (refreshResult.error) {
      if (refreshResult.error.status === 429) {
        return 'failed';
      }
      const code = extractErrorCode(refreshResult.error);
      if (code !== undefined && DEFINITIVE_AUTH_FAILURES.has(code)) {
        await tokenStorage.clear();
      }
      return 'failed';
    }

    const { token, refreshToken: newRefreshToken } =
      (refreshResult.data as { data?: { token?: string; refreshToken?: string } }).data ?? {};
    if (!token) {
      return 'failed';
    }
    tokenStorage.setAccessToken(token);
    if (newRefreshToken) {
      await tokenStorage.setRefreshToken(newRefreshToken);
    }
    return 'refreshed';
  });

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
};

// Same sanctioned single-flight entry point as web's refreshSessionFromStore —
// non-RTK-Query callers (e.g. a future WebSocket hook) share this mutex rather
// than calling /auth/refresh-token directly.
export const refreshSessionFromStore = async (
  tokenStorage: TokenStorage,
  dispatch: BaseQueryApi['dispatch']
): Promise<string | null> => {
  const controller = new AbortController();
  const outcome = await refreshSession(tokenStorage, {
    dispatch,
    getState: () => ({}),
    signal: controller.signal,
    abort: (reason?: string) => controller.abort(reason),
    endpoint: 'refreshSessionFromStore',
    extra: undefined,
    type: 'query',
  });
  return outcome === 'refreshed' ? tokenStorage.getAccessToken() : null;
};

export const createBaseQueryWithReauth = (
  tokenStorage: TokenStorage,
  onSessionExpired: () => void
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> => {
  const authedRawBaseQuery: typeof rawBaseQuery = (args, api, extraOptions) => {
    const token = tokenStorage.getAccessToken();
    const withAuth =
      typeof args === 'string'
        ? token
          ? { url: args, headers: { authorization: `Bearer ${token}` } }
          : args
        : { ...args, headers: token ? { ...args.headers, authorization: `Bearer ${token}` } : args.headers };
    return rawBaseQuery(withAuth, api, extraOptions);
  };

  return async (args, api, extraOptions) => {
    const url = typeof args === 'string' ? args : args.url;
    if (url === AUTH_API.REFRESH_TOKEN) {
      return authedRawBaseQuery(args, api, extraOptions);
    }

    if (PRE_SESSION_401_ENDPOINTS.has(url)) {
      return authedRawBaseQuery(args, api, extraOptions);
    }

    if (inFlightRefresh) {
      await inFlightRefresh;
    }

    let result = await authedRawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const outcome = await refreshSession(tokenStorage, api);
      if (outcome === 'failed') {
        const stillAuthed = Boolean(tokenStorage.getAccessToken());
        if (!stillAuthed) {
          onSessionExpired();
        }
        return result;
      }
      result = await authedRawBaseQuery(args, api, extraOptions);
    }

    return result;
  };
};
