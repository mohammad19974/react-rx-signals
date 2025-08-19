import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useMemo } from 'react';
import type { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export function useStore<T>(source$: Observable<T>, initial: T) {
  // Memoize subscribe function to prevent unnecessary re-subscriptions
  const subscribe = useMemo(
    () => (onStoreChange: () => void) => {
      const subscription = source$.subscribe({
        next: onStoreChange,
        error: () => {}, // Silent error handling to prevent crashes
      });
      return () => subscription.unsubscribe();
    },
    [source$]
  );

  // Memoize snapshot function with optimized value retrieval
  const getSnapshot = useMemo(
    () => () => {
      let current: T = initial;
      try {
        // Use take(1) for more efficient single-value retrieval
        source$.pipe(take(1)).subscribe((val) => {
          current = val;
        });
      } catch {
        // Fallback to initial on error
        current = initial;
      }
      return current;
    },
    [source$, initial]
  );

  // Memoize server snapshot
  const getServerSnapshot = useMemo(() => () => initial, [initial]);

  return useSyncExternalStore<T>(subscribe, getSnapshot, getServerSnapshot);
}
