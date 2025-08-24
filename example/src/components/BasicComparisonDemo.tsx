import React from 'react';
import {
  createSignal,
  useSignal,
  useSignalTextProps,
  useTrueFineGrainedValue,
  FineGrainedText,
  useAutoMemo,
} from 'react-rx-signals';

// Global signals for comparison
const [getCount, setCount, count$] = createSignal(0);
const [getName, setName, name$] = createSignal('React');

// Render tracking system
let renderCounts: Record<string, number> = {};

const trackRender = (componentName: string) => {
  renderCounts[componentName] = (renderCounts[componentName] || 0) + 1;
  console.log(`🎯 ${componentName}: ${renderCounts[componentName]} renders`);
};

const resetRenderTracking = () => {
  renderCounts = {};
  console.clear();
  console.log('🔄 All render counts reset - watch the performance!');
};

// Simple child component for testing
function ExpensiveChild({ title }: { title: string }) {
  trackRender(`ExpensiveChild-${title}`);

  // Simulate expensive work
  const result = React.useMemo(() => {
    let computation = 0;
    for (let i = 0; i < 50000; i++) {
      computation += Math.sin(i) * Math.cos(i);
    }
    return computation.toFixed(3);
  }, []);

  return (
    <div className="expensive-child">
      <div className="child-header">💎 {title}</div>
      <div className="computation">Expensive result: {result}</div>
      <div className="render-count">
        Renders: {renderCounts[`ExpensiveChild-${title}`] || 0}
      </div>
    </div>
  );
}

// Demo 1: useState vs useSignal Comparison
function UseStateDemo() {
  const [stateCount, setStateCount] = React.useState(0);
  const [stateName, setStateName] = React.useState('React');

  trackRender('useState-Parent');

  return (
    <div className="demo-section">
      <h4>❌ useState (Re-renders Everything)</h4>
      <div className="controls">
        <p>
          Count: {stateCount} | Name: {stateName}
        </p>
        <button onClick={() => setStateCount((c) => c + 1)}>
          Increment Count
        </button>
        <button
          onClick={() =>
            setStateName((n) => (n === 'React' ? 'State' : 'React'))
          }
        >
          Toggle Name
        </button>
      </div>

      <div className="children-container">
        <ExpensiveChild title="useState-1" />
        <ExpensiveChild title="useState-2" />
        <ExpensiveChild title="useState-3" />
      </div>
    </div>
  );
}

function UseSignalDemo() {
  const signalCount = useSignal(count$, 0);
  const signalName = useSignal(name$, 'React');

  trackRender('useSignal-Parent');

  return (
    <div className="demo-section">
      <h4>✅ useSignal (Still Re-renders Children)</h4>
      <div className="controls">
        <p>
          Count: {signalCount} | Name: {signalName}
        </p>
        <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
        <button
          onClick={() => setName((n) => (n === 'React' ? 'Signal' : 'React'))}
        >
          Toggle Name
        </button>
      </div>

      <div className="children-container">
        <ExpensiveChild title="useSignal-1" />
        <ExpensiveChild title="useSignal-2" />
        <ExpensiveChild title="useSignal-3" />
      </div>
    </div>
  );
}

// Demo 2: Fine-Grained Reactivity
function FineGrainedValueDemo() {
  const countProps = useSignalTextProps(count$, 0);
  const nameProps = useSignalTextProps(name$, 'React');

  trackRender('FineGrained-Parent');

  return (
    <div className="demo-section">
      <h4>🎯 useSignalTextProps (Zero Re-renders, No Refs)</h4>
      <div className="controls">
        <p>
          Count: <span {...countProps} /> | Name: <span {...nameProps} />
        </p>
        <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
        <button
          onClick={() => setName((n) => (n === 'React' ? 'Fine' : 'React'))}
        >
          Toggle Name
        </button>
      </div>

      <div className="children-container">
        <ExpensiveChild title="FineGrained-1" />
        <ExpensiveChild title="FineGrained-2" />
        <ExpensiveChild title="FineGrained-3" />
      </div>
    </div>
  );
}

function FineGrainedComponentDemo() {
  trackRender('FineGrainedComponent-Parent');

  return (
    <div className="demo-section">
      <h4>🚀 FineGrainedText (Zero Parent Re-renders)</h4>
      <div className="controls">
        <p>
          Count: <FineGrainedText source={count$} /> | Name:{' '}
          <FineGrainedText source={name$} />
        </p>
        <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
        <button
          onClick={() =>
            setName((n) => (n === 'React' ? 'Component' : 'React'))
          }
        >
          Toggle Name
        </button>
      </div>

      <div className="children-container">
        <ExpensiveChild title="Component-1" />
        <ExpensiveChild title="Component-2" />
        <ExpensiveChild title="Component-3" />
      </div>
    </div>
  );
}

