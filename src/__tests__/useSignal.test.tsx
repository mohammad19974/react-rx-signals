import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createSignal, createComputed } from '../signal';
import { useSignal } from '../useSignal';

// Create signal outside component to persist state
const [getCount, setCount, count$] = createSignal(0);

// Test component that uses useSignal
function Counter() {
  const count = useSignal(count$, 0);

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button
        data-testid="increment"
        onClick={() => setCount((prev) => prev + 1)}
      >
        Increment
      </button>
      <button
        data-testid="decrement"
        onClick={() => setCount((prev) => prev - 1)}
      >
        Decrement
      </button>
    </div>
  );
}

describe('useSignal', () => {
  beforeEach(() => {
    // Reset counter before each test
    setCount(0);
  });

  test('should render initial value', () => {
    render(<Counter />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  test('should update when signal changes', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');

    await user.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');

    await user.click(screen.getByTestId('decrement'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  test('should work with computed values', () => {
    function ComputedExample() {
      const [getCount, setCount, count$] = createSignal(5);
      const doubled$ = createComputed(count$, (count: number) => count * 2);

      const count = useSignal(count$, 0);
      const doubled = useSignal(doubled$, 0);

      return (
        <div>
          <span data-testid="count">{count}</span>
          <span data-testid="doubled">{doubled}</span>
          <button data-testid="set-10" onClick={() => setCount(10)}>
            Set to 10
          </button>
        </div>
      );
    }

    render(<ComputedExample />);

    expect(screen.getByTestId('count')).toHaveTextContent('5');
    expect(screen.getByTestId('doubled')).toHaveTextContent('10');
  });

  test('should handle multiple components subscribing to same signal', async () => {
    const [getGlobalCount, setGlobalCount, globalCount$] = createSignal(0);

    function ComponentA() {
      const count = useSignal(globalCount$, 0);
      return <span data-testid="count-a">{count}</span>;
    }

    function ComponentB() {
      const count = useSignal(globalCount$, 0);
      return <span data-testid="count-b">{count}</span>;
    }

    function App() {
      return (
        <div>
          <ComponentA />
          <ComponentB />
          <button
            data-testid="increment-global"
            onClick={() => setGlobalCount((prev) => prev + 1)}
          >
            Increment
          </button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('count-a')).toHaveTextContent('0');
    expect(screen.getByTestId('count-b')).toHaveTextContent('0');

    await user.click(screen.getByTestId('increment-global'));

    expect(screen.getByTestId('count-a')).toHaveTextContent('1');
    expect(screen.getByTestId('count-b')).toHaveTextContent('1');
  });
});
