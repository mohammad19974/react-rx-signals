import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useMemo, useRef, useCallback } from 'react';
import type { Observable } from 'rxjs';
import { take, distinctUntilChanged, takeWhile } from 'rxjs/operators';

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;

/**
 * Simplified and safe useSignal hook with RxJS optimizations
 * - distinctUntilChanged to prevent repetitive values at source level
 * - takeWhile for conditional subscription termination
 * - take(1) for initial value fetching
 * - Fast path optimizations with Object.is comparison
 * - Safe error handling with fallbacks
 *
 * @example Basic usage:
 * ```typescript
 * const count = useSignal(counter$, 0);
 * ```
 *
 * @example With condition (stops when count reaches 10):
 * ```typescript
 * const count = useSignal(counter$, 0, {
 *   condition: (value) => value < 10
 * });
 * ```
 *
 * @example Using utility conditions:
 * ```typescript
 * // Stop when value becomes falsy
 * const value = useSignal(data$, '', {
 *   condition: SignalConditions.whileTruthy
 * });
 *
 * // Stop when value goes above 100
 * const score = useSignal(score$, 0, {
 *   condition: SignalConditions.whileBelow(100)
 * });
 *
 * // Take only first 5 values
 * const limited = useSignal(stream$, null, {
 *   condition: SignalConditions.takeCount(5)
 * });
 * ```
 *
 * @param source$ - The observable to subscribe to
 * @param initial - Initial value to use
 * @param options - Optional configuration
 * @param options.condition - Function to control subscription continuation
 */
export function useSignal<T>(
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
        // Use distinctUntilChanged to prevent repetitive values
        // and takeWhile for conditional termination
        const subscription = source$
          .pipe(
            distinctUntilChanged(STRICT_EQUAL), // Prevent repetitive values at source level
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
              if (!STRICT_EQUAL(currentValueRef.current, value)) {
                currentValueRef.current = value;
                onStoreChange();
              }
            },
            error: (error: unknown) => {
              if (
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development'
              ) {
                console.warn('Signal subscription error:', error);
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
              distinctUntilChanged(STRICT_EQUAL) // Ensure it's distinct from any cached value
            )
            .subscribe({
              next: (val: T) => {
                // Only update if different from current value
                if (!STRICT_EQUAL(currentValueRef.current, val)) {
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

  // Stable getSnapshot function
  const getSnapshot = useCallback(() => currentValueRef.current, []);

  // Stable server snapshot
  const getServerSnapshot = useCallback(() => initialRef.current, []);

  return useSyncExternalStore<T>(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Performance utility: No-op for API compatibility
 */
export function clearSubscriptionPool(): void {
  // No caching to clear
}

/**
 * Performance utility: Get subscription statistics
 */
export function getSubscriptionPoolStats() {
  return {
    cacheSize: 'No caching',
    note: 'All caching disabled to prevent memory leaks and freezing.',
  };
}

/**
 * Utility functions for common takeWhile conditions
 */
export const SignalConditions = {
  /**
   * Take values while they are truthy
   */
  whileTruthy: <T>(value: T): boolean => !!value,

  /**
   * Take values while they are below a threshold
   */
  whileBelow:
    (threshold: number) =>
    (value: number): boolean =>
      value < threshold,

  /**
   * Take values while they are above a threshold
   */
  whileAbove:
    (threshold: number) =>
    (value: number): boolean =>
      value > threshold,

  /**
   * Take values while they match a condition
   */
  whileMatches: <T>(predicate: (value: T) => boolean) => predicate,

  /**
   * Take values for a specific count
   */
  takeCount: (count: number) => {
    let taken = 0;
    return <T>(_value: T): boolean => ++taken <= count;
  },
} as const;
