import React, { useState, useCallback } from 'react';
import {
  createSignal,
  useSignal,
  createSignalMemo,
  createSelector,
} from './index';

// Generate 1000 items for testing
const generateItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.floor(Math.random() * 100),
    selected: false,
  }));

const INITIAL_ITEMS = generateItems(1000);

// Performance Test: useState vs Signals
interface PerformanceTestProps {
  onRenderCount: (component: string, count: number) => void;
}

// Traditional useState approach
const UseStateTest: React.FC<PerformanceTestProps> = ({ onRenderCount }) => {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selectedCount, setSelectedCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);

  React.useEffect(() => {
    const newCount = renderCount + 1;
    setRenderCount(newCount);
    onRenderCount('useState', newCount);
  }, [renderCount, onRenderCount]);

  const toggleItem = useCallback((id: number) => {
    setItems((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      setSelectedCount(newItems.filter((item) => item.selected).length);
      return newItems;
    });
  }, []);

  const selectAll = useCallback(() => {
    setItems((prevItems) => {
      const newItems = prevItems.map((item) => ({ ...item, selected: true }));
      setSelectedCount(newItems.length);
      return newItems;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prevItems) => {
      const newItems = prevItems.map((item) => ({ ...item, selected: false }));
      setSelectedCount(0);
      return newItems;
    });
  }, []);

  return (
    <div>
      <h3>useState Test (Renders: {renderCount})</h3>
      <p>
        Selected: {selectedCount} / {items.length}
      </p>
      <div>
        <button onClick={selectAll}>Select All</button>
        <button onClick={clearAll}>Clear All</button>
      </div>
      <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
        {items.slice(0, 20).map((item) => (
          <UseStateItem
            key={item.id}
            item={item}
            onToggle={toggleItem}
            onRenderCount={onRenderCount}
          />
        ))}
        <p>... and {items.length - 20} more items</p>
      </div>
    </div>
  );
};

const UseStateItem: React.FC<{
  item: (typeof INITIAL_ITEMS)[0];
  onToggle: (id: number) => void;
  onRenderCount: (component: string, count: number) => void;
}> = React.memo(function UseStateItem({ item, onToggle, onRenderCount }) {
  const [renderCount, setRenderCount] = useState(0);

  React.useEffect(() => {
    const newCount = renderCount + 1;
    setRenderCount(newCount);
    onRenderCount(`useState-item-${item.id}`, newCount);
  }, [renderCount, onRenderCount, item.id]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
      <input
        type="checkbox"
        checked={item.selected}
        onChange={() => onToggle(item.id)}
      />
      <span style={{ marginLeft: '5px' }}>
        {item.name} (Renders: {renderCount})
      </span>
    </div>
  );
});

// Signals approach
const [getItems, setItems, items$] = createSignal(INITIAL_ITEMS);
const [_getSelectedCount, setSelectedCount, selectedCount$] = createSignal(0);

// Create fine-grained selectors for each item - outside component to avoid hooks rule
const createItemSelectors = () => {
  const selectors: Record<number, ReturnType<typeof createSelector>> = {};
  INITIAL_ITEMS.forEach((item) => {
    selectors[item.id] = createSelector(
      items$,
      (items) => items.find((i) => i.id === item.id) || item
    );
  });
  return selectors;
};

const itemSelectors = createItemSelectors();

const SignalsTest: React.FC<PerformanceTestProps> = ({ onRenderCount }) => {
  const items = useSignal(items$, INITIAL_ITEMS);
  const selectedCount = useSignal(selectedCount$, 0);
  const [renderCount, setRenderCount] = useState(0);

  React.useEffect(() => {
    const newCount = renderCount + 1;
    setRenderCount(newCount);
    onRenderCount('signals', newCount);
  }, [renderCount, onRenderCount]);

  const toggleItem = useCallback((id: number) => {
    const currentItems = getItems();
    const newItems = currentItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    setItems(newItems);
    setSelectedCount(newItems.filter((item) => item.selected).length);
  }, []);

  const selectAll = useCallback(() => {
    const currentItems = getItems();
    const newItems = currentItems.map((item) => ({ ...item, selected: true }));
    setItems(newItems);
    setSelectedCount(newItems.length);
  }, []);

  const clearAll = useCallback(() => {
    const currentItems = getItems();
    const newItems = currentItems.map((item) => ({ ...item, selected: false }));
    setItems(newItems);
    setSelectedCount(0);
  }, []);

  return (
    <div>
      <h3>Signals Test (Renders: {renderCount})</h3>
      <p>
        Selected: {selectedCount} / {items.length}
      </p>
      <div>
        <button onClick={selectAll}>Select All</button>
        <button onClick={clearAll}>Clear All</button>
      </div>
      <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '10px' }}>
        {items.slice(0, 20).map((item) => (
          <SignalsItem
            key={item.id}
            itemId={item.id}
            onToggle={toggleItem}
            onRenderCount={onRenderCount}
          />
        ))}
        <p>... and {items.length - 20} more items</p>
      </div>
    </div>
  );
};

