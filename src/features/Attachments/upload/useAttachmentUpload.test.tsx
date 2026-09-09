import { createAttachmentApi } from '@nicoflow/shared/api';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../../test/server';

import { uploadToStorage } from './uploadToStorage';
import { MAX_ATTACHMENTS_PER_OWNER, useAttachmentUpload } from './useAttachmentUpload';
import type { PickedFile } from './validate';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAttachmentApi = createAttachmentApi(baseQuery);

jest.mock('./uploadToStorage', () => ({ uploadToStorage: jest.fn() }));

const mockToastError = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args), success: jest.fn() },
}));

jest.mock('@/lib/store', () => ({
  useGetUploadUrlMutation: () => mockAttachmentApi.useGetUploadUrlMutation(),
  useConfirmAttachmentMutation: () => mockAttachmentApi.useConfirmAttachmentMutation(),
}));

const mockedUpload = uploadToStorage as jest.MockedFunction<typeof uploadToStorage>;

const file = (overrides: Partial<PickedFile> = {}): PickedFile => ({
  uri: 'file:///tmp/a.jpg',
  name: 'a.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
  ...overrides,
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = configureStore({
    reducer: { [mockAttachmentApi.reducerPath]: mockAttachmentApi.reducer },
    middleware: gDM => gDM().concat(mockAttachmentApi.middleware),
  });
  return <Provider store={store}>{children}</Provider>;
};

const renderUpload = (currentCount = 0) =>
  renderHook(() => useAttachmentUpload('task', 't1', currentCount), { wrapper });

beforeEach(() => {
  jest.clearAllMocks();
  mockedUpload.mockResolvedValue(undefined);
});

describe('useAttachmentUpload', () => {
  it('runs upload-url → PUT → confirm and clears the in-flight item', async () => {
    let confirmed: unknown = null;
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({
          data: { url: 'https://r2.test/put', headers: { 'x-amz-meta': '1' }, s3Key: 'key-1' },
          error: null,
        })
      ),
      http.post(`${API}/attachments`, async ({ request }) => {
        confirmed = await request.json();
        return HttpResponse.json({ data: { id: 'a1' }, error: null });
      })
    );

    const { result } = await renderUpload();
    await result.current.upload(file());

    await waitFor(() => expect(confirmed).toEqual({ s3Key: 'key-1', fileName: 'a.jpg' }));
    expect(mockedUpload).toHaveBeenCalledWith(
      file(),
      'https://r2.test/put',
      { 'x-amz-meta': '1' },
      expect.any(Function)
    );
    // The item leaves the in-flight list; the real row arrives via the
    // invalidated attachments query.
    await waitFor(() => expect(result.current.uploads).toHaveLength(0));
  });

  it('rejects a disallowed type before any request is made', async () => {
    let called = false;
    server.use(
      http.post(`${API}/attachments/upload-url`, () => {
        called = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );

    const { result } = await renderUpload();
    await result.current.upload(file({ mimeType: 'image/svg+xml' }));

    expect(called).toBe(false);
    expect(mockedUpload).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
  });

  it('keeps a failed upload visible as an error rather than dropping it silently', async () => {
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null })
      )
    );
    mockedUpload.mockRejectedValue(new Error('network'));

    const { result } = await renderUpload();
    await result.current.upload(file());

    await waitFor(() => expect(result.current.uploads[0]?.status).toBe('error'));
    expect(mockToastError).toHaveBeenCalled();
  });

  it('does not confirm when the storage PUT fails', async () => {
    let confirmCalled = false;
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null })
      ),
      http.post(`${API}/attachments`, () => {
        confirmCalled = true;
        return HttpResponse.json({ data: { id: 'a1' }, error: null });
      })
    );
    mockedUpload.mockRejectedValue(new Error('network'));

    const { result } = await renderUpload();
    await result.current.upload(file());

    // Confirming after a failed PUT would create a row pointing at an object
    // that was never stored.
    await waitFor(() => expect(result.current.uploads[0]?.status).toBe('error'));
    expect(confirmCalled).toBe(false);
  });

  it.each([
    ['PLAN_LIMIT_EXCEEDED', 'attachments.proHint'],
    ['STORAGE_LIMIT_EXCEEDED', 'attachments.storageFull'],
  ])('surfaces %s from the confirm step as an informational message', async code => {
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null })
      ),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json({ data: null, error: { code, message: code } }, { status: 403 })
      )
    );

    const { result } = await renderUpload();
    await result.current.upload(file());

    // The code is retained on the item so the row can reflect why it failed.
    await waitFor(() => expect(result.current.uploads[0]?.errorCode).toBe(code));
    expect(mockToastError).toHaveBeenCalled();
    // Reader-app posture: informs, never sells (E-037).
    expect(String(mockToastError.mock.calls[0][0])).not.toContain('Upgrade to Pro');
  });

  it('retries a failed upload from the retained file, without re-picking', async () => {
    let attempts = 0;
    server.use(
      http.post(`${API}/attachments/upload-url`, () => {
        attempts += 1;
        return HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null });
      }),
      http.post(`${API}/attachments`, () => HttpResponse.json({ data: { id: 'a1' }, error: null }))
    );
    mockedUpload.mockRejectedValueOnce(new Error('network'));

    const { result } = await renderUpload();
    await result.current.upload(file());
    await waitFor(() => expect(result.current.uploads[0]?.status).toBe('error'));

    mockedUpload.mockResolvedValue(undefined);
    await result.current.retry(result.current.uploads[0].id);

    await waitFor(() => expect(result.current.uploads).toHaveLength(0));
    expect(attempts).toBe(2);
  });

  it('removes a failed upload without retrying it', async () => {
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null })
      )
    );
    mockedUpload.mockRejectedValue(new Error('network'));

    const { result } = await renderUpload();
    await result.current.upload(file());
    await waitFor(() => expect(result.current.uploads).toHaveLength(1));

    result.current.remove(result.current.uploads[0].id);

    await waitFor(() => expect(result.current.uploads).toHaveLength(0));
  });

  it('reports progress as bytes go out', async () => {
    server.use(
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/put', headers: {}, s3Key: 'key-1' }, error: null })
      ),
      http.post(`${API}/attachments`, () => HttpResponse.json({ data: { id: 'a1' }, error: null }))
    );
    // Drive the callback the hook passes in, then leave the upload pending so
    // the item is still in the list to assert on.
    let reported = -1;
    mockedUpload.mockImplementation(async (_f, _u, _h, onProgress) => {
      onProgress?.(0.5);
      reported = 0.5;
    });

    const { result } = await renderUpload();
    await result.current.upload(file());

    expect(reported).toBe(0.5);
  });

  it('blocks a pick once the owner is at the count cap', async () => {
    let called = false;
    server.use(
      http.post(`${API}/attachments/upload-url`, () => {
        called = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );

    const { result } = await renderUpload(MAX_ATTACHMENTS_PER_OWNER);
    expect(result.current.isAtCap).toBe(true);

    await result.current.upload(file());

    expect(called).toBe(false);
    expect(mockToastError).toHaveBeenCalled();
  });
});
