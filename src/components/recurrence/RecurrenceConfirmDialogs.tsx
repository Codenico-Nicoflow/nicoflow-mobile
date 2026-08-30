import { forwardRef } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  type AlertDialogRef,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Skip-occurrence confirm — reuses AlertDialog (the project's pattern for all
// destructive confirms). The caller owns the ref, present(), and dismiss().
export const SkipOccurrenceDialog = forwardRef<AlertDialogRef, { onConfirm: () => void; onCancel: () => void }>(
  function SkipOccurrenceDialog({ onConfirm, onCancel }, ref) {
    return (
      <AlertDialog ref={ref} onDismiss={onCancel}>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip this occurrence?</AlertDialogTitle>
          <AlertDialogDescription>
            {
              "This occurrence won't be created and its reminder is cancelled. The series keeps running — the next occurrence is unaffected."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={onConfirm}>Skip</AlertDialogAction>
          <AlertDialogCancel onPress={onCancel}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    );
  }
);

// End-series confirm.
export const EndSeriesDialog = forwardRef<AlertDialogRef, { onConfirm: () => void; onCancel: () => void }>(
  function EndSeriesDialog({ onConfirm, onCancel }, ref) {
    return (
      <AlertDialog ref={ref} onDismiss={onCancel}>
        <AlertDialogHeader>
          <AlertDialogTitle>End this recurring series?</AlertDialogTitle>
          <AlertDialogDescription>
            {"Future occurrences won't be created. Past completed tasks are kept. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={onConfirm}>End series</AlertDialogAction>
          <AlertDialogCancel onPress={onCancel}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    );
  }
);
