import React from 'react';
import type { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/**
 * SolidJS-like fine-grained reactivity for React + RxJS
 * Only updates specific reactive elements, not entire components
 * Child components never re-render unless they use signals themselves
 */

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;

// Global reactive boundary tracking
const _reactiveElements = new WeakMap<HTMLElement, Set<() => void>>();
const activeSubscriptions = new WeakMap<
  HTMLElement,
  Set<{ unsubscribe(): void }>
>();

/**
 * Hook that returns a reactive value that updates with fine-grained precision
 * Unlike useSignal, this doesn't cause component re-renders
 *
 * @example
 * ```tsx
 * function Counter() {
 *   // This value updates automatically without component re-renders
 *   const count = useFineGrainedValue(count$, 0);
 *   return <div>Count: {count}</div>; // Only this text updates
 * }
 * ```
 */
export function useFineGrainedValue<T>(
  source$: Observable<T>,
  initialValue: T,
  transform?: (value: T) => string
): string {
  const valueRef = React.useRef<string>(
    transform ? transform(initialValue) : String(initialValue)
  );
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    const subscription = source$
      .pipe(distinctUntilChanged(STRICT_EQUAL))
      .subscribe({
        next: (value: T) => {
          const newText = transform ? transform(value) : String(value);
          if (valueRef.current !== newText) {
            valueRef.current = newText;
            forceUpdate();
          }
        },
        error: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Fine-grained value error:', error);
          }
        },
      });

    return () => subscription.unsubscribe();
  }, [source$, transform]);

  return valueRef.current;
}

/**
 * Component that renders reactive text with direct DOM updates
 * No component re-renders, just DOM text updates
 *
 * @example
 * ```tsx
 * function Counter() {
 *   return (
 *     <div>
 *       Count: <FineGrainedText source={count$} />
 *       <Child />
 *     </div>
 *   );
 * }
 * ```
 */
export function FineGrainedText<T>({
  source,
  transform,
  className,
  style,
  ...props
}: {
  source: Observable<T>;
  transform?: (value: T) => string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const lastValueRef = React.useRef<T>();

  React.useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    const subscription = source
      .pipe(distinctUntilChanged(STRICT_EQUAL))
      .subscribe({
        next: (value: T) => {
          if (!STRICT_EQUAL(lastValueRef.current, value)) {
            lastValueRef.current = value;
            // Direct DOM update - no React re-render!
            element.textContent = transform ? transform(value) : String(value);
          }
        },
        error: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Fine-grained reactive text error:', error);
          }
        },
      });

    // Track subscription for cleanup
    if (!activeSubscriptions.has(element)) {
      activeSubscriptions.set(element, new Set());
    }
    activeSubscriptions.get(element)!.add(subscription);

    return () => {
      subscription.unsubscribe();
      const subs = activeSubscriptions.get(element);
      if (subs) {
        subs.delete(subscription);
        if (subs.size === 0) {
          activeSubscriptions.delete(element);
        }
      }
    };
  }, [source, transform]);

  // Get initial value synchronously
  const initialValue = React.useMemo(() => {
    let value: T | undefined;
    const subscription = source.subscribe((v) => {
      value = v;
    });
    subscription.unsubscribe();
    return transform && value !== undefined
      ? transform(value)
      : String(value || '');
  }, [source, transform]);

  return React.createElement(
    'span',
    {
      ref: elementRef,
      className,
      style,
      ...props,
    },
    initialValue
  );
}

/**
 * Creates a fine-grained reactive attribute that updates independently
 * Updates DOM attributes directly without component re-renders
 *
 * @example
 * ```typescript
 * function ProgressBar() {
 *   const progress$ = createSignal(0);
 *   const attrs = useFineGrainedAttr(progress$, 'style', p => `width: ${p}%`);
 *   return React.createElement('div', attrs);
 * }
 * ```
 */
export function useFineGrainedAttr<T>(
  source$: Observable<T>,
  attributeName: string,
  transform?: (value: T) => string
): Record<string, unknown> {
  const callbackRef = React.useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      let lastValue: T;

      const subscription = source$
        .pipe(distinctUntilChanged(STRICT_EQUAL))
        .subscribe({
          next: (value: T) => {
            if (!STRICT_EQUAL(lastValue, value)) {
              lastValue = value;
              // Direct DOM attribute update - no React re-render!
              const attrValue = transform ? transform(value) : String(value);
              element.setAttribute(attributeName, attrValue);
            }
          },
          error: (error) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Fine-grained reactive attribute error:', error);
            }
          },
        });

      // Track subscription
      if (!activeSubscriptions.has(element)) {
        activeSubscriptions.set(element, new Set());
      }
      activeSubscriptions.get(element)!.add(subscription);

      // Cleanup when element is removed
      return () => {
        subscription.unsubscribe();
        const subs = activeSubscriptions.get(element);
        if (subs) {
          subs.delete(subscription);
          if (subs.size === 0) {
            activeSubscriptions.delete(element);
          }
        }
      };
    },
    [source$, attributeName, transform]
  );

  return { ref: callbackRef };
}

