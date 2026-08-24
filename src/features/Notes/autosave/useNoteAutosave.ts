import { useCallback, useEffect, useRef, useState } from 'react';

import { type ApiErrorBody, type TiptapDoc } from '@nicoflow/shared/types';

import { useUpdateNoteMutation } from '@/lib/store';

import { AUTOSAVE_DEBOUNCE_MS, SaveStatus, type SaveStatusValue } from './types';

export interface NoteDraft {
  title?: string;
  content?: TiptapDoc;
}

export interface UseNoteAutosaveOptions {
  noteId: string;
  initialVersion: number;
  debounceMs?: number;
}

export interface UseNoteAutosaveResult {
  status: SaveStatusValue;
  version: number;
  isConflicted: boolean;
  save: (draft: NoteDraft) => void;
  flush: () => void;
}

// Direct port of web's useNoteAutosave.ts — same debounce/version/terminal-
// conflict semantics, same reasoning: a 409 is TERMINAL, never retried, never
// merged. noteApi's transformErrorResponse (toApiError) unwraps rejections to
// a bare {code, message} — no envelope nesting to unwrap here.
export const useNoteAutosave = ({
  noteId,
  initialVersion,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
}: UseNoteAutosaveOptions): UseNoteAutosaveResult => {
  const [updateNote] = useUpdateNoteMutation();
  const [status, setStatus] = useState<SaveStatusValue>(SaveStatus.IDLE);
  const [version, setVersion] = useState(initialVersion);

  const versionRef = useRef(initialVersion);
  const pendingRef = useRef<NoteDraft | null>(null);
  const conflictedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    versionRef.current = initialVersion;
    setVersion(initialVersion);
    conflictedRef.current = false;
    pendingRef.current = null;
    setStatus(SaveStatus.IDLE);
  }, [noteId, initialVersion]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const send = useCallback(async () => {
    if (conflictedRef.current) return;

    const draft = pendingRef.current;
    if (!draft) return;

    pendingRef.current = null;
    inFlightRef.current = true;
    if (isMountedRef.current) setStatus(SaveStatus.SAVING);

    try {
      const saved = await updateNote({ id: noteId, version: versionRef.current, ...draft }).unwrap();

      versionRef.current = saved.version;
      if (!isMountedRef.current) return;

      setVersion(saved.version);
      setStatus(pendingRef.current ? SaveStatus.UNSAVED : SaveStatus.SAVED);
    } catch (error) {
      const code = (error as ApiErrorBody | undefined)?.code;

      if (code === 'CONFLICT') {
        conflictedRef.current = true;
        pendingRef.current = null;
        clearTimer();
        if (isMountedRef.current) setStatus(SaveStatus.CONFLICT);
      } else {
        pendingRef.current = draft;
        if (isMountedRef.current) setStatus(SaveStatus.ERROR);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [noteId, updateNote]);

  const save = useCallback(
    (draft: NoteDraft) => {
      if (conflictedRef.current) return;

      pendingRef.current = { ...pendingRef.current, ...draft };
      setStatus(current => (current === SaveStatus.UNSAVED ? current : SaveStatus.UNSAVED));

      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void send();
      }, debounceMs);
    },
    [debounceMs, send]
  );

  const flush = useCallback(() => {
    clearTimer();
    if (conflictedRef.current || inFlightRef.current || !pendingRef.current) return;
    void send();
  }, [send]);

  useEffect(
    () => () => {
      clearTimer();
      if (conflictedRef.current || inFlightRef.current || !pendingRef.current) return;
      void send();
    },
    [send]
  );

  return {
    status,
    version,
    isConflicted: status === SaveStatus.CONFLICT,
    save,
    flush,
  };
};
