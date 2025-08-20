import { createStore } from '../store';
import { firstValueFrom, take } from 'rxjs';

interface TestState {
  name: string;
  age: number;
  active: boolean;
}

describe('createStore', () => {
  test('should create a store with initial state', () => {
    const initialState: TestState = { name: 'John', age: 25, active: true };
    const [get, set, store$, select] = createStore(initialState);

    expect(get()).toEqual(initialState);
  });

  test('should update store with partial state', () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'John',
      age: 25,
      active: true,
    });

    set({ age: 26 });

    expect(get()).toEqual({ name: 'John', age: 26, active: true });
  });

  test('should update store with function', () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'John',
      age: 25,
      active: true,
    });

    set((prev) => ({ ...prev, name: prev.name.toUpperCase() }));

    expect(get()).toEqual({ name: 'JOHN', age: 25, active: true });
  });

  test('should select specific properties', async () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'Alice',
      age: 30,
      active: false,
    });

    const name$ = select('name');
    const age$ = select('age');

    const name = await firstValueFrom(name$.pipe(take(1)));
    const age = await firstValueFrom(age$.pipe(take(1)));

    expect(name).toBe('Alice');
    expect(age).toBe(30);
  });

  test('should emit updates for selected properties', async () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'Bob',
      age: 35,
      active: true,
    });

    const name$ = select('name');
    const names: string[] = [];

    name$.pipe(take(2)).subscribe((name) => names.push(name));

    set({ name: 'Robert' });

    expect(names).toEqual(['Bob', 'Robert']);
  });

  test('should not emit for unrelated property changes', async () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'Charlie',
      age: 40,
      active: true,
    });

    const name$ = select('name');
    const names: string[] = [];

    name$.pipe(take(2)).subscribe((name) => names.push(name));

    // Change age, should not affect name selector
    set({ age: 41 });
    set({ active: false });

    // Only change name now
    set({ name: 'Charles' });

    expect(names).toEqual(['Charlie', 'Charles']);
  });

  test('should emit complete state updates', async () => {
    const [get, set, store$, select] = createStore<TestState>({
      name: 'Diana',
      age: 28,
      active: true,
    });

    const states: TestState[] = [];
    const observable = store$;
    observable
      .pipe(take(2))
      .subscribe((state: TestState) => states.push({ ...state }));

    set({ age: 29, active: false });

    expect(states).toEqual([
      { name: 'Diana', age: 28, active: true },
      { name: 'Diana', age: 29, active: false },
    ]);
  });
});