// Optimized signal item component
const SignalsItem = createSignalMemo<{
  itemId: number;
  onToggle: (id: number) => void;
  onRenderCount: (component: string, count: number) => void;
}>(function SignalsItem({ itemId, onToggle, onRenderCount }) {
  const item = useSignal(
    itemSelectors[itemId],
    INITIAL_ITEMS[itemId]
  ) as (typeof INITIAL_ITEMS)[0];
  const [renderCount, setRenderCount] = useState(0);

  React.useEffect(() => {
    const newCount = renderCount + 1;
    setRenderCount(newCount);
    onRenderCount(`signals-item-${itemId}`, newCount);
  }, [renderCount, onRenderCount, itemId]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
      <input
        type="checkbox"
        checked={item.selected}
        onChange={() => onToggle(itemId)}
      />
      <span style={{ marginLeft: '5px' }}>
        {item.name} (Renders: {renderCount})
      </span>
    </div>
  );
});

// Main performance test component
export const PerformanceTest: React.FC = () => {
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>({});
  const [testResults, setTestResults] = useState<{
    useState: { totalRenders: number; avgItemRenders: number };
    signals: { totalRenders: number; avgItemRenders: number };
  }>({
    useState: { totalRenders: 0, avgItemRenders: 0 },
    signals: { totalRenders: 0, avgItemRenders: 0 },
  });

  const onRenderCount = useCallback((component: string, count: number) => {
    setRenderCounts((prev) => ({ ...prev, [component]: count }));
  }, []);

  React.useEffect(() => {
    const useStateRenders = Object.entries(renderCounts)
      .filter(([key]) => key.startsWith('useState'))
      .reduce((sum, [, count]) => sum + count, 0);

    const useStateItemRenders = Object.entries(renderCounts)
      .filter(([key]) => key.startsWith('useState-item'))
      .map(([, count]) => count);

    const signalsRenders = Object.entries(renderCounts)
      .filter(([key]) => key.startsWith('signals'))
      .reduce((sum, [, count]) => sum + count, 0);

    const signalsItemRenders = Object.entries(renderCounts)
      .filter(([key]) => key.startsWith('signals-item'))
      .map(([, count]) => count);

    setTestResults({
      useState: {
        totalRenders: useStateRenders,
        avgItemRenders:
          useStateItemRenders.length > 0
            ? useStateItemRenders.reduce((a, b) => a + b, 0) /
              useStateItemRenders.length
            : 0,
      },
      signals: {
        totalRenders: signalsRenders,
        avgItemRenders:
          signalsItemRenders.length > 0
            ? signalsItemRenders.reduce((a, b) => a + b, 0) /
              signalsItemRenders.length
            : 0,
      },
    });
  }, [renderCounts]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Performance Test: useState vs Signals (1000 items)</h2>

      <div
        style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}
      >
        <h4>Test Results:</h4>
        <p>
          <strong>useState:</strong> {testResults.useState.totalRenders} total
          renders, {testResults.useState.avgItemRenders.toFixed(1)} avg item
          renders
        </p>
        <p>
          <strong>Signals:</strong> {testResults.signals.totalRenders} total
          renders, {testResults.signals.avgItemRenders.toFixed(1)} avg item
          renders
        </p>
        <p>
          <strong>Performance Improvement:</strong>{' '}
          {testResults.useState.totalRenders > 0 &&
          testResults.signals.totalRenders > 0
            ? `${((testResults.useState.totalRenders / testResults.signals.totalRenders) * 100 - 100).toFixed(1)}% fewer renders with signals`
            : 'Calculating...'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '2px solid #red', padding: '10px' }}>
          <UseStateTest onRenderCount={onRenderCount} />
        </div>

        <div style={{ flex: 1, border: '2px solid #green', padding: '10px' }}>
          <SignalsTest onRenderCount={onRenderCount} />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>
          <strong>Instructions:</strong> Click &quot;Select All&quot; or
          &quot;Clear All&quot; buttons and watch the render counts. The signals
          version should have significantly fewer re-renders.
        </p>
      </div>
    </div>
  );
};