// Demo 3: useAutoMemo Example
function AutoMemoDemo() {
  const count = useSignal(count$, 0);
  const name = useSignal(name$, 'React');
  const memoizeChildren = useAutoMemo();

  trackRender('AutoMemo-Parent');

  return (
    <div className="demo-section">
      <h4>🎯 useAutoMemo Hook</h4>
      <div className="controls">
        <p>
          Count: {count} | Name: {name}
        </p>
        <button onClick={() => setCount((c) => c + 1)}>Increment Count</button>
        <button
          onClick={() => setName((n) => (n === 'React' ? 'Auto' : 'React'))}
        >
          Toggle Name
        </button>
      </div>

      <div className="children-grid">
        <div className="child-section">
          <h5>❌ Without useAutoMemo</h5>
          <ExpensiveChild title="Normal-1" />
          <ExpensiveChild title="Normal-2" />
        </div>

        <div className="child-section">
          <h5>✅ With useAutoMemo</h5>
          <div>
            {(() => {
              const MemoizedChild1 = React.useMemo(
                () => React.memo(() => <ExpensiveChild title="Memo-1" />),
                []
              );
              const MemoizedChild2 = React.useMemo(
                () => React.memo(() => <ExpensiveChild title="Memo-2" />),
                []
              );

              return (
                <>
                  <MemoizedChild1 />
                  <MemoizedChild2 />
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo 4: Performance Metrics
function PerformanceMetricsDemo() {
  const [metrics, setMetrics] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({ ...renderCounts });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalRenders = Object.values(metrics).reduce(
    (sum, count) => sum + count,
    0
  );
  const componentCount = Object.keys(metrics).length;

  return (
    <div className="demo-section">
      <h3>📊 Live Performance Metrics</h3>

      <div className="metrics-summary">
        <div className="metric-card">
          <h4>Components</h4>
          <div className="metric-value">{componentCount}</div>
        </div>

        <div className="metric-card">
          <h4>Total Renders</h4>
          <div className="metric-value">{totalRenders}</div>
        </div>

        <div className="metric-card">
          <h4>Avg Renders</h4>
          <div className="metric-value">
            {componentCount > 0
              ? (totalRenders / componentCount).toFixed(1)
              : '0'}
          </div>
        </div>
      </div>

      <div className="metrics-details">
        <h4>Component Render Counts</h4>
        <div className="metrics-list">
          {Object.entries(metrics)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([component, count]) => (
              <div key={component} className="metric-row">
                <span className="component-name">{component}</span>
                <span className="render-count">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Main Component
export function BasicComparisonDemo() {
  return (
    <div className="comparison-demo">
      <div className="demo-header">
        <h2>⚡ React RxJS Signals Performance Comparison</h2>
        <div className="demo-description">
          <p>
            Compare performance between different state management approaches.
            <strong> Open DevTools Console</strong> to see render logging!
          </p>
          <button className="reset-btn" onClick={resetRenderTracking}>
            🔄 Reset Render Counts
          </button>
        </div>
      </div>

      <div className="comparison-grid">
        <UseStateDemo />
        <UseSignalDemo />
      </div>

      <div className="comparison-grid">
        <FineGrainedValueDemo />
        <FineGrainedComponentDemo />
      </div>

      <AutoMemoDemo />
      <PerformanceMetricsDemo />

      <div className="comparison-summary">
        <h3>🏆 Performance Summary</h3>
        <div className="summary-table">
          <table>
            <thead>
              <tr>
                <th>Approach</th>
                <th>Parent Re-renders</th>
                <th>Child Re-renders</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-poor">
                <td>
                  <strong>useState</strong>
                </td>
                <td>❌ Always</td>
                <td>❌ Always</td>
                <td>Poor</td>
              </tr>
              <tr className="row-good">
                <td>
                  <strong>useSignal</strong>
                </td>
                <td>✅ When needed</td>
                <td>❌ With parent</td>
                <td>Good</td>
              </tr>
              <tr className="row-better">
                <td>
                  <strong>useFineGrainedValue</strong>
                </td>
                <td>✅ When needed</td>
                <td>⚡ With parent</td>
                <td>Better</td>
              </tr>
              <tr className="row-best">
                <td>
                  <strong>FineGrainedText</strong>
                </td>
                <td>❌ Never</td>
                <td>❌ Never</td>
                <td>Excellent</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .comparison-demo {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .demo-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }
        
        .demo-description {
          margin-top: 15px;
        }
        
        .reset-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 15px;
          transition: background 0.2s;
          font-weight: 500;
        }
        
        .reset-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
        }
        
        .demo-section {
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .demo-section h4 {
          margin-top: 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 15px;
        }
        
        .controls {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .controls button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 4px;
          cursor: pointer;
          transition: background 0.2s;
          font-weight: 500;
          font-size: 14px;
        }
        
        .controls button:hover {
          background: #0056b3;
        }
        
        .children-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .children-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        
        .child-section {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
        }
        
        .child-section h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6c757d;
        }
        
        .expensive-child {
          background: linear-gradient(145deg, #fff3cd, #ffeaa7);
          border: 1px solid #ffd700;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .child-header {
          font-weight: bold;
          color: #856404;
          margin-bottom: 4px;
        }
        
        .computation {
          color: #6c757d;
          margin-bottom: 4px;
        }
        
        .render-count {
          font-size: 12px;
          font-weight: bold;
          color: #dc3545;
          background: rgba(220, 53, 69, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          display: inline-block;
        }
        
        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          background: linear-gradient(145deg, #667eea, #764ba2);
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        
        .metric-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .metrics-details {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
        }
        
        .metrics-details h4 {
          margin-top: 0;
          margin-bottom: 12px;
        }
        
        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e1e5e9;
        }
        
        .component-name {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          color: #495057;
        }
        
        .render-count {
          font-weight: bold;
          color: #dc3545;
        }
        
        .comparison-summary {
          margin-top: 30px;
          background: #e8f5e9;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 20px;
        }
        
        .comparison-summary h3 {
          margin-top: 0;
          color: #155724;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .summary-table {
          overflow-x: auto;
        }
        
        .summary-table table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .summary-table th {
          background: #495057;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        
        .summary-table td {
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        .summary-table tr:last-child td {
          border-bottom: none;
        }
        
        .row-poor {
          background: #f8d7da;
        }
        
        .row-good {
          background: #fff3cd;
        }
        
        .row-better {
          background: #d1ecf1;
        }
        
        .row-best {
          background: #d4edda;
        }
        
        @media (max-width: 900px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
          
          .children-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
