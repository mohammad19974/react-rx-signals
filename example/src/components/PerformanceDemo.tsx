import React, { useState, useCallback } from 'react';
import {
  createSignal,
  useSignal,
  createSignalMemo,
  preventUnnecessaryRerenders,
  createSelector,
  withSignalTracking,
} from 'react-rx-signals';

// Performance test signals
const [getCounter, setCounter, counter$] = createSignal(0);
const [getUpdateCount, setUpdateCount, updateCount$] = createSignal(0);

// Create selectors for performance testing
const isCounterEven$ = createSelector(counter$, (count) => count % 2 === 0);
const counterTens$ = createSelector(counter$, (count) =>
  Math.floor(count / 10)
);

// Performance-optimized components
const OptimizedEvenOdd = createSignalMemo(
  function OptimizedEvenOdd(): JSX.Element {
    const isEven = useSignal(isCounterEven$, true);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        className={`status-display ${isEven ? 'status-even' : 'status-odd'}`}
      >
        <strong>{isEven ? '✨ Even' : '🔥 Odd'}</strong>
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Renders: {renderCount.current}
        </div>
      </div>
    );
  }
) as React.FC;

const OptimizedTensDisplay = createSignalMemo(
  function OptimizedTensDisplay(): JSX.Element {
    const tens = useSignal(counterTens$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item">
        <label>Tens Place</label>
        <span>
          {tens} (Renders: {renderCount.current})
        </span>
      </div>
    );
  }
) as React.FC;

// Regular React component for comparison
const RegularComponent = React.memo(function RegularComponent({
  counter,
}: {
  counter: number;
}) {
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="info-item">
      <label>Regular Component</label>
      <span>
        {counter} (Renders: {renderCount.current})
      </span>
    </div>
  );
});

// Component that uses signal tracking
const TrackedComponent = withSignalTracking(
  function TrackedComponent(): JSX.Element {
    const counter = useSignal(counter$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item">
        <label>Signal Tracked</label>
        <span>
          {counter} (Renders: {renderCount.current})
        </span>
      </div>
    );
  },
  [counter$]
) as React.FC;

// Independent component that should never re-render from signal changes
const IndependentComponent = preventUnnecessaryRerenders(
  function IndependentComponent(): JSX.Element {
    const [localState, setLocalState] = useState(0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="user-card">
        <div className="info-item">
          <label>Independent Component</label>
          <span>
            Local: {localState} (Renders: {renderCount.current})
          </span>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setLocalState((prev) => prev + 1)}
        >
          Update Local
        </button>
      </div>
    );
  }
) as React.FC;

function PerformanceDemo() {
  const counter = useSignal(counter$, 0);
  const updateCount = useSignal(updateCount$, 0);
  const [reactState, setReactState] = useState(0);

  const incrementCounter = useCallback(() => {
    setCounter((prev) => prev + 1);
    setUpdateCount((prev) => prev + 1);
  }, []);

  const incrementReactState = useCallback(() => {
    setReactState((prev) => prev + 1);
    setUpdateCount((prev) => prev + 1);
  }, []);

  const stressTest = useCallback(() => {
    // Rapid updates to test performance
    for (let i = 0; i < 100; i++) {
      setTimeout(() => setCounter((prev) => prev + 1), i * 10);
    }
    setUpdateCount((prev) => prev + 100);
  }, []);

  return (
    <div className="demo-card">
      <h2>⚡ Performance Testing</h2>
      <p>Compare signal-based vs traditional React rendering performance</p>

      <div className="performance-metrics">
        <h3>📊 Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">{counter}</div>
            <div className="metric-label">Signal Counter</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{reactState}</div>
            <div className="metric-label">React State</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{updateCount}</div>
            <div className="metric-label">Total Updates</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{Math.floor(counter / 10)}</div>
            <div className="metric-label">Tens (Signal)</div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={incrementCounter}>
          📈 Signal +1
        </button>
        <button className="btn btn-success" onClick={incrementReactState}>
          ⚛️ React +1
        </button>
        <button className="btn btn-warning" onClick={stressTest}>
          🔥 Stress Test
        </button>
        <button
          className="btn btn-outline"
          onClick={() => {
            setCounter(0);
            setReactState(0);
            setUpdateCount(0);
          }}
        >
          🔄 Reset All
        </button>
      </div>

      <h3>🧪 Render Optimization Test</h3>
      <div className="user-info">
        <OptimizedTensDisplay />
        <TrackedComponent />
        <RegularComponent counter={counter} />
      </div>

      <OptimizedEvenOdd />
      <IndependentComponent />

      <ul className="features-list">
        <li>
          Signal components only re-render when their specific dependencies
          change
        </li>
        <li>
          Optimized components use memoization to prevent unnecessary renders
        </li>
        <li>Independent components are isolated from signal updates</li>
        <li>Fine-grained reactivity reduces overall re-render count</li>
      </ul>
    </div>
  );
}

export default PerformanceDemo;
