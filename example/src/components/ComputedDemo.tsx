import React from 'react';
import {
  createSignal,
  createComputed,
  useSignal,
  createSelector,
} from 'react-rx-signals';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

// Create base signals
const [, setRadius, radius$] = createSignal(5);
const [, setHeight, height$] = createSignal(10);

// Computed values that automatically update when dependencies change
const area$ = createComputed(radius$, (radius) => Math.PI * radius * radius);
const circumference$ = createComputed(
  radius$,
  (radius) => 2 * Math.PI * radius
);
const volume$ = combineLatest([radius$, height$]).pipe(
  map(([radius, height]) => Math.PI * radius * radius * height)
);

// Combined selector for expensive calculations
const stats$ = createSelector(
  combineLatest([radius$, area$, circumference$, volume$, height$]),
  ([radius, area, circumference, volume, height]) => ({
    radius: Number(radius.toFixed(2)),
    area: Number(area.toFixed(2)),
    circumference: Number(circumference.toFixed(2)),
    volume: Number(volume.toFixed(2)),
    surfaceArea: Number((2 * Math.PI * radius * (radius + height)).toFixed(2)),
  })
);

function ComputedDemo() {
  const radius = useSignal(radius$, 5);
  const height = useSignal(height$, 10);
  const stats = useSignal(stats$, {
    radius: 5,
    area: 78.54,
    circumference: 31.42,
    volume: 785.4,
    surfaceArea: 471.24,
  });

  return (
    <div className="demo-card">
      <h2>🧮 Computed Values</h2>
      <p>
        Demonstrates automatic computation and derived values with memoization
      </p>

      <div className="user-card">
        <h3>🔧 Input Controls</h3>
        <div className="user-info">
          <div className="info-item">
            <label>📏 Radius</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem',
              }}
            >
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '60px', fontWeight: 'bold' }}>
                {radius.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="info-item">
            <label>📐 Height</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem',
              }}
            >
              <input
                type="range"
                min="1"
                max="30"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '60px', fontWeight: 'bold' }}>
                {height.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="performance-metrics">
        <h3>📊 Computed Results</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">{stats.area}</div>
            <div className="metric-label">Area (π×r²)</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{stats.circumference}</div>
            <div className="metric-label">Circumference (2×π×r)</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{stats.volume}</div>
            <div className="metric-label">Volume (π×r²×h)</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{stats.surfaceArea}</div>
            <div className="metric-label">Surface Area</div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => {
            setRadius(Math.random() * 15 + 1);
            setHeight(Math.random() * 25 + 1);
          }}
        >
          🎲 Random Values
        </button>
        <button
          className="btn btn-warning"
          onClick={() => {
            setRadius(5);
            setHeight(10);
          }}
        >
          🔄 Reset
        </button>
      </div>

      <ul className="features-list">
        <li>Computed values automatically update when dependencies change</li>
        <li>Memoized selectors prevent expensive recalculations</li>
        <li>Derived values can depend on multiple signals</li>
        <li>Reactive calculations with automatic dependency tracking</li>
      </ul>
    </div>
  );
}

export default ComputedDemo;
