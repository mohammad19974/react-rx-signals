import { useEffect, useRef, type DependencyList } from 'react';
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

  // Update effect ref when dependencies change
  useEffect(() => {
    effectRef.current = effect;
  }, [effect, ...(deps || [])]);

  useEffect(() => {
    const subscription = source$.subscribe((value) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Clean up previous effect
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = undefined;
        }

        // Run new effect
        cleanupRef.current = effectRef.current(value);
      }, delay);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [source$, delay]);
}
