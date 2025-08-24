import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createSignal } from '../signal';
import { createStore } from '../store';
import {
  useTrueFineGrainedValue,
  FineGrainedText,
  useFineGrainedAttr,
  useFineGrainedStyle,
  useFineGrainedClass,
  FineGrainedShow,
  FineGrainedFor,
  withFineGrainedReactivity,
  cleanupFineGrainedReactivity,
  getFineGrainedStats,
} from '../useFineGrainedSignal';
import { useSignal } from '../useSignal';

describe('useTrueFineGrainedValue (replacement for useFineGrainedValue)', () => {
  test('should update DOM without re-renders', async () => {
    const [getCount, setCount, count$] = createSignal(0);
    const user = userEvent.setup();

    function TestComponent() {
      const refCb = useTrueFineGrainedValue(count$, 0);
      return (
        <div>
          <span data-testid="count" ref={refCb} />
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
        </div>
      );
    }

    render(<TestComponent />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await user.click(screen.getByTestId('increment'));
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    );
  });
});

describe('FineGrainedText', () => {
  test('should render and update text directly in DOM', async () => {
    const [getCount, setCount, count$] = createSignal(0);
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <span>
            Count: <FineGrainedText source={count$} data-testid="count" />
          </span>
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
  });

  test('should apply transform function', async () => {
    const [getCount, setCount, count$] = createSignal(5);
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <FineGrainedText
            source={count$}
            transform={(c) => `Value: ${c}`}
            data-testid="formatted"
          />
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('formatted')).toHaveTextContent('Value: 5');

    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      expect(screen.getByTestId('formatted')).toHaveTextContent('Value: 6');
    });
  });

  test('should accept className and style props', () => {
    const [getCount, setCount, count$] = createSignal(42);

    function TestComponent() {
      return (
        <FineGrainedText
          source={count$}
          className="test-class"
          style={{ color: 'red', fontWeight: 'bold' }}
          data-testid="styled-text"
        />
      );
    }

    render(<TestComponent />);

    const element = screen.getByTestId('styled-text');
    expect(element).toHaveClass('test-class');
    expect(element).toHaveStyle({ color: 'red', fontWeight: 'bold' });
    expect(element).toHaveTextContent('42');
  });
});

