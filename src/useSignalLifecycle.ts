import { useEffect, useRef, useCallback } from 'react';
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
  const callbackRef = useRef(callback);
  const getRef = useRef(get);

  // Update refs without causing re-subscriptions
  callbackRef.current = callback;
  getRef.current = get;

  // Memoize the effect callback to prevent unnecessary re-runs
  const stableCallback = useCallback((current: T) => {
    callbackRef.current(prevRef.current, current);
    prevRef.current = current;
  }, []);

  useEffect(() => {
    const subscription = source$.subscribe({
      next: stableCallback,
      error: () => {}, // Silent error handling
    });

    // Initialize with current value - use try/catch for safety
    try {
      const initial = getRef.current();
      callbackRef.current(undefined, initial);
      prevRef.current = initial;
    } catch {
      // Handle initialization errors gracefully
    }

    return () => subscription.unsubscribe();
  }, [source$, stableCallback]);
}
