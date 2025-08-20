import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

type Updater<T> = (prev: T) => T;

// Cache for memoized selectors to prevent duplicate subscriptions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectorCache = new WeakMap<
  BehaviorSubject<any>,
  Map<PropertyKey, Observable<any>>
>();

// Fast shallow equality check for objects
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(a[key as keyof T], b[key as keyof T])
    ) {
      return false;
    }
  }

  return true;
}

export function createStore<T extends object>(initial: T) {
  const subject = new BehaviorSubject<T>(initial);

  // Pre-bind getter for better performance
  const get = subject.getValue.bind(subject);

  // Optimized setter with early shallow equality check
  const set = (update: Partial<T> | Updater<T>) => {
    const prev = subject.getValue();
    const newValue =
      typeof update === 'function' ? update(prev) : { ...prev, ...update };

    // Early return if state hasn't changed (shallow comparison)
    if (shallowEqual(prev, newValue)) return;

    subject.next(newValue);
  };

  // Memoized selector with caching to prevent duplicate observables
  const select = <K extends keyof T>(key: K): Observable<T[K]> => {
    let cache = selectorCache.get(subject);
    if (!cache) {
      cache = new Map();
      selectorCache.set(subject, cache);
    }

    let selector = cache.get(key);
    if (!selector) {
      selector = subject.pipe(
        map((state) => state[key]),
        distinctUntilChanged(Object.is), // Better equality for primitives
        shareReplay({ bufferSize: 1, refCount: true }) // Share subscription
      );
      cache.set(key, selector);
    }

    return selector as Observable<T[K]>;
  };

  // Create the memoized observable once
  const observable = subject.asObservable().pipe(
    distinctUntilChanged(shallowEqual), // Use shallow equality for objects
    shareReplay({ bufferSize: 1, refCount: true })
  );

  return [get, set, observable, select] as const;
}
