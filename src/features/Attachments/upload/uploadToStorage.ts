import * as FileSystem from 'expo-file-system/legacy';

import type { PickedFile } from './validate';

// Uploads the picked file's bytes straight to object storage with the presigned
// PUT the API handed back. The bytes never pass through our API.
//
// PUT, not a POST policy: R2 returns 501 Not Implemented for POST-policy form
// uploads (NIC-1679), so the whole platform standardised on presigned PUT.
//
// uploadAsync streams from the file URI rather than reading it into memory
// first — a fetch() with a Blob would load the whole file into JS memory, which
// is how large-photo uploads OOM on lower-end devices. It lives under the
// `legacy` entry point in SDK 54+; the new File API has no streaming upload.
export const uploadToStorage = async (
  file: PickedFile,
  url: string,
  headers: Record<string, string>
): Promise<void> => {
  const result = await FileSystem.uploadAsync(url, file.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': file.mimeType, ...headers },
  });

  // Storage answers 200/204 on success. Anything else means the object is not
  // there, so confirming would create a row pointing at nothing.
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`upload failed with status ${result.status}`);
  }
};
