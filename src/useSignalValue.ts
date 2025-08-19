import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const subscription = source$.subscribe(setCurrentValue);
    return () => subscription.unsubscribe();
  }, [source$]);

  return currentValue;
}
