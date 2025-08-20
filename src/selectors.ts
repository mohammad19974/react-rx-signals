import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';

/**
 * Creates a fine-grained selector that only updates when the selected value changes
 * This helps reduce re-renders by only subscribing to specific parts of state
 */
export function createSelector<T, R>(
  source$: Observable<T>,
  selector: (value: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): Observable<R> {
  const defaultEqualityFn = (a: R, b: R) => Object.is(a, b);
  const equalFn = equalityFn || defaultEqualityFn;

  return source$.pipe(
    map(selector),
    distinctUntilChanged(equalFn),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}

/**
 * Creates multiple selectors at once for better performance
 */
export function createSelectors<T, R extends Record<string, unknown>>(
  source$: Observable<T>,
  selectors: { [K in keyof R]: (value: T) => R[K] },
  equalityFn?: (a: R[keyof R], b: R[keyof R]) => boolean
): { [K in keyof R]: Observable<R[K]> } {
  const result = {} as { [K in keyof R]: Observable<R[K]> };

  for (const key in selectors) {
    result[key] = createSelector(source$, selectors[key], equalityFn);
  }

  return result;
}

/**
 * Shallow equality function for objects
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a == null ||
    b == null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as any)[key], (b as any)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a derived value that depends on multiple signals
 * Only updates when any of the dependencies change
 */
export function createDerived<T, R>(
  source$: Observable<T>,
  deriveFn: (value: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): Observable<R> {
  // Simplified implementation for single dependency
  return source$.pipe(
    map(deriveFn),
    distinctUntilChanged(equalityFn || ((a, b) => Object.is(a, b))),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}

/**
 * Creates a selector with memoization for expensive computations
 */
export function createMemoizedSelector<T, R>(
  source$: Observable<T>,
  selector: (value: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): Observable<R> {
  const cache = new Map<T, R>();

  return source$.pipe(
    map((value) => {
      if (cache.has(value)) {
        return cache.get(value)!;
      }

      const result = selector(value);
      cache.set(value, result);

      // Cleanup cache if it gets too large
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }

      return result;
    }),
    distinctUntilChanged(equalityFn || ((a, b) => Object.is(a, b))),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
