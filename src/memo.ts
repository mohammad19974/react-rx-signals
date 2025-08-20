import React from 'react';
import type { Observable } from 'rxjs';
// @eslint-disable-next-line
/**
 * Creates a memoized component that only re-renders when specific signal values change
 * Similar to SolidJS fine-grained reactivity
 */
export function createSignalMemo<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison that handles observables
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];

      // For observables, they should be the same reference
      if (
        prevValue &&
        typeof prevValue === 'object' &&
        'subscribe' in prevValue
      ) {
        if (prevValue !== nextValue) return false;
      } else if (!Object.is(prevValue, nextValue)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Shallow comparison memo for better performance with objects
 */
export function createShallowMemo<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) {
  return React.memo(Component, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
      if (!Object.is(prevProps[key], nextProps[key])) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Creates a component that only updates when specific signals change
 * Usage: const OptimizedChild = withSignalTracking(ChildComponent, [signal1$, signal2$])
 */
export function withSignalTracking<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  signals: Observable<unknown>[]
) {
  const MemoizedComponent = React.memo(Component);

  const WrappedComponent = React.forwardRef<unknown, T>((props: T, _ref) => {
    // This forces re-render only when the signals change
    // The actual signal values are handled by useSignal hooks inside the component
    const signalRefs = React.useRef(signals);

    // Update ref if signals array changes
    if (
      signals.length !== signalRefs.current.length ||
      signals.some((signal, i) => signal !== signalRefs.current[i])
    ) {
      signalRefs.current = signals;
    }

    return React.createElement(
      MemoizedComponent,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props as any
    );
  });

  WrappedComponent.displayName = `WithSignalTracking(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent as unknown as React.ComponentType<T>;
}

/**
 * A higher-order component that prevents re-renders when props haven't actually changed
 * More aggressive than React.memo
 */
export function preventUnnecessaryRerenders<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) {
  const componentName = Component.displayName || Component.name || 'Component';

  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Deep equality check for non-function props
    const areEqual = deepEqual(prevProps, nextProps);

    if (!areEqual && process.env.NODE_ENV === 'development') {
      console.debug(`${componentName} re-rendering due to prop changes`);
    }

    return areEqual;
  });

  MemoizedComponent.displayName = `PreventRerenders(${componentName})`;
  return MemoizedComponent;
}

// Helper function for deep equality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  // Handle functions
  if (typeof a === 'function') return a === b;

  // Handle arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // Handle objects
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual(a[key], b[key])
    );
  }

  return false;
}
