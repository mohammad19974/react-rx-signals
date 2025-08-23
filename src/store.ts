import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

type Updater<T> = (prev: T) => T;

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;
const SHARE_REPLAY_CONFIG = Object.freeze({ bufferSize: 1, refCount: true });
const HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;

// Advanced LRU cache for store selectors with automatic cleanup
class FastSelectorCache<K, V> {
  private cache = new Map<K, V>();
  private accessOrder = new Map<K, number>();
  private maxSize = 200; // Larger cache for stores
  private accessCounter = 0;

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value) {
      // Update access order for LRU
      this.accessOrder.set(key, ++this.accessCounter);
    }

    return value;
  }

  set(key: K, value: V): void {
    // Cleanup if cache is full using LRU eviction
    if (this.cache.size >= this.maxSize) {
      let oldestKey: K | undefined;
      let oldestAccess = Infinity;

      for (const [k, access] of this.accessOrder) {
        if (access < oldestAccess) {
          oldestAccess = access;
          oldestKey = k;
        }
      }

      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance for store selectors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalSelectorCache = new WeakMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BehaviorSubject<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FastSelectorCache<PropertyKey, Observable<any>>
>();

// Simplified without pooling to prevent memory leaks

// Ultra-fast shallow equality check with multiple optimization strategies
function shallowEqual<T extends object>(a: T, b: T): boolean {
  // Fast path: reference equality
  if (STRICT_EQUAL(a, b)) return true;

  // Fast path: null/undefined checks
  if (a == null || b == null) return false;

  // Fast path: type checks
  if (typeof a !== typeof b) return false;

  // Get keys with minimal allocations
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Fast path: different key counts
  if (keysA.length !== keysB.length) return false;

  // Optimized comparison loop with early termination
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];

    // Check key existence and value equality in one pass
    if (
      !HAS_OWN_PROPERTY.call(b, key) ||
      !STRICT_EQUAL(a[key as keyof T], b[key as keyof T])
    ) {
      return false;
    }
  }

  return true;
}

// Fast path object merging with minimal allocations
function fastMerge<T extends object>(prev: T, update: Partial<T>): T {
  const result = { ...prev };
  const updateKeys = Object.keys(update);

  // Optimized property assignment
  for (let i = 0; i < updateKeys.length; i++) {
    const key = updateKeys[i] as keyof T;
    result[key] = update[key] as T[keyof T];
  }

  return result;
}

/**
 * Creates a highly optimized store with maximum performance and comprehensive error handling
 * - Ultra-fast shallow equality checking
 * - Advanced LRU caching for selectors
 * - Optimized object merging strategies
 * - Pooled setter functions for reuse
 * - Pre-compiled observable pipelines
 * - Comprehensive error handling with fallbacks
 * - Memory leak prevention
 */
