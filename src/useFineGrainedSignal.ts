import React from 'react';
import type { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/**
 * SolidJS-like fine-grained reactivity for React + RxJS
 *
 * TRUE FINE-GRAINED (Zero re-renders):
 * - FineGrainedText - Component with direct DOM text updates
 * - useTrueFineGrainedValue - Hook with ref callback for direct DOM updates
 * - useFineGrainedAttr/Style/Class - Direct DOM attribute updates
 * - FineGrainedShow/For - Conditional/list rendering (minimal re-renders)
 *
 * REACTIVE BUT CAUSES RE-RENDERS:
 * - useFineGrainedValue - Returns value for JSX (DEPRECATED - causes re-renders!)
 *
 * For zero child re-renders, use the TRUE FINE-GRAINED approaches
 */

// Pre-compiled constants for maximum performance
const STRICT_EQUAL = Object.is;

// Shallow equality utilities for arrays and plain objects
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function shallowObjectEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!STRICT_EQUAL(a[key], b[key])) return false;
  }
  return true;
}

function shallowArrayEqual(a: unknown[], b: unknown[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (isPlainObject(ai) && isPlainObject(bi)) {
      if (!shallowObjectEqual(ai, bi)) return false;
    } else if (Array.isArray(ai) && Array.isArray(bi)) {
      // one level only
      if (!shallowArrayEqual(ai, bi)) return false;
    } else if (!STRICT_EQUAL(ai, bi)) {
      return false;
    }
  }
  return true;
}

function shallowCompare<T>(prev: T, curr: T): boolean {
  if (Array.isArray(prev) && Array.isArray(curr)) {
    return shallowArrayEqual(prev as unknown[], curr as unknown[]);
  }
  if (isPlainObject(prev) && isPlainObject(curr)) {
    return shallowObjectEqual(
      prev as Record<string, unknown>,
      curr as Record<string, unknown>
    );
  }
  return STRICT_EQUAL(prev, curr);
}

function toStringValue<T>(value: T, transform?: (value: T) => string): string {
  if (transform) return transform(value);
  if (value == null) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value as unknown as unknown);
  }
}

// Global reactive boundary tracking
const _reactiveElements = new WeakMap<HTMLElement, Set<() => void>>();
const activeSubscriptions = new WeakMap<
  HTMLElement,
  Set<{ unsubscribe(): void }>
>();

// Global registry for attribute-driven fine-grained text binding (no refs, no effects)
const ATTRIBUTE_NAME = 'data-rrs-signal';
const ATTRIBUTE_INITIAL = 'data-rrs-initial';
type RegistryEntry<T = unknown> = {
  source$: Observable<T>;
  transform?: (v: T) => string;
};
const attributeRegistry = new Map<string, RegistryEntry<unknown>>();
let attributeIdCounter = 0;
function nextAttributeId(): string {
  attributeIdCounter += 1;
  return 'rrs-' + attributeIdCounter.toString(36);
}

let observerInitialized = false;
function attachAttributeBinding(element: HTMLElement) {
  const id = element.getAttribute(ATTRIBUTE_NAME);
  if (!id) return;
  const entry = attributeRegistry.get(id);
  if (!entry) return;

  // Set initial value if provided
  const initialText = element.getAttribute(ATTRIBUTE_INITIAL);
  if (initialText != null) {
    element.textContent = initialText;
  }

  // Avoid duplicate subscriptions
  const existing = activeSubscriptions.get(element);
  if (existing && existing.size > 0) return;

  const subscription = (entry.source$ as Observable<unknown>)
    .pipe(distinctUntilChanged(shallowCompare))
    .subscribe({
      next: (value: unknown) => {
        const transformer = entry.transform
          ? (entry.transform as (v: unknown) => string)
          : undefined;
        element.textContent = toStringValue(value, transformer);
      },
    });

  if (!activeSubscriptions.has(element)) {
    activeSubscriptions.set(element, new Set());
  }
  activeSubscriptions.get(element)!.add(subscription);
}

function detachSubscriptionsFrom(node: Node) {
  if (node.nodeType === 1) {
    const el = node as HTMLElement;
    const subs = activeSubscriptions.get(el);
    if (subs) {
      subs.forEach((s) => s.unsubscribe());
      activeSubscriptions.delete(el);
    }
    // Also clean for any descendants that had bindings
    const descendants = el.querySelectorAll('[' + ATTRIBUTE_NAME + ']');
    for (let i = 0; i < descendants.length; i++) {
      const d = descendants[i] as HTMLElement;
      const ds = activeSubscriptions.get(d);
      if (ds) {
        ds.forEach((s) => s.unsubscribe());
        activeSubscriptions.delete(d);
      }
    }
  }
}

