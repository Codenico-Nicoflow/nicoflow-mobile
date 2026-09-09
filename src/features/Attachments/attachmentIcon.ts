import { FileArchive, FileImage, FileSpreadsheet, FileText, FileType, type LucideIcon } from 'lucide-react-native';

// Maps a MIME type to the icon shown on an attachment row. Buckets the backend
// allowlist into image / pdf / sheet / doc / archive / generic — a visual cue,
// not a security decision (that lives in the upload allowlist). Same mapping as
// web's attachmentIcon.ts.
export const iconForMime = (mimeType: string): LucideIcon => {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileType;
  if (mimeType === 'application/zip') return FileArchive;
  if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.ms-excel' || mimeType === 'text/csv')
    return FileSpreadsheet;
  return FileText; // word docs, text/plain, and any generic fallback
};
