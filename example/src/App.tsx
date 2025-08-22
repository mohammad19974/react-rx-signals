import React from 'react';
import CounterDemo from './components/CounterDemo';
import StoreDemo from './components/StoreDemo';
import ComputedDemo from './components/ComputedDemo';
import PerformanceDemo from './components/PerformanceDemo';
import RenderComparisonDemo from './components/RenderComparisonDemo';
import TreeRenderDemo from './components/TreeRenderDemo';
import AdvancedFeaturesDemo from './components/AdvancedFeaturesDemo';

function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>React RX Signals</h1>
        <p>
          SolidJS-style signals and stores for React using RxJS. Experience
          fine-grained reactivity with optimal performance.
        </p>
        <div className="alert alert-info">
          <strong>🚀 React 19 Ready!</strong> This demo showcases all features
          running on React 19 with modern concurrent features and improved
          performance.
        </div>
      </header>

      <div className="demo-grid">
        <CounterDemo />
        <StoreDemo />
      </div>

      <div className="demo-grid">
        <ComputedDemo />
        <PerformanceDemo />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <RenderComparisonDemo />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <TreeRenderDemo />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <AdvancedFeaturesDemo />
      </div>
    </div>
  );
}

export default App;
