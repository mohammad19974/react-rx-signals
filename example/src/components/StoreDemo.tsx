import React from 'react';
import { createStore, useStore, createSignalMemo } from 'react-rx-signals';

// Define user state interface
interface UserState {
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

// Create a store with initial user data
const [getUser, setUser, user$, selectUser] = createStore<UserState>({
  name: 'Alex Johnson',
  age: 28,
  email: 'alex@example.com',
  isActive: true,
});

// Create specific selectors for better performance
const userName$ = selectUser('name');
const userAge$ = selectUser('age');
const userEmail$ = selectUser('email');
const userActive$ = selectUser('isActive');

// Component that only re-renders when name changes
const UserNameDisplay = createSignalMemo(
  function UserNameDisplay(): React.ReactElement {
    const userName = useStore(userName$, '');

    return (
      <div className="info-item">
        <label>👤 Name</label>
        <span>{userName}</span>
      </div>
    );
  }
) as React.FC;

// Component that only re-renders when age changes
const UserAgeDisplay = createSignalMemo(
  function UserAgeDisplay(): React.ReactElement {
    const userAge = useStore(userAge$, 0);

    return (
      <div className="info-item">
        <label>🎂 Age</label>
        <span>{userAge} years old</span>
      </div>
    );
  }
) as React.FC;

// Component that only re-renders when email changes
const UserEmailDisplay = createSignalMemo(
  function UserEmailDisplay(): React.ReactElement {
    const userEmail = useStore(userEmail$, '');

    return (
      <div className="info-item">
        <label>📧 Email</label>
        <span>{userEmail}</span>
      </div>
    );
  }
) as React.FC;

// Component that only re-renders when active status changes
const UserStatusDisplay = createSignalMemo(
  function UserStatusDisplay(): React.ReactElement {
    const isActive = useStore(userActive$, false);

    return (
      <div className="info-item">
        <label>🟢 Status</label>
        <span
          style={{
            color: isActive ? 'var(--success-color)' : 'var(--error-color)',
            fontWeight: 'bold',
          }}
        >
          {isActive ? '✅ Active' : '❌ Inactive'}
        </span>
      </div>
    );
  }
) as React.FC;

function StoreDemo() {
  const user = useStore(user$, getUser());

  const randomNames = [
    'Alice Smith',
    'Bob Wilson',
    'Carol Davis',
    'David Brown',
    'Eva Garcia',
  ];
  const randomEmails = [
    'alice@example.com',
    'bob@example.com',
    'carol@example.com',
    'david@example.com',
    'eva@example.com',
  ];

  return (
    <div className="demo-card">
      <h2>🏪 Store Management</h2>
      <p>
        Demonstrates store usage with fine-grained selectors for optimal
        performance
      </p>

      <div className="user-card">
        <h3>User Profile</h3>
        <div className="user-info">
          <UserNameDisplay />
          <UserAgeDisplay />
          <UserEmailDisplay />
          <UserStatusDisplay />
        </div>
      </div>

      <h3>Update Controls</h3>
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => setUser({ age: user.age + 1 })}
        >
          🎂 +1 Age
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const randomName =
              randomNames[Math.floor(Math.random() * randomNames.length)];
            setUser({ name: randomName });
          }}
        >
          👤 Random Name
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const randomEmail =
              randomEmails[Math.floor(Math.random() * randomEmails.length)];
            setUser({ email: randomEmail });
          }}
        >
          📧 Random Email
        </button>
        <button
          className="btn btn-success"
          onClick={() => setUser({ isActive: !user.isActive })}
        >
          🔄 Toggle Status
        </button>
      </div>

      <ul className="features-list">
        <li>
          Each field component only re-renders when its specific field changes
        </li>
        <li>Store updates are automatically batched for performance</li>
        <li>Partial updates only trigger relevant component re-renders</li>
        <li>Type-safe selectors with full TypeScript support</li>
      </ul>
    </div>
  );
}

export default StoreDemo;
