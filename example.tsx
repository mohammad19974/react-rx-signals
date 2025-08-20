import React from 'react';
import {
  createSignal,
  createStore,
  useSignal,
  useStore,
  createComputed,
} from './src/index';

// Example 1: Basic Signal Usage
const [getCount, setCount, count$] = createSignal(0);

function Counter() {
  const count = useSignal(count$, 0);

  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
      <button onClick={() => setCount((prev) => prev - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Example 2: Store Usage
interface UserState {
  name: string;
  age: number;
  email: string;
}

const [getUser, setUser, user$, selectUser] = createStore<UserState>({
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
});

function UserProfile() {
  const user = useStore(user$, getUser());
  const userName = useStore(selectUser('name'), '');

  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <p>Email: {user.email}</p>
      <p>Selected Name: {userName}</p>

      <button onClick={() => setUser({ age: user.age + 1 })}>
        Increase Age
      </button>
      <button
        onClick={() => setUser((prev) => ({ ...prev, name: 'Jane Doe' }))}
      >
        Change Name
      </button>
    </div>
  );
}

// Example 3: Computed Values
const doubled$ = createComputed(count$, (count) => count * 2);
const userSummary$ = createComputed(
  user$,
  (user) => `${user.name} (${user.age} years old)`
);

function ComputedExample() {
  const doubledCount = useSignal(doubled$, 0);
  const userSummary = useSignal(userSummary$, '');

  return (
    <div>
      <h2>Computed Values</h2>
      <p>Count: {getCount()}</p>
      <p>Doubled: {doubledCount}</p>
      <p>User Summary: {userSummary}</p>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>React RX Signals Example</h1>
      <Counter />
      <hr />
      <UserProfile />
      <hr />
      <ComputedExample />
    </div>
  );
}
