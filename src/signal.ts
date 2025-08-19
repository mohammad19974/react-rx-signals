import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';

export function createSignal<T>(initial: T) {
  const subject = new BehaviorSubject<T>(initial);

  const get = () => subject.getValue();

  const set = (value: T | ((prev: T) => T)) => {
    const newValue =
      typeof value === 'function'
        ? (value as (prev: T) => T)(subject.getValue())
        : value;
    subject.next(newValue);
  };

  const asObservable = () => subject.asObservable();

  return [get, set, asObservable] as const;
}

export function createComputed<T, U>(
  source$: Observable<T>,
  compute: (value: T) => U
) {
  return source$.pipe(map(compute), distinctUntilChanged());
}