export function createStore<T extends object>(initial: T) {
  try {
    // Validate input
    if (!initial || typeof initial !== 'object') {
      throw new Error('Store initial value must be a non-null object');
    }

    const subject = new BehaviorSubject<T>(initial);

    // Ultra-fast pre-bound methods with error handling
    const getValue = () => {
      try {
        return subject.getValue();
      } catch (error) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.warn('Store getValue error, returning initial value:', error);
        }
        return initial;
      }
    };

    const subjectNext = subject.next;

    // Simplified setter without pooling to prevent memory leaks
    const setter = (update: Partial<T> | Updater<T>) => {
      try {
        const prev = getValue();
        let newValue: T;

        try {
          // Ultra-fast type check with error handling
          if ((update as { call?: unknown }).call) {
            // Function updater path with error handling
            try {
              newValue = (update as Updater<T>)(prev);
            } catch (funcError) {
              if (
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development'
              ) {
                console.warn(
                  'Store updater function error, keeping current state:',
                  funcError
                );
              }
              return; // Keep current state on error
            }
          } else {
            // Object update path with optimized merging and error handling
            try {
              newValue = fastMerge(prev, update as Partial<T>);
            } catch (mergeError) {
              if (
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development'
              ) {
                console.warn(
                  'Store merge error, keeping current state:',
                  mergeError
                );
              }
              return;
            }
          }
        } catch (typeError) {
          if (
            typeof process !== 'undefined' &&
            process.env?.NODE_ENV === 'development'
          ) {
            console.warn(
              'Store type checking error, keeping current state:',
              typeError
            );
          }
          return;
        }

        // Fast path: early return if state hasn't changed
        try {
          if (shallowEqual(prev, newValue)) return;
        } catch (equalityError) {
          if (
            typeof process !== 'undefined' &&
            process.env?.NODE_ENV === 'development'
          ) {
            console.warn(
              'Store equality check error, proceeding with update:',
              equalityError
            );
          }
        }

        // Direct method call with error handling
        try {
          subjectNext.call(subject, newValue);
        } catch (emitError) {
          if (
            typeof process !== 'undefined' &&
            process.env?.NODE_ENV === 'development'
          ) {
            console.error('Store emission error:', emitError);
          }
          // Try fallback emission
          try {
            subject.next(newValue);
          } catch (fallbackError) {
            if (
              typeof process !== 'undefined' &&
              process.env?.NODE_ENV === 'development'
            ) {
              console.error('Store fallback emission failed:', fallbackError);
            }
          }
        }
      } catch (setterError) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error('Store setter error:', setterError);
        }
      }
    };

    // Ultra-fast memoized selector with advanced caching and error handling
    const select = <K extends keyof T>(key: K): Observable<T[K]> => {
      try {
        let cache = globalSelectorCache.get(subject);
        if (!cache) {
          cache = new FastSelectorCache();
          try {
            globalSelectorCache.set(subject, cache);
          } catch (setCacheError) {
            if (
              typeof process !== 'undefined' &&
              process.env?.NODE_ENV === 'development'
            ) {
              console.warn('Failed to set selector cache:', setCacheError);
            }
          }
        }

        let selector = cache.get(key);
        if (!selector) {
          try {
            // Pre-compiled selector pipeline with error handling
            selector = subject.pipe(
              map((state: T) => {
                try {
                  return state[key];
                } catch (accessError) {
                  if (
                    typeof process !== 'undefined' &&
                    process.env?.NODE_ENV === 'development'
                  ) {
                    console.warn(
                      `Store selector access error for key "${String(key)}":`,
                      accessError
                    );
                  }
                  return initial[key]; // Fallback to initial value
                }
              }),
              distinctUntilChanged(STRICT_EQUAL),
              shareReplay(SHARE_REPLAY_CONFIG)
            );

            try {
              cache.set(key, selector);
            } catch (setSelectorError) {
              if (
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development'
              ) {
                console.warn('Failed to cache selector:', setSelectorError);
              }
            }
          } catch (pipeError) {
            if (
              typeof process !== 'undefined' &&
              process.env?.NODE_ENV === 'development'
            ) {
              console.error(
                'Selector pipeline error, creating fallback:',
                pipeError
              );
            }
            // Fallback selector
            selector = new BehaviorSubject(initial[key]).asObservable();
          }
        }

        return selector as Observable<T[K]>;
      } catch (selectError) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error(
            'Store select error, returning fallback observable:',
            selectError
          );
        }
        // Return fallback observable
        return new BehaviorSubject(initial[key]).asObservable();
      }
    };

    // Pre-compiled observable pipeline with error handling
    let observable: Observable<T>;
    try {
      observable = subject
        .asObservable()
        .pipe(
          distinctUntilChanged(shallowEqual),
          shareReplay(SHARE_REPLAY_CONFIG)
        );
    } catch (pipeError) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error(
          'Store observable pipeline error, creating fallback:',
          pipeError
        );
      }
      // Fallback observable
      observable = subject.asObservable();
    }

    return [getValue, setter, observable, select] as const;
  } catch (createError) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.error(
        'Critical store creation error, creating fallback store:',
        createError
      );
    }

    // Fallback store implementation
    let fallbackState = initial;
    const fallbackObservable = new BehaviorSubject(initial);

    const fallbackGetter = () => fallbackState;
    const fallbackSetter = (update: Partial<T> | Updater<T>) => {
      try {
        const newValue =
          typeof update === 'function'
            ? (update as Updater<T>)(fallbackState)
            : { ...fallbackState, ...update };
        if (!shallowEqual(fallbackState, newValue)) {
          fallbackState = newValue;
          fallbackObservable.next(newValue);
        }
      } catch (fallbackError) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error('Fallback store setter error:', fallbackError);
        }
      }
    };

    const fallbackSelect = <K extends keyof T>(key: K): Observable<T[K]> => {
      return new BehaviorSubject(fallbackState[key]).asObservable();
    };

    return [
      fallbackGetter,
      fallbackSetter,
      fallbackObservable.asObservable(),
      fallbackSelect,
    ] as const;
  }
}

/**
 * Advanced store creation with performance monitoring (development only)
 */
export function createStoreWithMetrics<T extends object>(
  initial: T,
  name?: string
) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    const result = createStore(initial);
    const endTime = performance.now();

    console.debug(
      `Store "${name || 'anonymous'}" created in ${(endTime - startTime).toFixed(3)}ms`
    );
    return result;
  }

  return createStore(initial);
}

/**
 * Batch store updates for maximum performance
 * Groups multiple store updates into a single microtask
 */
export function batchStoreUpdates(updates: (() => void)[]): void {
  // Use microtask scheduling for optimal performance
  queueMicrotask(() => {
    for (let i = 0; i < updates.length; i++) {
      updates[i]();
    }
  });
}

/**
 * Create multiple stores efficiently with shared configuration
 */
export function createStores<T extends Record<string, object>>(
  initialValues: T
): {
  [K in keyof T]: readonly [
    () => T[K],
    (update: Partial<T[K]> | Updater<T[K]>) => void,
    Observable<T[K]>,
    <P extends keyof T[K]>(key: P) => Observable<T[K][P]>,
  ];
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as any;

  // Pre-allocate arrays for better performance
  const keys = Object.keys(initialValues);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result[key] = createStore(initialValues[key]);
  }

  return result;
}

/**
 * Advanced selector with deep path support and caching
 */
export function createDeepSelector<T extends object, R>(
  store: Observable<T>,
  path: string[],
  transform?: (value: unknown) => R
): Observable<R> {
  return store.pipe(
    map((state: T) => {
      let current: unknown = state;

      // Fast path traversal
      for (let i = 0; i < path.length; i++) {
        current = (current as Record<string, unknown>)?.[path[i]];
        if (current === undefined) break;
      }

      return transform ? transform(current) : (current as R);
    }),
    distinctUntilChanged(STRICT_EQUAL),
    shareReplay(SHARE_REPLAY_CONFIG)
  );
}

/**
 * Optimized store state comparison utility
 */
export function compareStoreStates<T extends object>(
  prev: T,
  next: T,
  keys?: (keyof T)[]
): boolean {
  if (keys) {
    // Compare only specified keys for better performance
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!STRICT_EQUAL(prev[key], next[key])) {
        return false;
      }
    }
    return true;
  }

  // Fall back to full shallow comparison
  return shallowEqual(prev, next);
}
