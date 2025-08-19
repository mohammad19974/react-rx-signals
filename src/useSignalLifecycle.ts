import { useEffect, useRef } from 'react';
import type { Observable } from 'rxjs';

/**
 * Track lifecycle of a signal or store field
 * @param source$ - RxJS Observable (signal or store selector)
 * @param get - function to get the current value
 * @param callback - function called with (prev, current) on each update
 */
export function useSignalLifecycle<T>(
  source$: Observable<T>,
  get: () => T,
  callback: (prev: T | undefined, current: T) => void
) {
  const prevRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    const subscription = source$.subscribe((current) => {
      callback(prevRef.current, current);
      prevRef.current = current;
    });

    // Initialize with current value
    const initial = get();
    callback(undefined, initial);
    prevRef.current = initial;

    return () => subscription.unsubscribe();
  }, [source$, get, callback]);
}
