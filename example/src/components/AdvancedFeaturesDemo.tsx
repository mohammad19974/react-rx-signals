import React, { useState, useEffect } from 'react';
import {
  createSignal,
  createStore,
  useSignal,
  useStore,
  useSignalEffect,
  useSignalLifecycle,
  useSignalValue,
  useDebouncedSignalEffect,
  createSignalMemo,
  createShallowMemo,
  withSignalTracking,
  shallowEqual,
} from 'react-rx-signals';

// ============================================================================
// SIGNAL EFFECTS AND LIFECYCLE EXAMPLES
// ============================================================================

// Create signals for effect demonstrations
const [, setCounter, counter$] = createSignal(0);
const [, setSearchTerm, searchTerm$] = createSignal('');
const [, setUserProfile, userProfile$, selectUserProfile] = createStore({
  name: 'John Doe',
  age: 30,
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: true,
  },
  lastUpdated: Date.now(),
});

// useSignalEffect Demo
const SignalEffectDemo = createSignalMemo(
  function SignalEffectDemo(): JSX.Element {
    const counter = useSignal(counter$, 0);
    const [effectLogs, setEffectLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
      setEffectLogs((prev) => [
        ...prev.slice(-4),
        `${new Date().toLocaleTimeString()}: ${message}`,
      ]);
    };

    // Basic signal effect
    useSignalEffect(counter$, (value) => {
      addLog(`Counter changed to ${value}`);
    });

    // Effect with cleanup
    useSignalEffect(counter$, (value) => {
      const timer = setTimeout(() => {
        addLog(`Delayed effect: Counter was ${value}`);
      }, 1000);

      return () => {
        clearTimeout(timer);
        addLog(`Cleanup for counter ${value}`);
      };
    });

    return (
      <div className="user-card">
        <h3>🎯 useSignalEffect</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Reactive side effects that respond to signal changes
        </p>

        <div className="info-item">
          <label>Counter Value</label>
          <span>{counter}</span>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => setCounter((prev) => prev + 1)}
          >
            Increment (+1)
          </button>
          <button
            className="btn btn-warning"
            onClick={() => setCounter((prev) => prev + 5)}
          >
            Jump (+5)
          </button>
          <button className="btn btn-outline" onClick={() => setCounter(0)}>
            Reset
          </button>
        </div>

        <div className="console-log">
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Effect Logs:
          </div>
          {effectLogs.map((log, index) => (
            <div key={index} className="log-item">
              {log}
            </div>
          ))}
          {effectLogs.length === 0 && (
            <div style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
              Click buttons to see effects...
            </div>
          )}
        </div>
      </div>
    );
  }
) as React.FC;

// useSignalLifecycle Demo
const LifecycleDemo = createSignalMemo(function LifecycleDemo(): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="user-card">
      <h3>🔄 useSignalLifecycle</h3>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-light)',
          marginBottom: '1rem',
        }}
      >
        Component lifecycle management with signals
      </p>

      <button
        className="btn btn-primary"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? 'Hide' : 'Show'} Lifecycle Component
      </button>

      {isVisible && <LifecycleChild />}
    </div>
  );
}) as React.FC;

