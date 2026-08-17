import { en } from '@nicoflow/shared/i18n';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const errorMessages = en.errors;

type ErrorMessageKey = keyof typeof errorMessages;

const isErrorMessageKey = (key: string): key is ErrorMessageKey =>
  Object.prototype.hasOwnProperty.call(errorMessages, key);

// Ported from nicoflow-frontend's getApiErrorCode (src/lib/utils/utils/helpers.ts) —
// same shape-detection logic, unchanged. See that file for the full priority-order
// rationale (unwrapped envelope vs. FetchBaseQueryError vs. network error vs. string).
export function getApiErrorCode(err: unknown): string | undefined {
  if (err === null || typeof err !== 'object') {
    return typeof err === 'string' ? err : undefined;
  }

  const obj = err as Record<string, unknown>;

  if (typeof obj['error'] === 'object' && obj['error'] !== null) {
    const inner = obj['error'] as Record<string, unknown>;
    if (typeof inner['code'] === 'string') return inner['code'];
  }

  if ('status' in obj && typeof obj['data'] === 'object' && obj['data'] !== null) {
    const data = obj['data'] as Record<string, unknown>;
    if (typeof data['error'] === 'object' && data['error'] !== null) {
      const inner = data['error'] as Record<string, unknown>;
      if (typeof inner['code'] === 'string') return inner['code'];
    }
    if (typeof data['error'] === 'string') return data['error'];
  }

  if ('status' in obj && typeof obj['error'] === 'string') return obj['error'];

  if (typeof obj['message'] === 'string') return obj['message'];

  return undefined;
}

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

// No i18n instance on mobile yet (out of scope for this ticket) — resolves
// against the EN error-message map directly. Swap for a real i18next lookup
// once mobile i18n is wired (mirrors web's resolveErrorMessage).
export function resolveApiErrorMessage(err: unknown): string {
  const code = getApiErrorCode(err);
  if (code && isErrorMessageKey(code)) {
    return errorMessages[code];
  }
  return errorMessages.GENERAL_ERROR;
}
