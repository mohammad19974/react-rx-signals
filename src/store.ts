import { BehaviorSubject, distinctUntilChanged, map, Observable } from "rxjs";

type Updater<T> = (prev: T) => T;

export function createStore<T extends object>(initial: T) {
  const subject = new BehaviorSubject<T>(initial);

  const get = () => subject.getValue();

  const set = (update: Partial<T> | Updater<T>) => {
    const prev = subject.getValue();
    const newValue =
      typeof update === "function" ? update(prev) : { ...prev, ...update };
    subject.next(newValue);
  };

  const select = <K extends keyof T>(key: K): Observable<T[K]> =>
    subject.pipe(
      map((state) => state[key]),
      distinctUntilChanged()
    );

  const asObservable = () => subject.asObservable();

  return [get, set, asObservable, select] as const;
}
