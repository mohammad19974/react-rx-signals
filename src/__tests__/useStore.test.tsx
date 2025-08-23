import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createStore } from '../store';
import { useStore, StoreConditions } from '../useStore';
import { BehaviorSubject } from 'rxjs';

interface UserState {
  name: string;
  age: number;
  email: string;
}

describe('useStore', () => {
  test('should render initial store state', () => {
    function UserProfile() {
      const [getUser, setUser, user$, selectUser] = createStore<UserState>({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      });

      const user = useStore(user$, getUser());

      return (
        <div>
          <span data-testid="name">{user.name}</span>
          <span data-testid="age">{user.age}</span>
          <span data-testid="email">{user.email}</span>
        </div>
      );
    }

    render(<UserProfile />);

    expect(screen.getByTestId('name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('age')).toHaveTextContent('30');
    expect(screen.getByTestId('email')).toHaveTextContent('john@example.com');
  });

  test('should update when store changes', async () => {
    const [getUser, setUser, user$, selectUser] = createStore<UserState>({
      name: 'Jane Smith',
      age: 25,
      email: 'jane@example.com',
    });

    function UserProfile() {
      const user = useStore(user$, getUser());

      return (
        <div>
          <span data-testid="name">{user.name}</span>
          <span data-testid="age">{user.age}</span>
          <button
            data-testid="increment-age"
            onClick={() => setUser({ age: user.age + 1 })}
          >
            Increment Age
          </button>
          <button
            data-testid="change-name"
            onClick={() => setUser({ name: 'Jane Doe' })}
          >
            Change Name
          </button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<UserProfile />);

    expect(screen.getByTestId('age')).toHaveTextContent('25');
    expect(screen.getByTestId('name')).toHaveTextContent('Jane Smith');

    await user.click(screen.getByTestId('increment-age'));
    expect(screen.getByTestId('age')).toHaveTextContent('26');

    await user.click(screen.getByTestId('change-name'));
    expect(screen.getByTestId('name')).toHaveTextContent('Jane Doe');
  });

  test('should work with store selectors', async () => {
    const [getUser, setUser, user$, selectUser] = createStore<UserState>({
      name: 'Bob Wilson',
      age: 35,
      email: 'bob@example.com',
    });

    function UserName() {
      const name = useStore(selectUser('name'), '');
      return <span data-testid="selected-name">{name}</span>;
    }

    function UserAge() {
      const age = useStore(selectUser('age'), 0);
      return <span data-testid="selected-age">{age}</span>;
    }

    function Controls() {
      return (
        <div>
          <button
            data-testid="update-name"
            onClick={() => setUser({ name: 'Robert Wilson' })}
          >
            Update Name
          </button>
          <button data-testid="update-age" onClick={() => setUser({ age: 36 })}>
            Update Age
          </button>
        </div>
      );
    }

    function App() {
      return (
        <div>
          <UserName />
          <UserAge />
          <Controls />
        </div>
      );
    }

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('selected-name')).toHaveTextContent('Bob Wilson');
    expect(screen.getByTestId('selected-age')).toHaveTextContent('35');

    await user.click(screen.getByTestId('update-name'));
    expect(screen.getByTestId('selected-name')).toHaveTextContent(
      'Robert Wilson'
    );
    expect(screen.getByTestId('selected-age')).toHaveTextContent('35'); // Should not change

    await user.click(screen.getByTestId('update-age'));
    expect(screen.getByTestId('selected-name')).toHaveTextContent(
      'Robert Wilson'
    ); // Should not change
    expect(screen.getByTestId('selected-age')).toHaveTextContent('36');
  });

  test('should handle multiple components with different selectors', async () => {
    const [getSettings, setSettings, settings$, selectSettings] = createStore({
      theme: 'light',
      notifications: true,
      language: 'en',
    });

    function ThemeDisplay() {
      const theme = useStore(selectSettings('theme'), 'light');
      return <span data-testid="theme">{theme}</span>;
    }

    function NotificationDisplay() {
      const notifications = useStore(selectSettings('notifications'), false);
      return (
        <span data-testid="notifications">{notifications.toString()}</span>
      );
    }

    function Controls() {
      return (
        <button
          data-testid="toggle-theme"
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              theme: prev.theme === 'light' ? 'dark' : 'light',
            }))
          }
        >
          Toggle Theme
        </button>
      );
    }

    function App() {
      return (
        <div>
          <ThemeDisplay />
          <NotificationDisplay />
          <Controls />
        </div>
      );
    }

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('notifications')).toHaveTextContent('true');

    await user.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('notifications')).toHaveTextContent('true'); // Should not change
  });

  describe('RxJS Optimizations', () => {
    test('should prevent repetitive values with distinctUntilChanged', async () => {
      const mockSubscriber = jest.fn();
      const [getUser, setUser, user$] = createStore({ name: 'John', age: 30 });

      function TestComponent() {
        const user = useStore(user$, getUser());
        React.useEffect(() => {
          mockSubscriber(user);
        }, [user]);
        return <span data-testid="user-name">{user.name}</span>;
      }

      render(<TestComponent />);

      // Set the same value multiple times
      act(() => setUser({ name: 'Jane' }));
      act(() => setUser({ name: 'Jane' })); // Should not trigger re-render (same shallow equality)
      act(() => setUser({ name: 'Bob' })); // Should trigger re-render

      // Should only be called for: initial, first change, and different value
      expect(mockSubscriber).toHaveBeenCalledTimes(3);
      expect(mockSubscriber).toHaveBeenNthCalledWith(1, {
        name: 'John',
        age: 30,
      });
      expect(mockSubscriber).toHaveBeenNthCalledWith(2, {
        name: 'Jane',
        age: 30,
      });
      expect(mockSubscriber).toHaveBeenNthCalledWith(3, {
        name: 'Bob',
        age: 30,
      });
    });

    test('should work with conditional takeWhile', async () => {
      const [getUser, setUser, user$] = createStore({
        name: 'John',
        age: 30,
        active: true,
      });

      function ConditionalComponent() {
        const user = useStore(user$, getUser(), {
          condition: (user) => user.active, // Stop when user becomes inactive
        });
        return (
          <div>
            <span data-testid="conditional-name">{user.name}</span>
            <span data-testid="conditional-active">
              {user.active.toString()}
            </span>
          </div>
        );
      }

      render(<ConditionalComponent />);
      expect(screen.getByTestId('conditional-name')).toHaveTextContent('John');
      expect(screen.getByTestId('conditional-active')).toHaveTextContent(
        'true'
      );

      // Active user updates should work
      act(() => setUser({ name: 'Jane' }));
      expect(screen.getByTestId('conditional-name')).toHaveTextContent('Jane');

      // Make user inactive - should stop subscription
      act(() => setUser({ active: false }));
      expect(screen.getByTestId('conditional-name')).toHaveTextContent('Jane'); // Should remain Jane
      expect(screen.getByTestId('conditional-active')).toHaveTextContent(
        'true'
      ); // Should remain true

      // Further updates should not work
      act(() => setUser({ name: 'Bob' }));
      expect(screen.getByTestId('conditional-name')).toHaveTextContent('Jane'); // Should remain Jane
    });

    test('should work with StoreConditions.whileTruthy', async () => {
      // Use an object with data that can be falsy/truthy
      const [getState, setState, state$] = createStore({
        data: 'hello',
        valid: true,
      });

      function TruthyComponent() {
        const state = useStore(state$, getState(), {
          condition: StoreConditions.whileTruthy,
        });
        return <span data-testid="truthy-data">{state.data}</span>;
      }

      render(<TruthyComponent />);
      expect(screen.getByTestId('truthy-data')).toHaveTextContent('hello');

      // Truthy values should update
      act(() => setState({ data: 'world' }));
      expect(screen.getByTestId('truthy-data')).toHaveTextContent('world');

      // The object itself is always truthy, so this test should work differently
      // Let's test that updates continue to work
      act(() => setState({ data: 'test' }));
      expect(screen.getByTestId('truthy-data')).toHaveTextContent('test');
    });

    test('should work with StoreConditions.whilePropertyEquals', async () => {
      const [getState, setState, state$] = createStore({
        status: 'loading',
        data: null as string | null,
      });

      function PropertyEqualsComponent() {
        const state = useStore(state$, getState(), {
          condition: StoreConditions.whilePropertyEquals('status', 'loading'),
        });
        return (
          <div>
            <span data-testid="status">{state.status}</span>
            <span data-testid="data">{state.data || 'null'}</span>
          </div>
        );
      }

      render(<PropertyEqualsComponent />);
      expect(screen.getByTestId('status')).toHaveTextContent('loading');

      // While status is loading, updates should work
      act(() => setState({ data: 'partial' }));
      expect(screen.getByTestId('data')).toHaveTextContent('partial');

      // Change status - should stop subscription
      act(() => setState({ status: 'success' }));
      expect(screen.getByTestId('status')).toHaveTextContent('loading'); // Should remain 'loading'

      // Further updates should not work
      act(() => setState({ data: 'complete' }));
      expect(screen.getByTestId('data')).toHaveTextContent('partial'); // Should remain 'partial'
    });

    test('should work with StoreConditions.whilePropertyTruthy', async () => {
      const [getUser, setUser, user$] = createStore({
        name: 'John',
        isLoggedIn: true,
      });

      function PropertyTruthyComponent() {
        const user = useStore(user$, getUser(), {
          condition: StoreConditions.whilePropertyTruthy('isLoggedIn'),
        });
        return (
          <div>
            <span data-testid="logged-name">{user.name}</span>
            <span data-testid="logged-status">
              {user.isLoggedIn.toString()}
            </span>
          </div>
        );
      }

      render(<PropertyTruthyComponent />);
      expect(screen.getByTestId('logged-name')).toHaveTextContent('John');
      expect(screen.getByTestId('logged-status')).toHaveTextContent('true');

      // While logged in, updates should work
      act(() => setUser({ name: 'Jane' }));
      expect(screen.getByTestId('logged-name')).toHaveTextContent('Jane');

      // Log out - should stop subscription
      act(() => setUser({ isLoggedIn: false }));
      expect(screen.getByTestId('logged-name')).toHaveTextContent('Jane'); // Should remain 'Jane'
      expect(screen.getByTestId('logged-status')).toHaveTextContent('true'); // Should remain 'true'
    });

    test('should work with StoreConditions.whilePropertiesTruthy', async () => {
      const [getForm, setForm, form$] = createStore({
        name: 'John',
        email: 'john@test.com',
        phone: '123-456-7890',
      });

      function PropertiesTruthyComponent() {
        const form = useStore(form$, getForm(), {
          condition: StoreConditions.whilePropertiesTruthy('name', 'email'),
        });
        return (
          <div>
            <span data-testid="form-name">{form.name}</span>
            <span data-testid="form-email">{form.email}</span>
            <span data-testid="form-phone">{form.phone}</span>
          </div>
        );
      }

      render(<PropertiesTruthyComponent />);
      expect(screen.getByTestId('form-name')).toHaveTextContent('John');
      expect(screen.getByTestId('form-email')).toHaveTextContent(
        'john@test.com'
      );

      // While name and email are truthy, updates should work
      act(() => setForm({ phone: '987-654-3210' }));
      expect(screen.getByTestId('form-phone')).toHaveTextContent(
        '987-654-3210'
      );

      // Clear name - should stop subscription
      act(() => setForm({ name: '' }));
      expect(screen.getByTestId('form-name')).toHaveTextContent('John'); // Should remain 'John'
      expect(screen.getByTestId('form-phone')).toHaveTextContent(
        '987-654-3210'
      ); // Should remain previous value
    });

    test('should work with custom condition that stops at count 3', async () => {
      const [getCounter, setCounter, counter$] = createStore({ count: 0 });

      function ConditionalStopComponent() {
        const state = useStore(counter$, getCounter(), {
          condition: (state) => state.count < 3, // Stop when count reaches 3
        });
        return <span data-testid="conditional-stop-count">{state.count}</span>;
      }

      render(<ConditionalStopComponent />);
      expect(screen.getByTestId('conditional-stop-count')).toHaveTextContent(
        '0'
      );

      // First update - should work (0 < 3)
      act(() => setCounter({ count: 1 }));
      expect(screen.getByTestId('conditional-stop-count')).toHaveTextContent(
        '1'
      );

      // Second update - should work (1 < 3)
      act(() => setCounter({ count: 2 }));
      expect(screen.getByTestId('conditional-stop-count')).toHaveTextContent(
        '2'
      );

      // Third update - should stop subscription (3 is not < 3)
      act(() => setCounter({ count: 3 }));
      expect(screen.getByTestId('conditional-stop-count')).toHaveTextContent(
        '2'
      ); // Should remain 2

      // Fourth update should not work - subscription ended
      act(() => setCounter({ count: 4 }));
      expect(screen.getByTestId('conditional-stop-count')).toHaveTextContent(
        '2'
      ); // Should remain 2
    });

    test('should handle errors gracefully', async () => {
      const errorSubject = new BehaviorSubject({ name: 'John' });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      function ErrorHandlingComponent() {
        // Start with the value from the subject
        const value = useStore(errorSubject, errorSubject.getValue());
        return <span data-testid="error-name">{value.name}</span>;
      }

      render(<ErrorHandlingComponent />);
      expect(screen.getByTestId('error-name')).toHaveTextContent('John');

      // Simulate an error
      act(() => {
        errorSubject.error(new Error('Test store error'));
      });

      // Should fallback to initial value and not crash
      expect(screen.getByTestId('error-name')).toHaveTextContent('John'); // Remains the same since initial was from subject

      consoleSpy.mockRestore();
    });
  });
});
