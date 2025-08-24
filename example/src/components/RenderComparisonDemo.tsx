import React, { useState, useCallback } from 'react';
import {
  createSignal,
  useSignal,
  createSignalMemo,
  preventUnnecessaryRerenders,
} from 'react-rx-signals';

// Create signals for comparison
const [, setSignalCounter, signalCounter$] = createSignal(0);
const [, setSignalName, signalName$] = createSignal('Alice');

// React State Demo Components
const ReactCounterDisplay = React.memo(function ReactCounterDisplay({
  counter,
}: {
  counter: number;
}) {
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="info-item">
      <label>📊 React Counter</label>
      <span>
        {counter} (Renders: {renderCount.current})
      </span>
    </div>
  );
});

const ReactNameDisplay = React.memo(function ReactNameDisplay({
  name,
}: {
  name: string;
}) {
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="info-item">
      <label>👤 React Name</label>
      <span>
        {name} (Renders: {renderCount.current})
      </span>
    </div>
  );
});

const ReactParentComponent = function ReactParentComponent() {
  const [counter, setCounter] = useState(0);
  const [name, setName] = useState('Alice');
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="user-card">
      <h3>⚛️ React useState (Re-renders Everything)</h3>
      <div
        style={{
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--text-light)',
        }}
      >
        Parent renders: {renderCount.current}
      </div>

      <div className="user-info">
        <ReactCounterDisplay counter={counter} />
        <ReactNameDisplay name={name} />
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => setCounter((prev) => prev + 1)}
        >
          ➕ Counter
        </button>
        <button
          className="btn btn-success"
          onClick={() =>
            setName((prev) => (prev === 'Alice' ? 'Bob' : 'Alice'))
          }
        >
          🔄 Name
        </button>
      </div>
    </div>
  );
};

// Signal Demo Components
const SignalCounterDisplay = createSignalMemo(
  function SignalCounterDisplay(): React.ReactElement {
    const counter = useSignal(signalCounter$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item">
        <label>📊 Signal Counter</label>
        <span>
          {counter} (Renders: {renderCount.current})
        </span>
      </div>
    );
  }
) as React.FC;

const SignalNameDisplay = createSignalMemo(
  function SignalNameDisplay(): React.ReactElement {
    const name = useSignal(signalName$, 'Alice');
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item">
        <label>👤 Signal Name</label>
        <span>
          {name} (Renders: {renderCount.current})
        </span>
      </div>
    );
  }
) as React.FC;

const SignalParentComponent = preventUnnecessaryRerenders(
  function SignalParentComponent(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="user-card">
        <h3>⚡ Signal-based (Fine-grained Re-renders)</h3>
        <div
          style={{
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: 'var(--text-light)',
          }}
        >
          Parent renders: {renderCount.current}
        </div>

        <div className="user-info">
          <SignalCounterDisplay />
          <SignalNameDisplay />
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => setSignalCounter((prev) => prev + 1)}
          >
            ➕ Counter
          </button>
          <button
            className="btn btn-success"
            onClick={() =>
              setSignalName((prev) => (prev === 'Alice' ? 'Bob' : 'Alice'))
            }
          >
            🔄 Name
          </button>
        </div>
      </div>
    );
  }
) as React.FC;

// Stress test components
const ReactStressTest = function ReactStressTest() {
  const [values, setValues] = useState({ a: 0, b: 0, c: 0, d: 0, e: 0 });
  const renderCount = React.useRef(0);
  renderCount.current++;

  const updateRandomValue = useCallback(() => {
    const keys = Object.keys(values) as Array<keyof typeof values>;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setValues((prev) => ({
      ...prev,
      [randomKey]: prev[randomKey] + 1,
    }));
  }, [values]);

  return (
    <div className="user-card">
      <h3>🔥 React Stress Test</h3>
      <div
        style={{
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--text-light)',
        }}
      >
        Component renders: {renderCount.current}
      </div>

      <div className="metrics-grid">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="metric-item">
            <div className="metric-value">{value}</div>
            <div className="metric-label">{key.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-warning" onClick={updateRandomValue}>
        🎲 Update Random Value
      </button>
    </div>
  );
};

// Signal stress test
const [, setSignalA, signalA$] = createSignal(0);
const [, setSignalB, signalB$] = createSignal(0);
const [, setSignalC, signalC$] = createSignal(0);
const [, setSignalD, signalD$] = createSignal(0);
const [, setSignalE, signalE$] = createSignal(0);

const signals = [
  { signal: signalA$, setter: setSignalA, name: 'A' },
  { signal: signalB$, setter: setSignalB, name: 'B' },
  { signal: signalC$, setter: setSignalC, name: 'C' },
  { signal: signalD$, setter: setSignalD, name: 'D' },
  { signal: signalE$, setter: setSignalE, name: 'E' },
];

const SignalStressItem = createSignalMemo(function SignalStressItem({
  signal,
  name,
}: {
  signal: any;
  name: string;
}): React.ReactElement {
  const value = useSignal(signal, 0);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="metric-item">
      <div className="metric-value">{value}</div>
      <div className="metric-label">
        {name} (R: {renderCount.current})
      </div>
    </div>
  );
}) as React.FC<{ signal: any; name: string }>;

const SignalStressTest = preventUnnecessaryRerenders(
  function SignalStressTest(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    const updateRandomSignal = useCallback(() => {
      const randomSignal = signals[Math.floor(Math.random() * signals.length)];
      randomSignal.setter((prev: number) => prev + 1);
    }, []);

    return (
      <div className="user-card">
        <h3>⚡ Signal Stress Test</h3>
        <div
          style={{
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: 'var(--text-light)',
          }}
        >
          Parent renders: {renderCount.current}
        </div>

        <div className="metrics-grid">
          {signals.map(({ signal, name }) => (
            <SignalStressItem key={name} signal={signal} name={name} />
          ))}
        </div>

        <button className="btn btn-warning" onClick={updateRandomSignal}>
          🎲 Update Random Signal
        </button>
      </div>
    );
  }
) as React.FC;

function RenderComparisonDemo() {
  return (
    <div className="demo-card">
      <h2>🆚 useState vs Signals Render Comparison</h2>
      <p>
        Compare how React useState causes parent component re-renders vs how
        signals provide fine-grained reactivity with minimal re-renders.
      </p>

      <div className="alert alert-info">
        <strong>🔍 Watch the render counts!</strong> Notice how React useState
        causes the parent component to re-render every time, while signals only
        re-render the specific components that consume the changed data.
      </div>

      <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        <ReactParentComponent />
        <SignalParentComponent />
      </div>

      <h3>🔥 Stress Test Comparison</h3>
      <p>
        Multiple values that update independently. See how React re-renders
        everything vs signals only re-rendering what changed.
      </p>

      <div style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>
        <ReactStressTest />
        <SignalStressTest />
      </div>

      <ul className="features-list">
        <li>
          React useState triggers parent component re-renders on every state
          change
        </li>
        <li>
          Signals provide fine-grained reactivity - only consuming components
          re-render
        </li>
        <li>
          Signal parent components can be completely isolated from child updates
        </li>
        <li>Better performance with complex state that updates frequently</li>
        <li>Automatic optimization without manual React.memo everywhere</li>
      </ul>
    </div>
  );
}

export default RenderComparisonDemo;
