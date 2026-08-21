import type { Toast as SharedToast } from '@nicoflow/shared/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: ToastAction;
}

type Listener = (items: ToastItem[]) => void;

// Module-level queue, not React state — mirrors sonner's model (a `toast.*()`
// call site has no React tree access). The one <Toaster/> mounted in
// _layout.tsx subscribes and re-renders on change; every other call site just
// imports `toast` and fires.
let items: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let nextId = 0;

const DURATION_MS: Record<ToastVariant, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  // Errors linger longer, and longer still with a Retry action so it's not
  // dismissed before the tap lands.
  error: 5000,
};

function notify() {
  listeners.forEach(l => l(items));
}

function dismiss(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  items = items.filter(i => i.id !== id);
  notify();
}

function push(variant: ToastVariant, message: string, action?: ToastAction): string {
  const id = `toast-${++nextId}`;
  items = [...items, { id, variant, message, action }];
  notify();
  timers.set(
    id,
    setTimeout(() => dismiss(id), action ? DURATION_MS[variant] + 2000 : DURATION_MS[variant])
  );
  return id;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => listeners.delete(listener);
}

// Test-only: clears the module-level queue between specs. Without this, a
// toast pushed in one test (and its auto-dismiss timer) leaks into the next,
// since `items`/`listeners` live outside React and aren't reset by
// unmounting a component tree.
export function __resetToastsForTests(): void {
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
  items = [];
  notify();
}

/**
 * Toast API — satisfies @nicoflow/shared's `Toast` interface, so
 * `showErrorToast`/`showSuccessToast` from the shared package work unchanged
 * against it. `errorWithRetry` is the mobile-only extension NIC-1958 needs.
 */
export const toast: SharedToast & { errorWithRetry: (message: string, action: ToastAction) => string } = {
  success: message => push('success', message),
  error: message => push('error', message),
  info: message => push('info', message),
  warning: message => push('warning', message),
  errorWithRetry: (message, action) => push('error', message, action),
};

export { dismiss as dismissToast };
