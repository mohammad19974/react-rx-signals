import { useEffect, useRef, useCallback, type DependencyList } from 'react';
import type { Observable } from 'rxjs';

/**
 * Hook that runs an effect when signal values change
 * Alternative to useEffect that works seamlessly with signals
 *
 * @param source$ - RxJS Observable to subscribe to
 * @param effect - Effect function that runs when signal changes
 * @param deps - Optional dependency list for effect updates
 */
export function useSignalEffect<T>(
  source$: Observable<T>,
  effect: (value: T) => void | (() => void),
  deps?: DependencyList
): void {
  const effectRef = useRef(effect);
  const cleanupRef = useRef<(() => void) | void>();

  // Update effect ref without causing re-subscription
  effectRef.current = effect;

  // Memoize the subscription callback for better performance
  const handleNext = useCallback((value: T) => {
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
      // Prevent effect errors from breaking subscription
    }
  }, []);

  // Main subscription effect
  useEffect(() => {
    const subscription = source$.subscribe({
      next: handleNext,
      error: () => {}, // Silent error handling
    });

    return () => {
      subscription.unsubscribe();
      // Clean up final effect
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch {
          // Ignore cleanup errors
        }
        cleanupRef.current = undefined;
      }
    };
  }, [source$, handleNext]);

  // Handle dependency changes without re-subscription
  useEffect(() => {
    // Dependencies changed, but we don't need to re-subscribe
    // The effect ref is already updated above
  }, [deps]);
}
