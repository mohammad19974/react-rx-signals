import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createSignal } from '../signal';
import { useSignalValue } from '../useSignalValue';

describe('useSignalValue', () => {
  test('should provide current signal value for useEffect dependencies', () => {
    const [getCount, setCount, count$] = createSignal(0);
    const effectMock = jest.fn();

    function TestComponent() {
      const countValue = useSignalValue(count$, 0);

      React.useEffect(() => {
        effectMock(countValue);
      }, [countValue]);

      return (
        <div>
          <span data-testid="count">{countValue}</span>
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

    // Initial effect call
    expect(effectMock).toHaveBeenCalledWith(0);
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // After increment
    act(() => {
      setCount(1);
    });

    expect(effectMock).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  test('should use initial value before first emission', () => {
    const [getCount, setCount, count$] = createSignal(5);

    function TestComponent() {
      const countValue = useSignalValue(count$, 999);
      return <span data-testid="count">{countValue}</span>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });

  test('should update when signal changes', () => {
    const [getCount, setCount, count$] = createSignal(10);

    function TestComponent() {
      const countValue = useSignalValue(count$, 0);

      return (
        <div>
          <span data-testid="count">{countValue}</span>
          <button data-testid="set-20" onClick={() => setCount(20)}>
            Set 20
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('count')).toHaveTextContent('10');

    act(() => {
      setCount(20);
    });

    expect(screen.getByTestId('count')).toHaveTextContent('20');
  });
});
