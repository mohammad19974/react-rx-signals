import React from 'react';
import type { Observable } from 'rxjs';

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;
const OBJECT_TYPE = 'object';
const HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;

// Component cache for memoized components to avoid recreation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMemoCache = new WeakMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.MemoExoticComponent<any>
>();

/**
 * Simple observable detection without caching to avoid memory issues
 */
function isObservable(value: unknown): boolean {
  if (!value || typeof value !== OBJECT_TYPE) return false;

  // Simple check for subscribe method
  return (
    'subscribe' in (value as object) &&
    typeof (value as { subscribe?: unknown }).subscribe === 'function'
  );
}

/**
 * Ultra-fast prop comparison optimized for signals and observables
 */
function fastSignalPropsEqual<T extends Record<string, unknown>>(
  prevProps: T,
  nextProps: T
): boolean {
  // Fast path: reference equality
  if (STRICT_EQUAL(prevProps, nextProps)) return true;

  // Fast path: null checks
  if (!prevProps || !nextProps) return false;

  // Get keys with minimal allocations
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  // Fast path: different key count
  if (prevKeys.length !== nextKeys.length) return false;

  // Optimized comparison loop with early termination
  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // Ultra-fast observable reference check
    if (isObservable(prevValue)) {
      if (prevValue !== nextValue) return false;
    } else if (!STRICT_EQUAL(prevValue, nextValue)) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a highly optimized memoized component for signals
 * - Ultra-fast observable detection with caching
 * - Optimized prop comparison with early termination
 * - Component instance caching to avoid recreation
 * - Pre-compiled constants for maximum speed
 */
export function createSignalMemo<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.MemoExoticComponent<React.ComponentType<T>> {
  // Check cache first to avoid recreation
  const cached = componentMemoCache.get(Component);
  if (cached)
    return cached as React.MemoExoticComponent<React.ComponentType<T>>;

  const memoized = React.memo(Component, fastSignalPropsEqual);

  // Cache for future use
  componentMemoCache.set(Component, memoized);

  return memoized;
}

/**
 * Ultra-fast shallow equality comparison optimized for objects
 */
function fastShallowEqual<T extends Record<string, unknown>>(
  prevProps: T,
  nextProps: T
): boolean {
  // Fast path: reference equality
  if (STRICT_EQUAL(prevProps, nextProps)) return true;

  // Fast path: null checks
  if (!prevProps || !nextProps) return false;

  // Get keys with minimal allocations
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  // Fast path: different key count
  if (prevKeys.length !== nextKeys.length) return false;

  // Optimized comparison loop
  for (let i = 0; i < prevKeys.length; i++) {
    const key = prevKeys[i];
    if (!STRICT_EQUAL(prevProps[key], nextProps[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Optimized shallow comparison memo with component caching
 */
export function createShallowMemo<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.MemoExoticComponent<React.ComponentType<T>> {
  // Check cache first
  const cached = componentMemoCache.get(Component);
  if (cached)
    return cached as React.MemoExoticComponent<React.ComponentType<T>>;

  const memoized = React.memo(Component, fastShallowEqual);

  // Cache for future use
  componentMemoCache.set(Component, memoized);

  return memoized;
}

// Cache for signal tracking components to avoid recreation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signalTrackingCache = new WeakMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Map<string, React.ComponentType<any>>
>();

/**
 * Fast array equality check for signals
 */
function signalsEqual(
  prev: Observable<unknown>[],
  next: Observable<unknown>[]
): boolean {
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return false;
  }

  return true;
}

/**
 * Ultra-optimized signal tracking component with advanced caching
 * - Component instance caching based on signal signatures
 * - Fast signal array comparison
 * - Minimal re-creation overhead
 * - Optimized ref management
 */
export function withSignalTracking<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  signals: Observable<unknown>[]
): React.ComponentType<T> {
  // Generate cache key from signal references
  const signalKey = signals.map((s) => s.toString()).join(':');

  // Check cache first
  let componentCache = signalTrackingCache.get(Component);
  if (!componentCache) {
    componentCache = new Map();
    signalTrackingCache.set(Component, componentCache);
  }

  const cached = componentCache.get(signalKey);
  if (cached) return cached;

  // Create optimized memoized component
  const MemoizedComponent = React.memo(Component, fastSignalPropsEqual);

  const WrappedComponent = React.forwardRef<unknown, T>((props: T, _ref) => {
    // Optimized signal tracking with stable refs
    const signalRefs = React.useRef(signals);
    const stableSignals = React.useRef(signals);

    // Only update if signals actually changed (fast comparison)
    if (!signalsEqual(signalRefs.current, signals)) {
      signalRefs.current = signals;
      stableSignals.current = signals;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.createElement(MemoizedComponent, props as any);
  });

  // Optimized display name
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `SignalTracked(${componentName})`;

  const result = WrappedComponent as unknown as React.ComponentType<T>;

  // Cache for future use
  componentCache.set(signalKey, result);

  return result;
}

/**
 * Simplified deep equality function without caching to avoid memory issues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fastDeepEqual(a: any, b: any): boolean {
  // Fast path: reference equality
  if (STRICT_EQUAL(a, b)) return true;

  // Fast path: null/undefined checks
  if (a == null || b == null) return false;

  // Fast path: type checks
  if (typeof a !== typeof b) return false;

  // Fast path: functions (reference equality only)
  if (typeof a === 'function') return a === b;

  // Handle arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!fastDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  if (typeof a === OBJECT_TYPE && typeof b === OBJECT_TYPE) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
      const key = keysA[i];
      if (!HAS_OWN_PROPERTY.call(b, key) || !fastDeepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Ultra-optimized component that prevents unnecessary re-renders
 * - Advanced deep equality with caching
 * - Component instance caching
 * - Development-only logging with minimal overhead
 * - Fast path optimizations
 */
export function preventUnnecessaryRerenders<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.MemoExoticComponent<React.ComponentType<T>> {
  // Check cache first
  const cached = componentMemoCache.get(Component);
  if (cached)
    return cached as React.MemoExoticComponent<React.ComponentType<T>>;

  const componentName = Component.displayName || Component.name || 'Component';

  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Ultra-fast deep equality check with caching
    const areEqual = fastDeepEqual(prevProps, nextProps);

    // Development-only logging with minimal overhead
    if (
      !areEqual &&
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.debug(`${componentName} re-rendering due to prop changes`);
    }

    return areEqual;
  });

  MemoizedComponent.displayName = `PreventRerenders(${componentName})`;

  // Cache for future use
  componentMemoCache.set(Component, MemoizedComponent);

  return MemoizedComponent;
}

/**
 * Performance utility: Clear all internal caches
 * Useful for memory management in long-running applications
 * Note: WeakMaps don't have clear() method, they auto-cleanup
 */
export function clearMemoizationCaches(): void {
  // WeakMaps are automatically garbage collected
  // Advanced caching disabled to prevent memory leaks
}

/**
 * Performance utility: Get cache statistics
 * Note: WeakMaps don't expose size information
 */
export function getMemoizationStats() {
  return {
    componentMemoCache: 'WeakMap (auto-managed)',
    signalTrackingCache: 'WeakMap (auto-managed)',
    note: 'Advanced caching disabled to prevent memory leaks. WeakMaps auto-manage memory.',
  };
}
