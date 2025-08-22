import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useMemo, useRef, useCallback } from 'react';
import type { Observable } from 'rxjs';
import { take, distinctUntilChanged, takeWhile } from 'rxjs/operators';

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;
const HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;

// Fast shallow equality check for objects
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (STRICT_EQUAL(a, b)) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !HAS_OWN_PROPERTY.call(b, key) ||
      !STRICT_EQUAL(a[key as keyof T], b[key as keyof T])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Enhanced useStore hook with RxJS optimizations
 * - distinctUntilChanged to prevent repetitive values at source level
 * - takeWhile for conditional subscription termination
 * - take(1) for initial value fetching
 * - Fast shallow equality for objects, Object.is for primitives
 * - Safe error handling with fallbacks
 *
 * @example Basic usage:
 * ```typescript
 * const user = useStore(userStore$, { id: 0, name: '' });
 * ```
 *
 * @example With condition (stops when user becomes inactive):
 * ```typescript
 * const user = useStore(userStore$, { id: 0, name: '', active: true }, {
 *   condition: (user) => user.active
 * });
 * ```
 *
 * @example Using utility conditions:
 * ```typescript
 * // Stop when store becomes falsy
 * const data = useStore(dataStore$, null, {
 *   condition: StoreConditions.whileTruthy
 * });
 *
 * // Stop when specific property changes
 * const state = useStore(appState$, initialState, {
 *   condition: StoreConditions.whilePropertyEquals('status', 'loading')
 * });
 * ```
 *
 * @param source$ - The observable store to subscribe to
 * @param initial - Initial value to use
 * @param options - Optional configuration
 * @param options.condition - Function to control subscription continuation
 */
export function useStore<T>(
  source$: Observable<T>,
  initial: T,
  options?: {
    condition?: (value: T) => boolean; // Optional condition for takeWhile
  }
): T {
  // Simple refs without complex initialization
  const currentValueRef = useRef<T>(initial);
  const initialRef = useRef<T>(initial);

  // Update refs if initial changes
  if (!STRICT_EQUAL(initialRef.current, initial)) {
    initialRef.current = initial;
    currentValueRef.current = initial;
  }

  // Optimized subscribe function with RxJS operators
  const subscribe = useMemo(
    () => (onStoreChange: () => void) => {
      try {
        // Use distinctUntilChanged with appropriate equality function
        // and takeWhile for conditional termination
        const subscription = source$
          .pipe(
            distinctUntilChanged((prev: T, curr: T) => {
              // Use appropriate equality check based on type
              if (
                typeof prev === 'object' &&
                prev !== null &&
                typeof curr === 'object' &&
                curr !== null
              ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return shallowEqual(prev as any, curr as any);
              }
              return STRICT_EQUAL(prev, curr);
            }),
            takeWhile((value: T) => {
              // Use custom condition if provided, otherwise always continue
              if (options?.condition) {
                return options.condition(value);
              }
              // Default: continue subscription while component is mounted
              return true;
            })
          )
          .subscribe({
            next: (value: T) => {
              // Double-check at component level (defense in depth)
              const hasChanged =
                typeof value === 'object' && value !== null
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    !shallowEqual(currentValueRef.current as any, value as any)
                  : !STRICT_EQUAL(currentValueRef.current, value);

              if (hasChanged) {
                currentValueRef.current = value;
                onStoreChange();
              }
            },
            error: (error: unknown) => {
              if (
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development'
              ) {
                console.warn('Store subscription error:', error);
              }
              // Fallback to initial value
              currentValueRef.current = initialRef.current;
              onStoreChange();
            },
          });

        // Get initial value synchronously with take(1) and distinctUntilChanged
        try {
          source$
            .pipe(
              take(1), // Take only the first value
              distinctUntilChanged((prev: T, curr: T) => {
                if (
                  typeof prev === 'object' &&
                  prev !== null &&
                  typeof curr === 'object' &&
                  curr !== null
                ) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return shallowEqual(prev as any, curr as any);
                }
                return STRICT_EQUAL(prev, curr);
              })
            )
            .subscribe({
              next: (val: T) => {
                // Only update if different from current value
                const hasChanged =
                  typeof val === 'object' && val !== null
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      !shallowEqual(currentValueRef.current as any, val as any)
                    : !STRICT_EQUAL(currentValueRef.current, val);

                if (hasChanged) {
                  currentValueRef.current = val;
                }
              },
              error: () => {
                currentValueRef.current = initialRef.current;
              },
            });
        } catch (syncError) {
          currentValueRef.current = initialRef.current;
        }

        // Simple cleanup
        return () => {
          try {
            subscription.unsubscribe();
          } catch (cleanupError) {
            // Silent cleanup errors in production
          }
        };
      } catch (subscribeError) {
        // Fallback to initial value
        currentValueRef.current = initialRef.current;
        return () => {}; // No-op cleanup
      }
    },
    [source$, options] // Depend on source$ and entire options object
  );

  // Stable getSnapshot function that doesn't recreate
  const getSnapshot = useCallback(() => {
    return currentValueRef.current;
  }, []);

  // Stable server snapshot
  const getServerSnapshot = useCallback(() => initialRef.current, []);

  return useSyncExternalStore<T>(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Utility functions for common store takeWhile conditions
 */
export const StoreConditions = {
  /**
   * Take values while they are truthy
   */
  whileTruthy: <T>(value: T): boolean => !!value,

  /**
   * Take values while a specific property equals a value
   */
  whilePropertyEquals:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, any>, K extends keyof T>(
        property: K,
        expectedValue: T[K]
      ) =>
      (value: T): boolean =>
        STRICT_EQUAL(value[property], expectedValue),

  /**
   * Take values while a specific property is truthy
   */
  whilePropertyTruthy:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, any>, K extends keyof T>(property: K) =>
      (value: T): boolean =>
        !!value[property],

  /**
   * Take values while all specified properties are truthy
   */
  whilePropertiesTruthy:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, any>>(...properties: (keyof T)[]) =>
      (value: T): boolean =>
        properties.every((prop) => !!value[prop]),

  /**
   * Take values while store matches a condition
   */
  whileMatches: <T>(predicate: (value: T) => boolean) => predicate,

  /**
   * Take values for a specific count
   */
  takeCount: (count: number) => {
    let taken = 0;
    return <T>(_value: T): boolean => ++taken <= count;
  },

  /**
   * Take values while store has a specific structure
   */
  whileHasProperty:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, any>>(property: keyof T) =>
      (value: T): boolean =>
        property in value && value[property] !== undefined,
} as const;