const LifecycleChild = createSignalMemo(function LifecycleChild(): JSX.Element {
  const counter = useSignal(counter$, 0);
  const [lifecycleLogs, setLifecycleLogs] = useState<string[]>([]);

  const addLifecycleLog = (message: string) => {
    setLifecycleLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useSignalLifecycle(
    counter$,
    () => counter,
    (prevValue, currentValue) => {
      if (prevValue === undefined) {
        addLifecycleLog(`🟢 Mounted with counter: ${currentValue}`);
      } else {
        addLifecycleLog(`🔄 Updated from ${prevValue} to ${currentValue}`);
      }
    }
  );

  useEffect(() => {
    return () => {
      addLifecycleLog(`🔴 Component unmounting`);
    };
  }, []);

  useEffect(() => {
    return () => {
      console.log('Child component unmounting...');
    };
  }, []);

  return (
    <div
      style={{
        border: '2px solid var(--primary-color)',
        borderRadius: '8px',
        padding: '1rem',
        marginTop: '1rem',
      }}
    >
      <div className="info-item">
        <label>Current Counter</label>
        <span>{counter}</span>
      </div>

      <div className="console-log" style={{ maxHeight: '150px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Lifecycle Logs:
        </div>
        {lifecycleLogs.map((log, index) => (
          <div key={index} className="log-item">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}) as React.FC;

// ============================================================================
// DEBOUNCED SIGNAL EFFECT AND SEARCH DEMO
// ============================================================================

const DebouncedSearchDemo = createSignalMemo(
  function DebouncedSearchDemo(): JSX.Element {
    const searchTerm = useSignal(searchTerm$, '');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCount, setSearchCount] = useState(0);

    // Simulate API search with debouncing
    useDebouncedSignalEffect(
      searchTerm$,
      (term) => {
        if (!term.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        setSearchCount((prev) => prev + 1);

        // Simulate API call
        setTimeout(() => {
          const mockResults = [
            `Result 1 for "${term}"`,
            `Result 2 for "${term}"`,
            `Result 3 for "${term}"`,
            `Advanced result for "${term}"`,
            `Premium result for "${term}"`,
          ];
          setSearchResults(mockResults);
          setIsSearching(false);
        }, 500);
      },
      300 // 300ms debounce
    );

    return (
      <div className="user-card">
        <h3>🔍 useDebouncedSignalEffect</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Debounced search with signal effects (300ms delay)
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">{searchTerm.length}</div>
            <div className="metric-label">Characters</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{searchCount}</div>
            <div className="metric-label">API Calls</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{searchResults.length}</div>
            <div className="metric-label">Results</div>
          </div>
          <div className="metric-item">
            <div
              className="metric-value"
              style={{ color: isSearching ? '#f59e0b' : '#10b981' }}
            >
              {isSearching ? 'Searching...' : 'Ready'}
            </div>
            <div className="metric-label">Status</div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                padding: '0.5rem 1rem',
                fontWeight: 'bold',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              Search Results
            </div>
            {searchResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom:
                    index < searchResults.length - 1
                      ? '1px solid var(--border-color)'
                      : 'none',
                  backgroundColor: index % 2 === 0 ? 'white' : 'var(--bg-card)',
                }}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
) as React.FC;

// ============================================================================
// SIGNAL VALUE AND SHALLOW MEMO DEMOS
// ============================================================================

const SignalValueDemo = createSignalMemo(
  function SignalValueDemo(): JSX.Element {
    const counterValue = useSignalValue(counter$, 0);
    const userProfile = useSignalValue(userProfile$, {
      name: 'John Doe',
      age: 30,
      preferences: { theme: 'dark', language: 'en', notifications: true },
      lastUpdated: Date.now(),
    });

    return (
      <div className="user-card">
        <h3>📊 useSignalValue</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Direct signal value access without re-renders
        </p>

        <div className="alert alert-info">
          <strong>Note:</strong> This component uses useSignalValue which
          doesn't trigger re-renders. Values are captured at render time.
        </div>

        <div className="user-info">
          <div className="info-item">
            <label>Counter Snapshot</label>
            <span>{counterValue}</span>
          </div>
          <div className="info-item">
            <label>User Name Snapshot</label>
            <span>{userProfile.name}</span>
          </div>
          <div className="info-item">
            <label>Theme Snapshot</label>
            <span>{userProfile.preferences.theme}</span>
          </div>
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-light)',
            fontStyle: 'italic',
          }}
        >
          These values won't update automatically. Use the "Force Re-render"
          button to refresh.
        </div>
      </div>
    );
  }
) as React.FC;

// Standard React component for shallow memo demonstration
const ExpensiveComponent = React.memo(
  function ExpensiveComponent({ user }: { user: any }): JSX.Element {
    const renderCount = React.useRef(0);
    renderCount.current++;

    // Simulate expensive computation
    const expensiveValue = React.useMemo(() => {
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.random();
      }
      return result.toFixed(2);
    }, [user.name, user.age]);

    return (
      <div
        style={{
          border: '2px solid var(--primary-color)',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          💎 Expensive Component (React.memo with shallowEqual)
        </div>
        <div className="user-info">
          <div className="info-item">
            <label>Render Count</label>
            <span>{renderCount.current}</span>
          </div>
          <div className="info-item">
            <label>Expensive Calculation</label>
            <span>{expensiveValue}</span>
          </div>
          <div className="info-item">
            <label>User Name</label>
            <span>{user.name}</span>
          </div>
          <div className="info-item">
            <label>Theme</label>
            <span>{user.preferences.theme}</span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => shallowEqual(prevProps.user, nextProps.user)
);

const ShallowMemoDemo = createSignalMemo(
  function ShallowMemoDemo(): JSX.Element {
    const userProfile = useStore(userProfile$, {
      name: 'John Doe',
      age: 30,
      preferences: { theme: 'dark', language: 'en', notifications: true },
      lastUpdated: Date.now(),
    });

    return (
      <div className="user-card">
        <h3>🔄 createShallowMemo & shallowEqual</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Optimized rendering for complex objects with shallow comparison
        </p>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() =>
              setUserProfile({
                name: `User ${Math.floor(Math.random() * 100)}`,
              })
            }
          >
            Change Name
          </button>
          <button
            className="btn btn-success"
            onClick={() =>
              setUserProfile({
                preferences: {
                  ...userProfile.preferences,
                  theme:
                    userProfile.preferences.theme === 'dark' ? 'light' : 'dark',
                },
              })
            }
          >
            Toggle Theme
          </button>
          <button
            className="btn btn-warning"
            onClick={() =>
              setUserProfile({
                lastUpdated: Date.now(),
              })
            }
          >
            Update Timestamp
          </button>
        </div>

        <ExpensiveComponent user={userProfile} />

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-light)',
            marginTop: '1rem',
          }}
        >
          💡 The expensive component only re-renders when shallow properties
          change, not when nested objects are replaced with equivalent values.
        </div>
      </div>
    );
  }
) as React.FC;

// ============================================================================
// SIGNAL TRACKING DEMO
// ============================================================================

const TrackedComponent = withSignalTracking(
  function TrackedComponent(): JSX.Element {
    const counter = useSignal(counter$, 0);
    const userName = useStore(selectUserProfile('name'), 'Unknown');
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          border: '2px solid var(--success-color)',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🎯 Signal Tracked Component
        </div>
        <div className="user-info">
          <div className="info-item">
            <label>Render Count</label>
            <span>{renderCount.current}</span>
          </div>
          <div className="info-item">
            <label>Counter</label>
            <span>{counter}</span>
          </div>
          <div className="info-item">
            <label>User Name</label>
            <span>{userName}</span>
          </div>
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-light)',
            marginTop: '0.5rem',
          }}
        >
          This component automatically tracks signals and only re-renders when
          they change.
        </div>
      </div>
    );
  },
  [counter$, selectUserProfile('name')]
) as React.FC;

