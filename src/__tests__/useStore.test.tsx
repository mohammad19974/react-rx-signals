import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createStore } from '../store';
import { useStore } from '../useStore';

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

      const user = useStore(user$(), getUser());

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
      const user = useStore(user$(), getUser());

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
});
