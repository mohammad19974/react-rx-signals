import { useEffect, useRef, useCallback, type DependencyList } from 'react';
import type { Observable } from 'rxjs';

/**
 * Hook that debounces signal changes for use in effects
 * Prevents excessive effect executions when signals change rapidly
 *
 * @param source$ - RxJS Observable to subscribe to
 * @param effect - Effect function that runs after debounce delay
 * @param delay - Debounce delay in milliseconds
 * @param deps - Optional dependency list for effect updates
 */
export function useDebouncedSignalEffect<T>(
  source$: Observable<T>,
  effect: (value: T) => void | (() => void),
  delay: number,
  deps?: DependencyList
): void {
  const effectRef = useRef(effect);
  const cleanupRef = useRef<(() => void) | void>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<T>();

  // Update effect ref without causing re-subscription
  effectRef.current = effect;

  // Optimized debounced handler
  const debouncedHandler = useCallback(
    (value: T) => {
      lastValueRef.current = value;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout with error handling
      timeoutRef.current = setTimeout(() => {
        // Clean up previous effect
        if (cleanupRef.current) {
          try {
            cleanupRef.current();
          } catch {
            // Ignore cleanup errors
          }
          cleanupRef.current = undefined;
        }

        // Run new effect with error boundary
        try {
          cleanupRef.current = effectRef.current(value);
        } catch {
          // Prevent effect errors from breaking subsequent calls
        }
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    const subscription = source$.subscribe({
      next: debouncedHandler,
      error: () => {}, // Silent error handling
    });

    return () => {
      subscription.unsubscribe();

      // Clear pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      // Final cleanup
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch {
          // Ignore cleanup errors
        }
        cleanupRef.current = undefined;
      }
    };
  }, [source$, debouncedHandler]);

  // Handle dependency changes without re-subscription
  useEffect(() => {
    // Dependencies changed, effect ref is already updated above
  }, [deps]);
}
