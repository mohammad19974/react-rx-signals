import React from 'react';
import { autoMemo, staticMemo } from './memo';

/**
 * Hook that automatically memoizes all children to prevent unnecessary re-renders
 * Perfect for components that use signals but want to prevent child re-renders
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const count = useSignal(count$, 0);
 *   const memoizeChildren = useAutoMemo();
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *       {memoizeChildren(<Child />)}
 *       {memoizeChildren(<AnotherChild data="static" />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoMemo() {
  // Simplified cache without complex generics
  const memoCache = React.useRef(
    new WeakMap<React.ComponentType<unknown>, React.ComponentType<unknown>>()
  );

  return React.useCallback(
    (element: React.ReactElement): React.ReactElement => {
      if (!React.isValidElement(element)) {
        return element;
      }

      const Component = element.type as React.ComponentType<unknown>;

      // Skip if already memoized or built-in components
      if (
        typeof Component !== 'function' ||
        (Component as { $$typeof?: unknown }).$$typeof
      ) {
        return element;
      }

      // Check cache first
      let MemoizedComponent = memoCache.current.get(Component);

      if (!MemoizedComponent) {
        MemoizedComponent = autoMemo(Component) as React.ComponentType<unknown>;
        memoCache.current.set(Component, MemoizedComponent);
      }

      return React.createElement(
        MemoizedComponent,
        element.props as React.Attributes
      );
    },
    []
  );
}

/**
 * Decorator to automatically optimize child components
 * Use this around components that use signals to prevent child re-renders
 *
 * @example
 * ```tsx
 * const OptimizedCounter = withAutoMemo(function Counter() {
 *   const count = useSignal(count$, 0);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <Child />
 *       <AnotherChild />
 *     </div>
 *   );
 * });
 * ```
 */
export function withAutoMemo<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const componentName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = React.forwardRef<unknown, T>((props: T, ref) => {
    const memoizeChildren = useAutoMemo();

    // Get the original element
    const originalElement = React.createElement(Component, {
      ...props,
      ref,
    } as T & { ref: unknown });

    // Auto-memoize all children
    if (originalElement.props?.children) {
      const memoizedChildren = React.Children.map(
        originalElement.props.children,
        (child) => {
          if (React.isValidElement(child)) {
            return memoizeChildren(child);
          }
          return child;
        }
      );

      return React.cloneElement(originalElement, {
        ...originalElement.props,
        children: memoizedChildren,
      });
    }

    return originalElement;
  });

  WrappedComponent.displayName = 'WithAutoMemo(' + componentName + ')';

  return WrappedComponent as unknown as React.ComponentType<T>;
}

/**
 * Hook to create a static component that never re-renders
 * Perfect for components with no dependencies
 *
 * @example
 * ```tsx
 * function Parent() {
 *   const count = useSignal(count$, 0);
 *   const StaticChild = useStaticMemo(() =>
 *     React.createElement('div', {}, 'I never re-render!')
 *   );
 *
 *   return React.createElement('div', {},
 *     React.createElement('p', {}, 'Count: ', count),
 *     React.createElement(StaticChild)
 *   );
 * }
 * ```
 */
export function useStaticMemo<T extends Record<string, unknown>>(
  renderFn: () => React.ReactElement<T>
): React.ComponentType<T> {
  return React.useMemo(() => {
    const StaticComponent = () => renderFn();
    return staticMemo(
      StaticComponent as React.ComponentType<T>
    ) as unknown as React.ComponentType<T>;
  }, [renderFn]); // Include renderFn in dependencies
}
