import type { TokenStorage } from '@nicoflow/shared/api/adapters';
import { createApi } from '@reduxjs/toolkit/query';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';

import { server } from '../../../../test/server';
import { createBaseQueryWithReauth } from './baseQuery';

const API = 'http://localhost:8080/v1';

function makeTokenStorage(initialAccessToken: string | null, refreshToken: string | null): TokenStorage {
  let accessToken = initialAccessToken;
  let storedRefreshToken = refreshToken;
  return {
    getAccessToken: () => accessToken,
    setAccessToken: token => {
      accessToken = token;
    },
    getRefreshToken: async () => storedRefreshToken,
    setRefreshToken: async token => {
      storedRefreshToken = token;
    },
    clear: async () => {
      accessToken = null;
      storedRefreshToken = null;
    },
  };
}

function buildTestApi(tokenStorage: TokenStorage, onSessionExpired: () => void) {
  const baseQuery = createBaseQueryWithReauth(tokenStorage, onSessionExpired);
  return createApi({
    reducerPath: 'testApi',
    baseQuery,
    endpoints: builder => ({
      getThing: builder.query<unknown, string>({ query: id => `/protected-thing/${id}` }),
    }),
  });
}

describe('createBaseQueryWithReauth — refresh mutex', () => {
  it('fires exactly one refresh call for two concurrent 401s, both requests retry after', async () => {
    let refreshCalls = 0;
    let protectedCalls = 0;

    server.use(
      http.get(`${API}/protected-thing/:id`, ({ request }) => {
        protectedCalls += 1;
        const authHeader = request.headers.get('authorization');
        if (authHeader === 'Bearer new-token') {
          return HttpResponse.json({ data: { ok: true }, error: null });
        }
        return HttpResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
      }),
      http.post(`${API}/auth/refresh-token`, async () => {
        refreshCalls += 1;
        return HttpResponse.json({ data: { token: 'new-token', refreshToken: 'new-refresh' }, error: null });
      })
    );

    const tokenStorage = makeTokenStorage('old-token', 'refresh-token');
    const onSessionExpired = jest.fn();
    const testApi = buildTestApi(tokenStorage, onSessionExpired);

    const store = configureStore({
      reducer: { [testApi.reducerPath]: testApi.reducer },
      middleware: gDM => gDM().concat(testApi.middleware),
    });

    const [first, second] = await Promise.all([
      store.dispatch(testApi.endpoints.getThing.initiate('a', { forceRefetch: true })),
      store.dispatch(testApi.endpoints.getThing.initiate('b', { forceRefetch: true })),
    ]);

    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBeGreaterThanOrEqual(3);
    expect('data' in first ? first.data : undefined).toEqual({ data: { ok: true }, error: null });
    expect('data' in second ? second.data : undefined).toEqual({ data: { ok: true }, error: null });
    expect(tokenStorage.getAccessToken()).toBe('new-token');
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('bounces to sign-in only on a definitive auth failure, not a transient one', async () => {
    server.use(
      http.get(`${API}/protected-thing/:id`, () =>
        HttpResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
      ),
      http.post(`${API}/auth/refresh-token`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' } },
          { status: 401 }
        )
      )
    );

    const tokenStorage = makeTokenStorage('old-token', 'refresh-token');
    const onSessionExpired = jest.fn();
    const testApi = buildTestApi(tokenStorage, onSessionExpired);

    const store = configureStore({
      reducer: { [testApi.reducerPath]: testApi.reducer },
      middleware: gDM => gDM().concat(testApi.middleware),
    });

    await store.dispatch(testApi.endpoints.getThing.initiate('a', { forceRefetch: true }));

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
