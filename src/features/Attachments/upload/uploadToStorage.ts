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
  headers: Record<string, string>,
  // Reports 0..1 as bytes go out. createUploadTask (rather than uploadAsync) is
  // what makes a determinate bar possible — a spinner stops being honest past a
  // second or two on a photo.
  onProgress?: (ratio: number) => void
): Promise<void> => {
  const task = FileSystem.createUploadTask(
    url,
    file.uri,
    {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': file.mimeType, ...headers },
    },
    ({ totalBytesSent, totalBytesExpectedToSend }) => {
      // A zero/unknown total would divide to Infinity or NaN and blow out the
      // bar's width, so only report once the total is known.
      if (totalBytesExpectedToSend > 0) {
        onProgress?.(Math.min(1, totalBytesSent / totalBytesExpectedToSend));
      }
    }
  );

  const result = await task.uploadAsync();
  if (!result) throw new Error('upload was cancelled');

  // Storage answers 200/204 on success. Anything else means the object is not
  // there, so confirming would create a row pointing at nothing.
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`upload failed with status ${result.status}`);
  }
};
