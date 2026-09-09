import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { pickDocument, pickFromCamera, pickFromLibrary } from './pickers';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const image = ImagePicker as jest.Mocked<typeof ImagePicker>;
const docs = DocumentPicker as jest.Mocked<typeof DocumentPicker>;

beforeEach(() => jest.clearAllMocks());

describe('pickFromCamera', () => {
  it('returns the captured photo', async () => {
    image.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    image.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg', fileSize: 100 }],
    } as never);

    await expect(pickFromCamera()).resolves.toEqual({
      status: 'picked',
      file: { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg', size: 100 },
    });
  });

  it('reports denied without launching the camera', async () => {
    image.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await expect(pickFromCamera()).resolves.toEqual({ status: 'denied' });
    expect(image.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('reports cancelled when the user backs out', async () => {
    image.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    image.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(pickFromCamera()).resolves.toEqual({ status: 'cancelled' });
  });

  it('falls back to a name and mime when the capture reports neither', async () => {
    image.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
    image.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/xyz.jpg', fileSize: 10 }],
    } as never);

    // A camera capture often reports no fileName/mimeType; the confirm call
    // needs a name regardless, so it comes from the uri.
    await expect(pickFromCamera()).resolves.toMatchObject({
      status: 'picked',
      file: { name: 'xyz.jpg', mimeType: 'image/jpeg' },
    });
  });

  it('reports failed instead of throwing', async () => {
    image.requestCameraPermissionsAsync.mockRejectedValue(new Error('boom'));

    await expect(pickFromCamera()).resolves.toEqual({ status: 'failed' });
  });
});

describe('pickFromLibrary', () => {
  it('reports denied without opening the library', async () => {
    image.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await expect(pickFromLibrary()).resolves.toEqual({ status: 'denied' });
    expect(image.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('returns the chosen image', async () => {
    image.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true } as never);
    image.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///b.png', fileName: 'b.png', mimeType: 'image/png', fileSize: 50 }],
    } as never);

    await expect(pickFromLibrary()).resolves.toMatchObject({ status: 'picked', file: { name: 'b.png' } });
  });
});

describe('pickDocument', () => {
  it('returns the chosen document', async () => {
    docs.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///c.pdf', name: 'c.pdf', mimeType: 'application/pdf', size: 200 }],
    } as never);

    await expect(pickDocument()).resolves.toEqual({
      status: 'picked',
      file: { uri: 'file:///c.pdf', name: 'c.pdf', mimeType: 'application/pdf', size: 200 },
    });
  });

  it('needs no permission of its own', async () => {
    docs.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null } as never);

    // The document picker is a system UI that returns only what the user chose,
    // so there is no permission gate to deny — cancelling is the only "no".
    await expect(pickDocument()).resolves.toEqual({ status: 'cancelled' });
    expect(image.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });
});
