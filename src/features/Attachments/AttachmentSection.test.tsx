import { Linking } from 'react-native';

import { createAttachmentApi } from '@nicoflow/shared/api';
import type { AttachmentOwnerType, IAttachment } from '@nicoflow/shared/types';
import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';

import { server } from '../../../test/server';

import { AttachmentSection } from './AttachmentSection';

const API = 'http://localhost:8080/v1';

const baseQuery = fetchBaseQuery({ baseUrl: API });
const mockAttachmentApi = createAttachmentApi(baseQuery);

jest.mock('@/lib/store', () => ({
  useGetAttachmentsQuery: (arg: { ownerType: AttachmentOwnerType; ownerId: string }) =>
    mockAttachmentApi.useGetAttachmentsQuery(arg),
  useGetDownloadUrlMutation: () => mockAttachmentApi.useGetDownloadUrlMutation(),
  useDeleteAttachmentMutation: () => mockAttachmentApi.useDeleteAttachmentMutation(),
}));

const attachment = (overrides: Partial<IAttachment> = {}): IAttachment => ({
  id: 'a1',
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'spec.pdf',
  fileSize: 2048,
  mimeType: 'application/pdf',
  createdAt: '2026-09-01T10:00:00Z',
  ...overrides,
});

const respondWith = (items: IAttachment[]) =>
  server.use(http.get(`${API}/attachments`, () => HttpResponse.json({ data: items, error: null })));

const renderSection = async () => {
  const store = configureStore({
    reducer: { [mockAttachmentApi.reducerPath]: mockAttachmentApi.reducer },
    middleware: gDM => gDM().concat(mockAttachmentApi.middleware),
  });
  return render(
    <Provider store={store}>
      <AttachmentSection ownerType="task" ownerId="t1" />
    </Provider>
  );
};

beforeEach(() => jest.clearAllMocks());

describe('AttachmentSection', () => {
  it('renders a row per attachment with its name and formatted size', async () => {
    respondWith([attachment(), attachment({ id: 'a2', fileName: 'photo.png', mimeType: 'image/png', fileSize: 5120 })]);

    await renderSection();

    await waitFor(() => expect(screen.getByTestId('attachment-row-a1')).toBeTruthy());
    expect(screen.getByTestId('attachment-row-a2')).toBeTruthy();
    expect(screen.getByText('spec.pdf')).toBeTruthy();
    expect(screen.getByText('2 KB')).toBeTruthy();
  });

  it('shows the empty state when there are no attachments', async () => {
    respondWith([]);

    await renderSection();

    await waitFor(() => expect(screen.getByTestId('attachment-empty')).toBeTruthy());
  });

  it('shows skeleton rows while the list loads', async () => {
    const spy = jest.spyOn(mockAttachmentApi, 'useGetAttachmentsQuery').mockReturnValue({ isLoading: true } as never);

    await renderSection();

    expect(screen.getByTestId('attachment-loading')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('AttachmentRow delete', () => {
  it('requires a confirm before deleting', async () => {
    respondWith([attachment()]);
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/attachments/:id`, () => {
        deleteCalled = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );

    await renderSection();
    await waitFor(() => expect(screen.getByTestId('attachment-delete-a1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('attachment-delete-a1'));

    // The first press only opens the inline confirm — a hard delete with no undo
    // must never fire straight off one tap.
    expect(deleteCalled).toBe(false);
    expect(screen.getByTestId('attachment-delete-confirm-a1')).toBeTruthy();
  });

  it('restores the actions when the confirm is cancelled', async () => {
    respondWith([attachment()]);

    await renderSection();
    await waitFor(() => expect(screen.getByTestId('attachment-delete-a1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('attachment-delete-a1'));
    await fireEvent.press(screen.getByTestId('attachment-delete-cancel-a1'));

    expect(screen.getByTestId('attachment-delete-a1')).toBeTruthy();
    expect(screen.queryByTestId('attachment-delete-confirm-a1')).toBeNull();
  });

  it('deletes once confirmed', async () => {
    respondWith([attachment()]);
    let deleteCalled = false;
    server.use(
      http.delete(`${API}/attachments/:id`, () => {
        deleteCalled = true;
        return HttpResponse.json({ data: null, error: null });
      })
    );

    await renderSection();
    await waitFor(() => expect(screen.getByTestId('attachment-delete-a1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('attachment-delete-a1'));
    await fireEvent.press(screen.getByTestId('attachment-delete-confirm-a1'));

    await waitFor(() => expect(deleteCalled).toBe(true));
  });
});

describe('AttachmentRow download', () => {
  it('opens the presigned url', async () => {
    respondWith([attachment()]);
    server.use(
      // GET /attachments/{id}/download-url — not a POST to a collection path.
      http.get(`${API}/attachments/:id/download-url`, () =>
        HttpResponse.json({ data: { url: 'https://r2.test/signed' }, error: null })
      )
    );
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await renderSection();
    await waitFor(() => expect(screen.getByTestId('attachment-download-a1')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('attachment-download-a1'));

    // The response field is `url` — NOT `downloadUrl`.
    await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://r2.test/signed'));
    openURL.mockRestore();
  });
});
