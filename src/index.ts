export {
  createSignal,
  createComputed,
  createSignalWithMetrics,
  batchSignalUpdates,
  createSignals,
} from './signal';
export {
  createStore,
  createStoreWithMetrics,
  batchStoreUpdates,
  createStores,
  createDeepSelector,
  compareStoreStates,
} from './store';
export {
  useSignal,
  clearSubscriptionPool,
  getSubscriptionPoolStats,
  SignalConditions,
} from './useSignal';
export { useStore, StoreConditions } from './useStore';
export { useSignalLifecycle } from './useSignalLifecycle';
export { useSignalEffect } from './useSignalEffect';
export { useSignalValue } from './useSignalValue';
export { useSignalCallback } from './useSignalCallback';
export { useDebouncedSignalEffect } from './useDebouncedSignalEffect';

// Auto-memoization utilities
export { useAutoMemo, withAutoMemo, useStaticMemo } from './useAutoMemo';

// Fine-grained reactivity (SolidJS-like)
export {
  useFineGrainedValue,
  FineGrainedText,
  useFineGrainedAttr,
  useFineGrainedClass,
  useFineGrainedStyle,
  FineGrainedShow,
  FineGrainedFor,
  withFineGrainedReactivity,
  cleanupFineGrainedReactivity,
  getFineGrainedStats,
} from './useFineGrainedSignal';

// Performance utilities
export {
  createSignalMemo,
  createShallowMemo,
  withSignalTracking,
  preventUnnecessaryRerenders,
  autoMemo,
  staticMemo,
  propsMemo,
  useMemoizedComponent,
  clearMemoizationCaches,
  getMemoizationStats,
} from './memo';

// Selector utilities for fine-grained reactivity
export {
  createSelector,
  createSelectors,
  createDerived,
  createMemoizedSelector,
  shallowEqual,
} from './selectors';
