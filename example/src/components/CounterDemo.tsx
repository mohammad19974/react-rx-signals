import React from 'react';
import {
  createSignal,
  useSignal,
  createSelector,
  createSignalMemo,
  preventUnnecessaryRerenders,
} from 'react-rx-signals';

// Create a signal for the counter
const [, setCount, count$] = createSignal(0);

// Create a selector for even/odd status
const isEven$ = createSelector(count$, (count) => count % 2 === 0);

// Performance-optimized component that only re-renders when isEven changes
const EvenOddDisplay = createSignalMemo(function EvenOddDisplay(): JSX.Element {
  const isEven = useSignal(isEven$, true);

  return (
    <div className={`status-display ${isEven ? 'status-even' : 'status-odd'}`}>
      <strong>Status: {isEven ? '✨ Even' : '🔥 Odd'}</strong>
    </div>
  );
}) as React.FC;

// Component that doesn't use the count signal - should never re-render
const UnrelatedComponent = preventUnnecessaryRerenders(
  function UnrelatedComponent(): JSX.Element {
    const [localState, setLocalState] = React.useState(0);

    return (
      <div className="user-card">
        <div className="info-item">
          <label>Independent State</label>
          <span>{localState}</span>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setLocalState((prev) => prev + 1)}
        >
          🔄 Update Local State
        </button>
      </div>
    );
  }
) as React.FC;

function CounterDemo() {
  const count = useSignal(count$, 0);

  return (
    <div className="demo-card">
      <h2>🔢 Signal Counter</h2>
      <p>Demonstrates basic signal usage with fine-grained reactivity</p>

      <div className="counter-display">{count}</div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => setCount((prev) => prev + 1)}
        >
          ➕ Increment
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setCount((prev) => prev - 1)}
        >
          ➖ Decrement
        </button>
        <button className="btn btn-warning" onClick={() => setCount(0)}>
          🔄 Reset
        </button>
      </div>

      <EvenOddDisplay />

      <h3>Performance Test</h3>
      <p>
        The component below has its own state and should not re-render when the
        counter changes:
      </p>
      <UnrelatedComponent />

      <ul className="features-list">
        <li>Only components using changed signals re-render</li>
        <li>Even/Odd display only updates when parity changes</li>
        <li>Unrelated component never re-renders from counter changes</li>
      </ul>
    </div>
  );
}

export default CounterDemo;
