import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type { PickedFile } from './validate';

// Why a pick produced nothing. `cancelled` and `denied` are ordinary outcomes,
// not errors — the sheet stays usable and the other sources keep working.
export type PickResult =
  { status: 'picked'; file: PickedFile } | { status: 'cancelled' } | { status: 'denied' } | { status: 'failed' };

// An image asset gives us a uri and (usually) a name; fall back to the uri's last
// segment so a file always has a name to send to confirm.
const nameFromUri = (uri: string, fallback: string): string => {
  const segment = uri.split('/').pop();
  return segment && segment.length > 0 ? segment : fallback;
};

const fromImageAsset = (asset: ImagePicker.ImagePickerAsset): PickedFile => ({
  uri: asset.uri,
  name: asset.fileName ?? nameFromUri(asset.uri, 'photo.jpg'),
  // A camera capture can report no mimeType; the picker is constrained to images
  // and writes JPEG by default, so that is the honest fallback.
  mimeType: asset.mimeType ?? 'image/jpeg',
  size: asset.fileSize ?? 0,
});

export const pickFromCamera = async (): Promise<PickResult> => {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };

    return { status: 'picked', file: fromImageAsset(result.assets[0]) };
  } catch {
    return { status: 'failed' };
  }
};

export const pickFromLibrary = async (): Promise<PickResult> => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };

    return { status: 'picked', file: fromImageAsset(result.assets[0]) };
  } catch {
    return { status: 'failed' };
  }
};

export const pickDocument = async (): Promise<PickResult> => {
  try {
    // The picker is left open to any type rather than filtered to the allowlist:
    // the shared validator produces a specific "this type isn't allowed" message,
    // which is friendlier than a file simply being ungreppable in the picker.
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };

    const asset = result.assets[0];
    return {
      status: 'picked',
      file: {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? 0,
      },
    };
  } catch {
    return { status: 'failed' };
  }
};
