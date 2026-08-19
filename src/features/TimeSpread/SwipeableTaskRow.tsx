import { type ITask } from '@nicoflow/shared/types';
import { Check, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  type AlertDialogRef,
} from '@/components/ui/alert-dialog';

import { TaskRow } from './TaskRow';

const SWIPE_THRESHOLD = 64;

function CompleteAction(_progress: SharedValue<number>, drag: SharedValue<number>) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value - 50 }] }));
  return (
    <Reanimated.View style={style} className="w-[50px] items-center justify-center bg-success dark:bg-success-dark rounded-xl">
      <Check size={20} color="#ffffff" />
    </Reanimated.View>
  );
}

function DeleteAction(_progress: SharedValue<number>, drag: SharedValue<number>) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value + 50 }] }));
  return (
    <Reanimated.View style={style} className="w-[50px] items-center justify-center bg-destructive dark:bg-destructive-dark rounded-xl">
      <Trash2 size={20} color="#ffffff" />
    </Reanimated.View>
  );
}

interface SwipeableTaskRowProps {
  task: ITask;
  onToggleStatus: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onCancel: (task: ITask) => void;
  onMarkMissed: (task: ITask) => void;
  onDelete: (task: ITask) => void;
}

// Swipe right (renderLeftActions) completes; swipe left (renderRightActions)
// asks for delete confirmation via AlertDialog before firing onDelete — a
// destructive action must never fire straight off the gesture. Both paths
// close() the row back to rest so a cancelled delete or a completed task
// doesn't sit half-open.
export function SwipeableTaskRow({ task, onToggleStatus, onEdit, onCancel, onMarkMissed, onDelete }: SwipeableTaskRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const alertRef = useRef<AlertDialogRef>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  return (
    <>
      <ReanimatedSwipeable
        ref={swipeableRef}
        leftThreshold={SWIPE_THRESHOLD}
        rightThreshold={SWIPE_THRESHOLD}
        renderLeftActions={CompleteAction}
        renderRightActions={DeleteAction}
        onSwipeableOpen={direction => {
          if (direction === 'left') {
            onToggleStatus(task);
            swipeableRef.current?.close();
          } else {
            setPendingDelete(true);
            alertRef.current?.present();
          }
        }}>
        <TaskRow
          task={task}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onCancel={onCancel}
          onMarkMissed={onMarkMissed}
          onDelete={() => {
            setPendingDelete(true);
            alertRef.current?.present();
          }}
        />
      </ReanimatedSwipeable>

      <AlertDialog
        ref={alertRef}
        onDismiss={() => {
          setPendingDelete(false);
          swipeableRef.current?.close();
        }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) onDelete(task);
              alertRef.current?.dismiss();
            }}>
            Delete
          </AlertDialogAction>
          <AlertDialogCancel onPress={() => alertRef.current?.dismiss()}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialog>
    </>
  );
}