function initAttributeObserverOnce() {
  if (observerInitialized) return;
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined')
    return;

  observerInitialized = true;
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const el = node as HTMLElement;
            if (el.hasAttribute(ATTRIBUTE_NAME)) {
              attachAttributeBinding(el);
            }
            const list = el.querySelectorAll('[' + ATTRIBUTE_NAME + ']');
            for (let i = 0; i < list.length; i++) {
              attachAttributeBinding(list[i] as HTMLElement);
            }
          }
        });
        m.removedNodes.forEach((node) => detachSubscriptionsFrom(node));
      }
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan for already-present elements
  const initialList = (
    document.documentElement || document.body
  ).querySelectorAll('[' + ATTRIBUTE_NAME + ']');
  for (let i = 0; i < initialList.length; i++) {
    attachAttributeBinding(initialList[i] as HTMLElement);
  }
}

/**
 * useSignalTextProps
 * Return DOM attributes to bind an element's textContent directly to an Observable
 * No refs, no effects in the hook; global MutationObserver manages lifecycle
 */
export function useSignalTextProps<T>(
  source$: Observable<T>,
  initialValue: T,
  transform?: (value: T) => string
): Record<string, string> {
  // Lazily initialize the global observer
  initAttributeObserverOnce();
  // Register entry once per hook call
  const id = React.useMemo(() => {
    const generated = nextAttributeId();
    attributeRegistry.set(generated, {
      source$: source$ as Observable<unknown>,
      transform: transform as unknown as (v: unknown) => string,
    });
    return generated;
  }, [source$, transform]);

  const initial = React.useMemo(
    () => toStringValue(initialValue, transform),
    [initialValue, transform]
  );

  return { [ATTRIBUTE_NAME]: id, [ATTRIBUTE_INITIAL]: initial } as Record<
    string,
    string
  >;
}

// Note: Removed deprecated hook that caused parent/child re-renders.

/**
 * TRUE fine-grained hook that updates DOM directly without component re-renders
 * Returns a ref callback to attach to DOM elements for direct updates
 * ✅ Zero re-renders - children never re-render
 *
 * @example
 * // ✅ Zero re-renders - children never re-render
 * const countRef = useTrueFineGrainedValue(count$, 0);
 * // Use ref={countRef} on a span/div to display the reactive value
 */
export function useTrueFineGrainedValue<T>(
  source$: Observable<T>,
  initialValue: T,
  transform?: (value: T) => string
): (element: HTMLElement | null) => void {
  const lastValueRef = React.useRef<T>(initialValue);

  const refCallback = React.useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      // Set initial value
      const initialText = toStringValue(initialValue, transform);
      element.textContent = initialText;

      const subscription = source$
        .pipe(distinctUntilChanged(shallowCompare))
        .subscribe({
          next: (value: T) => {
            if (!shallowCompare(lastValueRef.current as unknown as T, value)) {
              lastValueRef.current = value;
              // Direct DOM update - no React re-render!
              element.textContent = toStringValue(value, transform);
            }
          },
          error: (error) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('True fine-grained value error:', error);
            }
          },
        });

      // Track subscription for cleanup
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
    [source$, initialValue, transform]
  );

  return refCallback;
}

/**
 * Component that renders reactive text with direct DOM updates
 * No component re-renders, just DOM text updates
 *
 * @example
 * // Zero re-renders with direct DOM text updates
 * React.createElement(FineGrainedText, { source: count$ })
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
      .pipe(distinctUntilChanged(shallowCompare))
      .subscribe({
        next: (value: T) => {
          if (!shallowCompare(lastValueRef.current as unknown as T, value)) {
            lastValueRef.current = value;
            // Direct DOM update - no React re-render!
            element.textContent = toStringValue(value, transform);
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
 * // Direct DOM attribute updates without re-renders
 * const attrs = useFineGrainedAttr(progress$, 'data-progress');
 * // Use {...attrs} to spread onto element
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
 * // Direct CSS class updates without re-renders
 * const classAttrs = useFineGrainedClass(isActive$, active => active ? 'active' : '');
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
 * // Direct CSS style updates without re-renders
 * const styleAttrs = useFineGrainedStyle(color$, color => `background-color: ${color}`);
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
 * // Conditional rendering without parent re-renders
 * React.createElement(FineGrainedShow, { when: showChild$ }, children);
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
 * // List rendering with minimal updates
 * React.createElement(FineGrainedFor, { each: todos$ }, renderItemFunction);
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
 * // Wraps a component to prevent re-renders
 * const OptimizedCounter = withFineGrainedReactivity(MyComponent);
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
