import { useEffect, useRef, type DependencyList } from 'react';
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

  // Update effect ref when dependencies change
  useEffect(() => {
    effectRef.current = effect;
  }, [effect, ...(deps || [])]);

  useEffect(() => {
    const subscription = source$.subscribe((value) => {
      // Clean up previous effect
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }

      // Run new effect
      cleanupRef.current = effectRef.current(value);
    });

    return () => {
      subscription.unsubscribe();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [source$]);
}
