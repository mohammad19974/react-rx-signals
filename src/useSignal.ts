import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useMemo, useRef, useCallback } from 'react';
import type { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export function useSignal<T>(source$: Observable<T>, initial: T) {
  // Use ref to store current value to avoid recreating getSnapshot
  const currentValueRef = useRef<T>(initial);
  const initialRef = useRef(initial);

  // Update ref if initial changes (for consistency)
  if (!Object.is(initialRef.current, initial)) {
    initialRef.current = initial;
    currentValueRef.current = initial;
  }

  // Memoize subscribe function - only recreate when source$ changes
  const subscribe = useMemo(
    () => (onStoreChange: () => void) => {
      const subscription = source$.subscribe({
        next: (value: T) => {
          // Only trigger re-render if value actually changed
          if (!Object.is(currentValueRef.current, value)) {
            currentValueRef.current = value;
            onStoreChange();
          }
        },
        error: () => {}, // Silent error handling to prevent crashes
      });

      // Get initial value synchronously
      try {
        source$.pipe(take(1)).subscribe((val) => {
          currentValueRef.current = val;
        });
      } catch {
        currentValueRef.current = initialRef.current;
      }

      return () => subscription.unsubscribe();
    },
    [source$] // Only depend on source$, not initial
  );

  // Stable getSnapshot function that doesn't recreate
  const getSnapshot = useCallback(() => {
    return currentValueRef.current;
  }, []);

  // Stable server snapshot
  const getServerSnapshot = useCallback(() => initialRef.current, []);

  return useSyncExternalStore<T>(subscribe, getSnapshot, getServerSnapshot);
}
