import { useEffect, useRef, useState, useCallback } from 'react';
import type { Observable } from 'rxjs';

/**
 * Hook that provides a callback to manually trigger effects based on signal state
 * Useful for imperative operations that need to respond to signal changes
 *
 * @param source$ - RxJS Observable to track
 * @param callback - Function to call with current signal value

 * @returns Function that when called, executes callback with current signal value
 */
export function useSignalCallback<T, R>(
  source$: Observable<T>,
  callback: (value: T) => R
): () => R {
  const [currentValue, setCurrentValue] = useState<T | undefined>();
  const callbackRef = useRef(callback);
  const hasValueRef = useRef(false);

  // Update callback ref without causing re-subscription
  callbackRef.current = callback;

  // Optimized value updater
  const updateValue = useCallback((newValue: T) => {
    setCurrentValue(newValue);
    hasValueRef.current = true;
  }, []);

  // Subscribe to signal changes
  useEffect(() => {
    const subscription = source$.subscribe({
      next: updateValue,
      error: () => {}, // Silent error handling
    });

    return () => subscription.unsubscribe();
  }, [source$, updateValue]);

  // Memoize the return callback for better performance
  return useCallback(() => {
    if (hasValueRef.current && currentValue !== undefined) {
      try {
        return callbackRef.current(currentValue);
      } catch (error) {
        // Re-throw with more context
        throw new Error(`Signal callback execution failed: ${error}`);
      }
    }
    throw new Error('Signal has not emitted a value yet');
  }, [currentValue]);
}