const SignalTrackingDemo = createSignalMemo(
  function SignalTrackingDemo(): JSX.Element {
    const [forceRenderCount, setForceRenderCount] = useState(0);

    return (
      <div className="user-card">
        <h3>🔍 withSignalTracking</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Automatic signal dependency tracking for components
        </p>

        <div className="button-group">
          <button
            className="btn btn-outline"
            onClick={() => setForceRenderCount((prev) => prev + 1)}
          >
            Force Parent Re-render ({forceRenderCount})
          </button>
        </div>

        <TrackedComponent />

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-light)',
            marginTop: '1rem',
          }}
        >
          💡 The tracked component won't re-render when the parent re-renders,
          only when its tracked signals change.
        </div>
      </div>
    );
  }
) as React.FC;

// ============================================================================
// SHALLOW EQUAL UTILITY DEMO
// ============================================================================

const ShallowEqualDemo = createSignalMemo(
  function ShallowEqualDemo(): JSX.Element {
    const [obj1, setObj1] = useState({ a: 1, b: 2, c: { nested: 3 } });
    const [obj2, setObj2] = useState({ a: 1, b: 2, c: { nested: 3 } });
    const [comparisonResults, setComparisonResults] = useState<{
      shallow: boolean;
      deep: boolean;
      reference: boolean;
    }>({ shallow: false, deep: false, reference: false });

    const performComparison = () => {
      const shallow = shallowEqual(obj1, obj2);
      const deep = JSON.stringify(obj1) === JSON.stringify(obj2);
      const reference = obj1 === obj2;

      setComparisonResults({ shallow, deep, reference });
    };

    React.useEffect(() => {
      performComparison();
    }, [obj1, obj2]);

    return (
      <div className="user-card">
        <h3>⚖️ shallowEqual Utility</h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-light)',
            marginBottom: '1rem',
          }}
        >
          Compare objects with shallow equality checking
        </p>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => setObj2({ ...obj1 })}
          >
            Make Shallow Copy
          </button>
          <button className="btn btn-success" onClick={() => setObj2(obj1)}>
            Share Reference
          </button>
          <button
            className="btn btn-warning"
            onClick={() => setObj2({ ...obj1, a: obj1.a + 1 })}
          >
            Change Top-Level
          </button>
          <button
            className="btn btn-outline"
            onClick={() =>
              setObj2({ ...obj1, c: { nested: obj1.c.nested + 1 } })
            }
          >
            Change Nested
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <div
              className="metric-value"
              style={{
                color: comparisonResults.reference ? '#10b981' : '#ef4444',
              }}
            >
              {comparisonResults.reference ? '✓' : '✗'}
            </div>
            <div className="metric-label">Reference Equal</div>
          </div>
          <div className="metric-item">
            <div
              className="metric-value"
              style={{
                color: comparisonResults.shallow ? '#10b981' : '#ef4444',
              }}
            >
              {comparisonResults.shallow ? '✓' : '✗'}
            </div>
            <div className="metric-label">Shallow Equal</div>
          </div>
          <div className="metric-item">
            <div
              className="metric-value"
              style={{ color: comparisonResults.deep ? '#10b981' : '#ef4444' }}
            >
              {comparisonResults.deep ? '✓' : '✗'}
            </div>
            <div className="metric-label">Deep Equal</div>
          </div>
        </div>

        <div className="user-info">
          <div className="info-item">
            <label>Object 1</label>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {JSON.stringify(obj1)}
            </span>
          </div>
          <div className="info-item">
            <label>Object 2</label>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {JSON.stringify(obj2)}
            </span>
          </div>
        </div>
      </div>
    );
  }
) as React.FC;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AdvancedFeaturesDemo() {
  const [forceRenderKey, setForceRenderKey] = useState(0);

  return (
    <div className="demo-card">
      <h2>🚀 Advanced Features Showcase</h2>
      <p>
        Explore the advanced capabilities of React RX Signals including effects,
        lifecycle management, debouncing, memoization, and signal tracking.
      </p>

      <div className="alert alert-info">
        <strong>🎯 Interactive Demo:</strong> These features work together to
        provide powerful reactive programming patterns. Try the controls below
        to see how each feature responds to signal changes.
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => setForceRenderKey((prev) => prev + 1)}
        >
          🔄 Force Global Re-render ({forceRenderKey})
        </button>
      </div>

      <div className="demo-grid">
        <SignalEffectDemo />
        <LifecycleDemo />
      </div>

      <div className="demo-grid">
        <DebouncedSearchDemo />
        <SignalValueDemo />
      </div>

      <div className="demo-grid">
        <ShallowMemoDemo />
        <SignalTrackingDemo />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <ShallowEqualDemo />
      </div>

      <ul className="features-list">
        <li>
          <strong>useSignalEffect:</strong> Reactive side effects with automatic
          cleanup
        </li>
        <li>
          <strong>useSignalLifecycle:</strong> Component lifecycle hooks tied to
          signals
        </li>
        <li>
          <strong>useDebouncedSignalEffect:</strong> Debounced effects for
          performance optimization
        </li>
        <li>
          <strong>useSignalValue:</strong> Direct signal value access without
          subscriptions
        </li>
        <li>
          <strong>createShallowMemo:</strong> Optimized memoization with shallow
          comparison
        </li>
        <li>
          <strong>withSignalTracking:</strong> Automatic signal dependency
          tracking
        </li>
        <li>
          <strong>shallowEqual:</strong> Utility for shallow object comparison
        </li>
      </ul>
    </div>
  );
}

export default AdvancedFeaturesDemo;
