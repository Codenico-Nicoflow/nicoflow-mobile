import { ATTACHMENT_MAX_BYTES, type PickedFile, validatePickedFile } from './validate';

const file = (overrides: Partial<PickedFile> = {}): PickedFile => ({
  uri: 'file:///tmp/photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
  ...overrides,
});

describe('validatePickedFile', () => {
  it.each(['image/jpeg', 'image/png', 'application/pdf', 'text/csv', 'application/zip'])(
    'accepts %s from the shared allowlist',
    mimeType => {
      expect(validatePickedFile(file({ mimeType }))).toBeNull();
    }
  );

  it.each(['image/svg+xml', 'text/html', 'application/x-msdownload', 'application/octet-stream'])(
    'rejects %s',
    mimeType => {
      // SVG in particular is deliberately absent from the allowlist — it can
      // carry script. Mobile must never be more permissive than web.
      expect(validatePickedFile(file({ mimeType }))).toBe('MIME_NOT_ALLOWED');
    }
  );

  it('reports an empty file as EMPTY_FILE, not SIZE_EXCEEDED', () => {
    // Order matters — a 0-byte file is empty, not oversized.
    expect(validatePickedFile(file({ size: 0 }))).toBe('EMPTY_FILE');
  });

  it('rejects a file over the cap', () => {
    expect(validatePickedFile(file({ size: ATTACHMENT_MAX_BYTES + 1 }))).toBe('SIZE_EXCEEDED');
  });

  it('accepts a file exactly at the cap', () => {
    expect(validatePickedFile(file({ size: ATTACHMENT_MAX_BYTES }))).toBeNull();
  });

  it('checks the type before the size, so a disallowed huge file reports its type', () => {
    expect(validatePickedFile(file({ mimeType: 'text/html', size: ATTACHMENT_MAX_BYTES + 1 }))).toBe(
      'MIME_NOT_ALLOWED'
    );
  });
});