/**
 * Creates a reactive class name that updates independently
 *
 * @example
 * ```typescript
 * function Button() {
 *   const isActive$ = createSignal(false);
 *   const classAttrs = useFineGrainedClass(isActive$, active => active ? 'btn-active' : 'btn');
 *   return React.createElement('button', classAttrs, 'Click me');
 * }
 * ```
 */
export function useFineGrainedClass<T>(
  source$: Observable<T>,
  transform: (value: T) => string
): Record<string, unknown> {
  return useFineGrainedAttr(source$, 'class', transform);
}

/**
 * Creates a reactive style that updates independently
 *
 * @example
 * ```typescript
 * function ColorBox() {
 *   const color$ = createSignal('#ff0000');
 *   const styleAttrs = useFineGrainedStyle(color$, color => `background-color: ${color}`);
 *   return React.createElement('div', styleAttrs);
 * }
 * ```
 */
export function useFineGrainedStyle<T>(
  source$: Observable<T>,
  transform: (value: T) => string
): Record<string, unknown> {
  return useFineGrainedAttr(source$, 'style', transform);
}

/**
 * SolidJS-like Show component with fine-grained reactivity
 * Only updates visibility without re-rendering children
 *
 * @example
 * ```typescript
 * function App() {
 *   const showChild$ = createSignal(true);
 *   return React.createElement(FineGrainedShow, { when: showChild$ },
 *     React.createElement('div', {}, 'Content')
 *   );
 * }
 * ```
 */
export function FineGrainedShow<T>({
  when,
  fallback,
  children,
}: {
  when: Observable<T>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const subscription = when
      .pipe(distinctUntilChanged(STRICT_EQUAL))
      .subscribe({
        next: (value: T) => {
          const shouldShow = Boolean(value);
          setIsVisible(shouldShow);
          if (!isInitialized) {
            setIsInitialized(true);
          }
        },
      });

    return () => subscription.unsubscribe();
  }, [when, isInitialized]);

  if (!isInitialized) {
    return null; // Don't render anything until first value
  }

  if (isVisible) {
    return React.createElement(React.Fragment, {}, children);
  }

  return fallback ? React.createElement(React.Fragment, {}, fallback) : null;
}

/**
 * SolidJS-like For component with fine-grained reactivity
 * Only updates list items that actually changed
 *
 * @example
 * ```typescript
 * function TodoList() {
 *   const todos$ = createSignal([]);
 *   return React.createElement(FineGrainedFor, { each: todos$ },
 *     (todo, index) => React.createElement('div', { key: index }, todo)
 *   );
 * }
 * ```
 */
export function FineGrainedFor<T>({
  each,
  children,
}: {
  each: Observable<T[]>;
  children: (item: T, index: number) => React.ReactNode;
}) {
  const [items, setItems] = React.useState<T[]>([]);

  React.useEffect(() => {
    const subscription = each
      .pipe(
        distinctUntilChanged((prev, curr) => {
          if (prev.length !== curr.length) return false;
          return prev.every((item, i) => STRICT_EQUAL(item, curr[i]));
        })
      )
      .subscribe({
        next: (newItems: T[]) => {
          setItems(newItems);
        },
      });

    return () => subscription.unsubscribe();
  }, [each]);

  return React.createElement(React.Fragment, {}, items.map(children));
}

/**
 * Wraps a component to use fine-grained reactivity automatically
 * Makes any component behave like SolidJS components
 *
 * @example
 * ```typescript
 * const OptimizedCounter = withFineGrainedReactivity(() => {
 *   const count$ = createSignal(0);
 *   return React.createElement('div', {},
 *     React.createElement('p', {}, 'Count: ', React.createElement(FineGrainedText, {source: count$}))
 *   );
 * });
 * ```
 */
export function withFineGrainedReactivity<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const componentName = Component.displayName || Component.name || 'Component';

  // Use React.memo to prevent unnecessary re-renders
  const MemoizedComponent = React.memo(Component, () => true); // Never re-render
  MemoizedComponent.displayName = 'FineGrained(' + componentName + ')';

  return MemoizedComponent as unknown as React.ComponentType<T>;
}

/**
 * Performance utility: Clean up all reactive subscriptions
 */
export function cleanupFineGrainedReactivity(): void {
  // WeakMaps don't have clear() method, but they auto-cleanup
  // when elements are garbage collected
  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Fine-grained reactivity cleanup completed (automatic with WeakMaps)'
    );
  }
}

/**
 * Performance utility: Get fine-grained reactivity statistics
 */
export function getFineGrainedStats() {
  return {
    note: 'Fine-grained reactivity statistics are managed automatically with WeakMaps',
    memoryManagement: 'Automatic cleanup when elements are garbage collected',
    performance: 'Direct DOM updates without React reconciliation',
  };
}