describe('useFineGrainedAttr', () => {
  test('should update DOM attributes directly', async () => {
    const [getProgress, setProgress, progress$] = createSignal(0);
    const user = userEvent.setup();

    function TestComponent() {
      const progressAttrs = useFineGrainedAttr(progress$, 'data-progress');

      return (
        <div>
          <div {...progressAttrs} data-testid="progress-bar">
            Progress Bar
          </div>
          <button
            data-testid="increase"
            onClick={() => setProgress((p) => p + 10)}
          >
            Increase
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('data-progress', '0');

    await user.click(screen.getByTestId('increase'));

    await waitFor(() => {
      expect(progressBar).toHaveAttribute('data-progress', '10');
    });
  });

  test('should apply transform function to attribute values', async () => {
    const [getProgress, setProgress, progress$] = createSignal(50);
    const user = userEvent.setup();

    function TestComponent() {
      const styleAttrs = useFineGrainedAttr(
        progress$,
        'style',
        (p) => `width: ${p}%`
      );

      return (
        <div>
          <div
            {...styleAttrs}
            data-testid="progress-bar"
            style={{ height: '20px', background: 'blue' }}
          >
            Progress
          </div>
          <button data-testid="set-75" onClick={() => setProgress(75)}>
            Set 75%
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute(
      'style',
      expect.stringContaining('width: 50%')
    );

    await user.click(screen.getByTestId('set-75'));

    await waitFor(() => {
      expect(progressBar).toHaveAttribute(
        'style',
        expect.stringContaining('width: 75%')
      );
    });
  });
});

describe('useFineGrainedStyle', () => {
  test('should update element styles directly', async () => {
    const [getColor, setColor, color$] = createSignal('#ff0000');
    const user = userEvent.setup();

    function TestComponent() {
      const colorStyle = useFineGrainedStyle(
        color$,
        (color) => `background-color: ${color}`
      );

      return (
        <div>
          <div
            {...colorStyle}
            data-testid="color-box"
            style={{ width: '100px', height: '100px' }}
          >
            Color Box
          </div>
          <button
            data-testid="change-color"
            onClick={() => setColor('#00ff00')}
          >
            Change Color
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const colorBox = screen.getByTestId('color-box');
    expect(colorBox).toHaveAttribute(
      'style',
      expect.stringContaining('background-color: #ff0000')
    );

    await user.click(screen.getByTestId('change-color'));

    await waitFor(() => {
      expect(colorBox).toHaveAttribute(
        'style',
        expect.stringContaining('background-color: #00ff00')
      );
    });
  });
});

describe('useFineGrainedClass', () => {
  test('should update element classes directly', async () => {
    const [getActive, setActive, active$] = createSignal(false);
    const user = userEvent.setup();

    function TestComponent() {
      const classAttrs = useFineGrainedClass(active$, (active) =>
        active ? 'btn-active' : 'btn-inactive'
      );

      return (
        <div>
          <button
            {...classAttrs}
            data-testid="toggle-btn"
            onClick={() => setActive((a) => !a)}
          >
            Toggle Button
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const button = screen.getByTestId('toggle-btn');
    expect(button).toHaveAttribute('class', 'btn-inactive');

    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('class', 'btn-active');
    });
  });
});

describe('FineGrainedShow', () => {
  test('should conditionally show/hide content', async () => {
    const [getVisible, setVisible, visible$] = createSignal(true);
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <button data-testid="toggle" onClick={() => setVisible((v) => !v)}>
            Toggle
          </button>
          <FineGrainedShow when={visible$}>
            <div data-testid="conditional-content">Conditional Content</div>
          </FineGrainedShow>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('conditional-content')).toBeInTheDocument();

    await user.click(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(
        screen.queryByTestId('conditional-content')
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
    });
  });

  test('should show fallback content when condition is false', async () => {
    const [getVisible, setVisible, visible$] = createSignal(false);
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <button data-testid="toggle" onClick={() => setVisible((v) => !v)}>
            Toggle
          </button>
          <FineGrainedShow
            when={visible$}
            fallback={<div data-testid="fallback">Fallback Content</div>}
          >
            <div data-testid="main-content">Main Content</div>
          </FineGrainedShow>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('main-content')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  test('should handle boolean conversion correctly', async () => {
    const [getValue, setValue, value$] = createSignal<string | number | null>(
      0
    );

    function TestComponent() {
      return (
        <div>
          <FineGrainedShow when={value$}>
            <div data-testid="content">Content</div>
          </FineGrainedShow>
          <button data-testid="set-value" onClick={() => setValue('hello')}>
            Set Value
          </button>
          <button data-testid="set-empty" onClick={() => setValue('')}>
            Set Empty
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    // 0 is falsy
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();

    // Set to truthy value
    act(() => setValue('hello'));
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    // Set to empty string (falsy)
    act(() => setValue(''));
    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });
});

describe('FineGrainedFor', () => {
  test('should render list items and update on changes', async () => {
    const [getItems, setItems, items$] = createSignal(['A', 'B', 'C']);
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <FineGrainedFor each={items$}>
            {(item, index) => (
              <div key={index} data-testid={`item-${index}`}>
                {item} ({index})
              </div>
            )}
          </FineGrainedFor>
          <button
            data-testid="add-item"
            onClick={() => setItems((items) => [...items, 'D'])}
          >
            Add Item
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('item-0')).toHaveTextContent('A (0)');
    expect(screen.getByTestId('item-1')).toHaveTextContent('B (1)');
    expect(screen.getByTestId('item-2')).toHaveTextContent('C (2)');

    await user.click(screen.getByTestId('add-item'));

    await waitFor(() => {
      expect(screen.getByTestId('item-3')).toHaveTextContent('D (3)');
    });
  });

  test('should handle empty arrays', async () => {
    const [getItems, setItems, items$] = createSignal<string[]>([]);

    function TestComponent() {
      return (
        <div>
          <div data-testid="container">
            <FineGrainedFor each={items$}>
              {(item, index) => (
                <div key={index} data-testid={`item-${index}`}>
                  {item}
                </div>
              )}
            </FineGrainedFor>
          </div>
          <button data-testid="add-first" onClick={() => setItems(['First'])}>
            Add First
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('container')).toBeEmptyDOMElement();

    act(() => setItems(['First']));

    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveTextContent('First');
    });
  });
});

describe('withFineGrainedReactivity', () => {
  test('should wrap component and preserve displayName', () => {
    function MyComponent() {
      return <div>Test</div>;
    }
    MyComponent.displayName = 'MyComponent';

    const WrappedComponent = withFineGrainedReactivity(MyComponent);
    expect(WrappedComponent.displayName).toBe('FineGrained(MyComponent)');
  });

  test('should handle anonymous components', () => {
    const AnonymousComponent = () => <div>Anonymous</div>;

    const WrappedComponent = withFineGrainedReactivity(AnonymousComponent);
    expect(WrappedComponent.displayName).toBe(
      'FineGrained(AnonymousComponent)'
    );
  });

  test('should create memoized component', () => {
    const BaseComponent = () => <div data-testid="wrapped">Content</div>;
    const WrappedComponent = withFineGrainedReactivity(BaseComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('wrapped')).toHaveTextContent('Content');
  });
});

describe('Utility functions', () => {
  test('cleanupFineGrainedReactivity should not throw', () => {
    expect(() => cleanupFineGrainedReactivity()).not.toThrow();
  });

  test('getFineGrainedStats should return stats object', () => {
    const stats = getFineGrainedStats();

    expect(stats).toHaveProperty('note');
    expect(stats).toHaveProperty('memoryManagement');
    expect(stats).toHaveProperty('performance');
    expect(typeof stats.note).toBe('string');
    expect(typeof stats.memoryManagement).toBe('string');
    expect(typeof stats.performance).toBe('string');
  });
});

describe('Integration with stores', () => {
  test('should work with store selectors', async () => {
    const [getUser, setUser, user$, selectUser] = createStore({
      name: 'John',
      age: 30,
      email: 'john@example.com',
    });

    const userName$ = selectUser('name');
    const userAge$ = selectUser('age');
    const user = userEvent.setup();

    function TestComponent() {
      const nameRef = useTrueFineGrainedValue(userName$, '');
      const ageRef = useTrueFineGrainedValue(userAge$, 0);

      return (
        <div>
          <div>
            Name: <span data-testid="name" ref={nameRef} />
          </div>
          <div>
            Age: <span data-testid="age" ref={ageRef} />
          </div>
          <button
            data-testid="change-name"
            onClick={() => setUser({ name: 'Jane' })}
          >
            Change Name
          </button>
          <button data-testid="change-age" onClick={() => setUser({ age: 31 })}>
            Change Age
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('name')).toHaveTextContent('John');
    expect(screen.getByTestId('age')).toHaveTextContent('30');

    await user.click(screen.getByTestId('change-name'));

    expect(screen.getByTestId('name')).toHaveTextContent('Jane');

    await user.click(screen.getByTestId('change-age'));

    expect(screen.getByTestId('age')).toHaveTextContent('31');
  });

  test('should work with FineGrainedText components', async () => {
    const [getUser, setUser, user$, selectUser] = createStore({
      name: 'John',
      age: 30,
    });

    const userName$ = selectUser('name');
    const userAge$ = selectUser('age');
    const user = userEvent.setup();

    function TestComponent() {
      return (
        <div>
          <div>
            Name: <FineGrainedText source={userName$} data-testid="name" />
          </div>
          <div>
            Age: <FineGrainedText source={userAge$} data-testid="age" />
          </div>
          <button
            data-testid="change-name"
            onClick={() => setUser({ name: 'Jane' })}
          >
            Change Name
          </button>
          <button data-testid="change-age" onClick={() => setUser({ age: 31 })}>
            Change Age
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('name')).toHaveTextContent('John');
    expect(screen.getByTestId('age')).toHaveTextContent('30');

    await user.click(screen.getByTestId('change-name'));

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Jane');
    });

    await user.click(screen.getByTestId('change-age'));

    await waitFor(() => {
      expect(screen.getByTestId('age')).toHaveTextContent('31');
    });
  });
});

describe('Performance characteristics', () => {
  test('FineGrainedText should prevent parent re-renders from affecting children', async () => {
    const [getCount, setCount, count$] = createSignal(0);
    const user = userEvent.setup();
    let childRenderCount = 0;

    const TestChild = React.memo(() => {
      childRenderCount++;
      return <div data-testid="child">Child component</div>;
    });
    TestChild.displayName = 'TestChild';

    function TestComponent() {
      return (
        <div>
          <p>
            Count: <FineGrainedText source={count$} data-testid="count" />
          </p>
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
          <TestChild />
        </div>
      );
    }

    render(<TestComponent />);

    const initialChildRenders = childRenderCount;
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Increment multiple times - child should not re-render since parent doesn't re-render
    await user.click(screen.getByTestId('increment'));
    await user.click(screen.getByTestId('increment'));
    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });

    // Child render count should remain the same
    expect(childRenderCount).toBe(initialChildRenders);
  });

  test('ref-callback approach prevents re-renders and provides reactive value', async () => {
    const [getCount, setCount, count$] = createSignal(0);
    const user = userEvent.setup();
    let componentRenderCount = 0;
    let childRenderCount = 0;

    const TestChild = React.memo(() => {
      childRenderCount++;
      return <div data-testid="child">Child component</div>;
    });
    TestChild.displayName = 'TestChild';

    function TestComponent() {
      componentRenderCount++;
      const countRef = useTrueFineGrainedValue(count$, 0);

      return (
        <div>
          <p data-testid="count-wrapper">
            Count: <span data-testid="count" ref={countRef} />
          </p>
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
          <TestChild />
        </div>
      );
    }

    render(<TestComponent />);

    const initialComponentRenders = componentRenderCount;
    const initialChildRenders = childRenderCount;

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
    // No re-renders with ref-callback approach
    expect(componentRenderCount).toBe(initialComponentRenders);
    expect(childRenderCount).toBe(initialChildRenders);
  });

  test('useTrueFineGrainedValue should prevent ALL re-renders with ref callback', async () => {
    const [getCount, setCount, count$] = createSignal(0);
    const user = userEvent.setup();
    let componentRenderCount = 0;
    let childRenderCount = 0;

    const TestChild = React.memo(() => {
      childRenderCount++;
      return <div data-testid="child">Child component</div>;
    });
    TestChild.displayName = 'TestChild';

    function TestComponent() {
      componentRenderCount++;
      const countRef = useTrueFineGrainedValue(count$, 0);

      return (
        <div>
          <p data-testid="count-wrapper">
            Count: <span ref={countRef} data-testid="count" />
          </p>
          <button
            data-testid="increment"
            onClick={() => setCount((c) => c + 1)}
          >
            Increment
          </button>
          <TestChild />
        </div>
      );
    }

    render(<TestComponent />);

    const initialComponentRenders = componentRenderCount;
    const initialChildRenders = childRenderCount;

    // Check initial value
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByTestId('increment'));

    // Value should be updated in DOM
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    // ✅ NO re-renders - component renders only once, child never re-renders
    expect(componentRenderCount).toBe(initialComponentRenders);
    expect(childRenderCount).toBe(initialChildRenders);

    // Test multiple updates - still no re-renders
    await user.click(screen.getByTestId('increment'));
    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('3');
    });

    expect(componentRenderCount).toBe(initialComponentRenders); // Still no re-renders!
    expect(childRenderCount).toBe(initialChildRenders); // Child still never re-renders
  });
});
