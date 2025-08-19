import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createSignal } from '../signal';
import { createStore } from '../store';
import { useSignalLifecycle } from '../useSignalLifecycle';
import { useSignalEffect } from '../useSignalEffect';

describe('useSignalLifecycle', () => {
  test('should track signal lifecycle changes', () => {
    const [getCount, setCount, count$] = createSignal(0);
    const lifecycleMock = jest.fn();

    function TestComponent() {
      useSignalLifecycle(count$(), getCount, lifecycleMock);

      return (
        <div>
          <span data-testid="count">{getCount()}</span>
          <button
            data-testid="increment"
            onClick={() => setCount((prev) => prev + 1)}
          >
            Increment
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    // Should be called with initial value
    expect(lifecycleMock).toHaveBeenCalledWith(undefined, 0);

    // Should be called when signal changes
    act(() => {
      setCount(1);
    });

    expect(lifecycleMock).toHaveBeenCalledWith(0, 1);

    // Should be called again with previous value
    act(() => {
      setCount(2);
    });

    expect(lifecycleMock).toHaveBeenCalledWith(1, 2);
    expect(lifecycleMock).toHaveBeenCalledTimes(4); // Initial call + 2 subscription calls + 1 initialization
  });

  test('should work with store selectors', () => {
    const [getUser, setUser, user$, selectUser] = createStore({
      name: 'John',
      age: 30,
    });
    const lifecycleMock = jest.fn();

    function TestComponent() {
      useSignalLifecycle(
        selectUser('name'),
        () => getUser().name,
        lifecycleMock
      );

      return (
        <div>
          <span data-testid="name">{getUser().name}</span>
          <button
            data-testid="change-name"
            onClick={() => setUser({ name: 'Jane' })}
          >
            Change Name
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    // Should be called with initial value
    expect(lifecycleMock).toHaveBeenCalledWith(undefined, 'John');

    // Should be called when name changes
    act(() => {
      setUser({ name: 'Jane' });
    });

    expect(lifecycleMock).toHaveBeenCalledWith('John', 'Jane');

    // Age change should not trigger name lifecycle
    act(() => {
      setUser({ age: 31 });
    });

    // Should still only have been called twice (initial + name change)
    expect(lifecycleMock).toHaveBeenCalledTimes(3); // Initial + subscription + initialization
  });
});

describe('useSignalEffect', () => {
  test('should run effect when signal changes', () => {
    const [getCount, setCount, count$] = createSignal(0);
    const effectMock = jest.fn();

    function TestComponent() {
      useSignalEffect(count$(), effectMock);

      return (
        <button
          data-testid="increment"
          onClick={() => setCount((prev) => prev + 1)}
        >
          Count: {getCount()}
        </button>
      );
    }

    render(<TestComponent />);

    // Should be called with initial value
    expect(effectMock).toHaveBeenCalledWith(0);

    // Should be called when signal changes
    act(() => {
      setCount(1);
    });

    expect(effectMock).toHaveBeenCalledWith(1);
    expect(effectMock).toHaveBeenCalledTimes(2);
  });

  test('should handle effect cleanup', () => {
    const [getCount, setCount, count$] = createSignal(0);
    const cleanupMock = jest.fn();
    const effectMock = jest.fn(() => cleanupMock);

    function TestComponent() {
      useSignalEffect(count$(), effectMock);
      return (
        <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
      );
    }

    const { unmount } = render(<TestComponent />);

    // Change signal to trigger cleanup
    act(() => {
      setCount(1);
    });

    expect(cleanupMock).toHaveBeenCalledTimes(1);

    // Unmount should cleanup
    unmount();
    expect(cleanupMock).toHaveBeenCalledTimes(2);
  });
});
