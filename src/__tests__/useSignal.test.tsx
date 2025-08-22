import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createSignal, createComputed } from '../signal';
import { useSignal, SignalConditions } from '../useSignal';
import { BehaviorSubject } from 'rxjs';

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

  describe('RxJS Optimizations', () => {
    test('should prevent repetitive values with distinctUntilChanged', async () => {
      const mockSubscriber = jest.fn();
      const [getValue, setValue, signal$] = createSignal(0);

      function TestComponent() {
        const value = useSignal(signal$, 0);
        React.useEffect(() => {
          mockSubscriber(value);
        }, [value]);
        return <span data-testid="value">{value}</span>;
      }

      render(<TestComponent />);

      // Set the same value multiple times
      act(() => setValue(1));
      act(() => setValue(1)); // Should not trigger re-render
      act(() => setValue(1)); // Should not trigger re-render
      act(() => setValue(2)); // Should trigger re-render

      // Should only be called for: initial (0), first change (1), and different value (2)
      expect(mockSubscriber).toHaveBeenCalledTimes(3);
      expect(mockSubscriber).toHaveBeenNthCalledWith(1, 0);
      expect(mockSubscriber).toHaveBeenNthCalledWith(2, 1);
      expect(mockSubscriber).toHaveBeenNthCalledWith(3, 2);
    });

    test('should work with conditional takeWhile', async () => {
      const [getValue, setValue, signal$] = createSignal(0);

      function ConditionalComponent() {
        const value = useSignal(signal$, 0, {
          condition: (val) => val < 5, // Stop when value reaches 5
        });
        return <span data-testid="conditional-value">{value}</span>;
      }

      render(<ConditionalComponent />);
      expect(screen.getByTestId('conditional-value')).toHaveTextContent('0');

      // Values below 5 should update
      act(() => setValue(2));
      expect(screen.getByTestId('conditional-value')).toHaveTextContent('2');

      act(() => setValue(4));
      expect(screen.getByTestId('conditional-value')).toHaveTextContent('4');

      // Value of 5 or above should not update due to takeWhile condition
      act(() => setValue(5));
      expect(screen.getByTestId('conditional-value')).toHaveTextContent('4'); // Should remain 4

      act(() => setValue(10));
      expect(screen.getByTestId('conditional-value')).toHaveTextContent('4'); // Should remain 4
    });

    test('should work with SignalConditions.whileTruthy', async () => {
      const [getValue, setValue, signal$] = createSignal('hello');

      function TruthyComponent() {
        const value = useSignal(signal$, 'initial', {
          condition: SignalConditions.whileTruthy,
        });
        return <span data-testid="truthy-value">{value}</span>;
      }

      render(<TruthyComponent />);
      expect(screen.getByTestId('truthy-value')).toHaveTextContent('hello');

      // Truthy values should update
      act(() => setValue('world'));
      expect(screen.getByTestId('truthy-value')).toHaveTextContent('world');

      // Falsy value should stop subscription
      act(() => setValue(''));
      expect(screen.getByTestId('truthy-value')).toHaveTextContent('world'); // Should remain 'world'

      // Further updates should not work
      act(() => setValue('test'));
      expect(screen.getByTestId('truthy-value')).toHaveTextContent('world'); // Should remain 'world'
    });

    test('should work with SignalConditions.whileBelow', async () => {
      const [getValue, setValue, signal$] = createSignal(0);

      function BelowComponent() {
        const value = useSignal(signal$, 0, {
          condition: SignalConditions.whileBelow(10),
        });
        return <span data-testid="below-value">{value}</span>;
      }

      render(<BelowComponent />);
      expect(screen.getByTestId('below-value')).toHaveTextContent('0');

      // Values below 10 should update
      act(() => setValue(5));
      expect(screen.getByTestId('below-value')).toHaveTextContent('5');

      act(() => setValue(9));
      expect(screen.getByTestId('below-value')).toHaveTextContent('9');

      // Value of 10 or above should stop subscription
      act(() => setValue(10));
      expect(screen.getByTestId('below-value')).toHaveTextContent('9'); // Should remain 9

      act(() => setValue(15));
      expect(screen.getByTestId('below-value')).toHaveTextContent('9'); // Should remain 9
    });

    test('should work with custom condition that stops at value 3', async () => {
      const [getValue, setValue, signal$] = createSignal(0);

      function ConditionalStopComponent() {
        const value = useSignal(signal$, 0, {
          condition: (val) => val < 3, // Stop when value reaches 3
        });
        return <span data-testid="conditional-stop-value">{value}</span>;
      }

      render(<ConditionalStopComponent />);
      expect(screen.getByTestId('conditional-stop-value')).toHaveTextContent(
        '0'
      );

      // First update - should work (0 < 3)
      act(() => setValue(1));
      expect(screen.getByTestId('conditional-stop-value')).toHaveTextContent(
        '1'
      );

      // Second update - should work (1 < 3)
      act(() => setValue(2));
      expect(screen.getByTestId('conditional-stop-value')).toHaveTextContent(
        '2'
      );

      // Third update - should stop subscription (3 is not < 3)
      act(() => setValue(3));
      expect(screen.getByTestId('conditional-stop-value')).toHaveTextContent(
        '2'
      ); // Should remain 2

      // Fourth update should not work - subscription ended
      act(() => setValue(4));
      expect(screen.getByTestId('conditional-stop-value')).toHaveTextContent(
        '2'
      ); // Should remain 2
    });

    test('should handle errors gracefully', async () => {
      const errorSubject = new BehaviorSubject(0);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      function ErrorHandlingComponent() {
        const value = useSignal(errorSubject, 0);
        return <span data-testid="error-value">{value}</span>;
      }

      render(<ErrorHandlingComponent />);
      expect(screen.getByTestId('error-value')).toHaveTextContent('0');

      // Simulate an error
      act(() => {
        errorSubject.error(new Error('Test error'));
      });

      // Should fallback to initial value and not crash
      expect(screen.getByTestId('error-value')).toHaveTextContent('0');

      consoleSpy.mockRestore();
    });
  });
});
