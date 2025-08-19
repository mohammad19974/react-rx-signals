import { useEffect, useRef, useState, type DependencyList } from 'react';
import type { Observable } from 'rxjs';

/**
 * Hook that provides a callback to manually trigger effects based on signal state
 * Useful for imperative operations that need to respond to signal changes
 *
 * @param source$ - RxJS Observable to track
 * @param callback - Function to call with current signal value
 * @param deps - Optional dependency list for callback updates
 * @returns Function that when called, executes callback with current signal value
 */
export function useSignalCallback<T, R>(
  source$: Observable<T>,
  callback: (value: T) => R,
  deps?: DependencyList
): () => R {
  const [currentValue, setCurrentValue] = useState<T | undefined>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...(deps || [])]);

  // Subscribe to signal changes
  useEffect(() => {
    const subscription = source$.subscribe(setCurrentValue);
    return () => subscription.unsubscribe();
  }, [source$]);

  return () => {
    if (currentValue !== undefined) {
      return callbackRef.current(currentValue);
    }
    throw new Error('Signal has not emitted a value yet');
  };
}
