import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Observable } from 'rxjs';

export function useSignal<T>(source$: Observable<T>, initial: T) {
  return useSyncExternalStore<T>(
    (onStoreChange: () => void) => {
      const sub = source$.subscribe(() => onStoreChange());
      return () => sub.unsubscribe();
    },
    () => {
      let current: T = initial;
      source$.subscribe((val) => (current = val)).unsubscribe();
      return current;
    },
    () => initial
  );
}
