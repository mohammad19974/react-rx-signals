import { createSignal, createComputed } from '../signal';
import { firstValueFrom, take } from 'rxjs';

describe('createSignal', () => {
  test('should create a signal with initial value', () => {
    const [get, set, signal$] = createSignal(5);

    expect(get()).toBe(5);
  });

  test('should update signal value', () => {
    const [get, set, signal$] = createSignal(0);

    set(10);
    expect(get()).toBe(10);
  });

  test('should update signal with function', () => {
    const [get, set, signal$] = createSignal(5);

    set((prev) => prev * 2);
    expect(get()).toBe(10);
  });

  test('should emit values through observable', async () => {
    const [get, set, signal$] = createSignal(1);

    const observable = signal$;
    const promise = firstValueFrom(observable.pipe(take(1)));
    const value = await promise;

    expect(value).toBe(1);
  });

  test('should emit updated values', async () => {
    const [get, set, signal$] = createSignal(1);

    const values: number[] = [];
    const observable = signal$;
    observable.pipe(take(2)).subscribe((val) => values.push(val));

    set(42);

    expect(values).toEqual([1, 42]);
  });
});

describe('createComputed', () => {
  test('should compute derived values', async () => {
    const [get, set, signal$] = createSignal(5);
    const doubled$ = createComputed(signal$, (value: number) => value * 2);

    const value = await firstValueFrom(doubled$.pipe(take(1)));
    expect(value).toBe(10);
  });

  test('should recompute when source changes', async () => {
    const [get, set, signal$] = createSignal(3);
    const squared$ = createComputed(signal$, (value: number) => value * value);

    const values: number[] = [];
    squared$.pipe(take(2)).subscribe((val) => values.push(val));

    set(4);

    expect(values).toEqual([9, 16]);
  });

  test('should not emit duplicate values', async () => {
    const [get, set, signal$] = createSignal(2);
    const isEven$ = createComputed(signal$, (value: number) => value % 2 === 0);

    const values: boolean[] = [];
    isEven$.pipe(take(3)).subscribe((val) => values.push(val));

    set(4); // Even
    set(6); // Even (should not emit duplicate)
    set(3); // Odd

    // Should only get true, true, false (distinctUntilChanged should prevent duplicate true)
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(values).toEqual([true, false]);
  });
});
