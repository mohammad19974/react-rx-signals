import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useMemo, useRef, useCallback } from 'react';
import type { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

// Fast shallow equality check for objects
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(a[key as keyof T], b[key as keyof T])
    ) {
      return false;
    }
  }

  return true;
}

export function useStore<T>(source$: Observable<T>, initial: T) {
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
          // Use appropriate equality check based on type
          const hasChanged =
            typeof value === 'object' && value !== null
              ? !shallowEqual(currentValueRef.current as any, value as any)
              : !Object.is(currentValueRef.current, value);

          if (hasChanged) {
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
