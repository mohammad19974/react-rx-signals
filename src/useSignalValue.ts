import { useEffect, useState, useCallback, useRef } from 'react';
import type { Observable } from 'rxjs';

/**
 * Hook that provides the current value of an observable for use in useEffect dependencies
 * Solves the issue where signals don't trigger useEffect when used directly
 *
 * @param source$ - RxJS Observable to subscribe to
 * @param initial - Initial value before first emission
 * @returns Current value of the observable
 */
export function useSignalValue<T>(source$: Observable<T>, initial: T): T {
  const [currentValue, setCurrentValue] = useState<T>(initial);
  const lastValueRef = useRef<T>(initial);

  // Optimized setter that prevents unnecessary re-renders
  const updateValue = useCallback((newValue: T) => {
    if (!Object.is(lastValueRef.current, newValue)) {
      lastValueRef.current = newValue;
      setCurrentValue(newValue);
    }
  }, []);

  useEffect(() => {
    const subscription = source$.subscribe({
      next: updateValue,
      error: () => {}, // Silent error handling to prevent crashes
    });

    return () => subscription.unsubscribe();
  }, [source$, updateValue]);

  return currentValue;
}
