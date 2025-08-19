import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Observable } from 'rxjs';
import { createSignal } from '../signal';
import { useSignalCallback } from '../useSignalCallback';

describe('useSignalCallback', () => {
  test('should provide callback that uses current signal value', () => {
    const [getCount, setCount, count$] = createSignal(5);

    function TestComponent() {
      const [result, setResult] = React.useState<number | null>(null);
      const getDoubledCount = useSignalCallback(count$(), (value) => value * 2);

      return (
        <div>
          <button
            data-testid="get-doubled"
            onClick={() => setResult(getDoubledCount())}
          >
            Get Doubled
          </button>
          <button
            data-testid="increment"
            onClick={() => setCount((prev) => prev + 1)}
          >
            Increment
          </button>
          <div data-testid="result">{result}</div>
        </div>
      );
    }

    render(<TestComponent />);

    // Get initial doubled value
    act(() => {
      screen.getByTestId('get-doubled').click();
    });
    expect(screen.getByTestId('result')).toHaveTextContent('10');

    // Increment and get new doubled value
    act(() => {
      setCount(10);
    });

    act(() => {
      screen.getByTestId('get-doubled').click();
    });
    expect(screen.getByTestId('result')).toHaveTextContent('20');
  });

  test('should update callback when dependencies change', () => {
    const [getCount, setCount, count$] = createSignal(5);

    function TestComponent() {
      const [multiplier, setMultiplier] = React.useState(2);
      const [result, setResult] = React.useState<number | null>(null);

      const getMultipliedCount = useSignalCallback(
        count$(),
        (value) => value * multiplier,
        [multiplier]
      );

      return (
        <div>
          <button
            data-testid="get-result"
            onClick={() => setResult(getMultipliedCount())}
          >
            Get Result
          </button>
          <button
            data-testid="change-multiplier"
            onClick={() => setMultiplier(3)}
          >
            Change Multiplier
          </button>
          <div data-testid="result">{result}</div>
        </div>
      );
    }

    render(<TestComponent />);

    // Get initial result (5 * 2 = 10)
    act(() => {
      screen.getByTestId('get-result').click();
    });
    expect(screen.getByTestId('result')).toHaveTextContent('10');

    // Change multiplier and get new result (5 * 3 = 15)
    act(() => {
      screen.getByTestId('change-multiplier').click();
    });

    act(() => {
      screen.getByTestId('get-result').click();
    });
    expect(screen.getByTestId('result')).toHaveTextContent('15');
  });

  test('should throw error when signal has not emitted', () => {
    // Create an observable that never emits
    const neverEmitSignal$ = new Observable((subscriber) => {
      // Never emit anything, never complete
    });

    function TestComponent() {
      const [error, setError] = React.useState<string | null>(null);
      const getCallback = useSignalCallback(neverEmitSignal$, (value) => value);

      const handleClick = () => {
        try {
          getCallback();
        } catch (err) {
          setError((err as Error).message);
        }
      };

      return (
        <div>
          <button data-testid="get-value" onClick={handleClick}>
            Get Value
          </button>
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    }

    render(<TestComponent />);

    // Click the button which should trigger the error
    act(() => {
      screen.getByTestId('get-value').click();
    });

    // Check that the error message is displayed
    expect(screen.getByTestId('error')).toHaveTextContent(
      'Signal has not emitted a value yet'
    );
  });
});
