import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

// Cache for memoized computed observables to prevent duplicate computations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const computedCache = new WeakMap<Observable<any>, Map<any, Observable<any>>>();

export function createSignal<T>(initial: T) {
  const subject = new BehaviorSubject<T>(initial);

  // Pre-bind methods to avoid function creation on each call
  const get = subject.getValue.bind(subject);

  // Optimized setter with early return for identical values
  const set = (value: T | ((prev: T) => T)) => {
    const current = subject.getValue();
    const newValue =
      typeof value === 'function' ? (value as (prev: T) => T)(current) : value;

    // Early return if value hasn't changed (using Object.is for NaN handling)
    if (Object.is(current, newValue)) return;

    subject.next(newValue);
  };

  // Create the memoized observable once with proper typing
  const observable: Observable<T> = subject.asObservable().pipe(
    distinctUntilChanged(Object.is), // Use Object.is for better NaN/0/-0 handling
    shareReplay({ bufferSize: 1, refCount: true }) // Share subscription, auto-cleanup
  );

  return [get, set, observable] as const;
}

export function createComputed<T, U>(
  source$: Observable<T>,
  compute: (value: T) => U
) {
  // Memoization to prevent duplicate computed observables
  let sourceCache = computedCache.get(source$);
  if (!sourceCache) {
    sourceCache = new Map();
    computedCache.set(source$, sourceCache);
  }

  let computed = sourceCache.get(compute);
  if (!computed) {
    computed = source$.pipe(
      map(compute),
      distinctUntilChanged(Object.is), // Better equality check
      shareReplay({ bufferSize: 1, refCount: true }) // Share computation results
    );
    sourceCache.set(compute, computed);
  }

  return computed as Observable<U>;
}
