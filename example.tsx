// import React from 'react';
// import {
//   createSignal,
//   createStore,
//   useSignal,
//   useStore,
//   createComputed,
//   createSignalMemo,
//   createSelector,
//   preventUnnecessaryRerenders,
// } from './src/index';
// import { PerformanceTest } from './src/performance-test';

// // Example 1: Basic Signal Usage with Performance Optimization
// const [getCount, setCount, count$] = createSignal(0);

// // Create a selector for even/odd status to demonstrate fine-grained reactivity
// const isEven$ = createSelector(count$, (count) => count % 2 === 0);

// // Basic Counter component
// function Counter() {
//   const count = useSignal(count$, 0);

//   return (
//     <div>
//       <h2>Counter: {count}</h2>
//       <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
//       <button onClick={() => setCount((prev) => prev - 1)}>Decrement</button>
//       <button onClick={() => setCount(0)}>Reset</button>
//     </div>
//   );
// }

// // Performance-optimized component that only re-renders when isEven changes
// const EvenOddDisplay = createSignalMemo(function EvenOddDisplay() {
//   const isEven = useSignal(isEven$, true);
//   console.log('EvenOddDisplay re-rendered'); // This should only log when even/odd status changes

//   return (
//     <div
//       style={{ padding: '10px', background: isEven ? '#e8f5e8' : '#ffe8e8' }}
//     >
//       <p>Number is: {isEven ? 'Even' : 'Odd'}</p>
//     </div>
//   );
// });

// // Component that doesn't use the count signal - should never re-render
// const UnrelatedComponent = preventUnnecessaryRerenders(
//   function UnrelatedComponent() {
//     const [localState, setLocalState] = React.useState(0);
//     console.log('UnrelatedComponent re-rendered'); // This should only log on mount and local state changes

//     return (
//       <div style={{ padding: '10px', background: '#f0f0f0' }}>
//         <p>I don't depend on count signal: {localState}</p>
//         <button onClick={() => setLocalState((prev) => prev + 1)}>
//           Update Local State
//         </button>
//       </div>
//     );
//   }
// );

// // Example 2: Store Usage with Fine-grained Selectors
// interface UserState {
//   name: string;
//   age: number;
//   email: string;
// }

// const [getUser, setUser, user$, selectUser] = createStore<UserState>({
//   name: 'John Doe',
//   age: 30,
//   email: 'john@example.com',
// });

// // Create specific selectors for better performance
// const userName$ = selectUser('name');
// const userAge$ = selectUser('age');

// // Component that only re-renders when name changes
// const UserNameDisplay = createSignalMemo(function UserNameDisplay() {
//   const userName = useStore(userName$, '');
//   console.log('UserNameDisplay re-rendered'); // Only when name changes

//   return (
//     <div style={{ padding: '5px', border: '1px solid blue' }}>
//       <strong>Name: {userName}</strong>
//     </div>
//   );
// });

// // Component that only re-renders when age changes
// const UserAgeDisplay = createSignalMemo(function UserAgeDisplay() {
//   const userAge = useStore(userAge$, 0);
//   console.log('UserAgeDisplay re-rendered'); // Only when age changes

//   return (
//     <div style={{ padding: '5px', border: '1px solid green' }}>
//       <strong>Age: {userAge}</strong>
//     </div>
//   );
// });

// function UserProfile() {
//   const user = useStore(user$, getUser());
//   console.log('UserProfile re-rendered'); // This will re-render on any user change

//   return (
//     <div>
//       <h2>User Profile (Full Object)</h2>
//       <p>Email: {user.email}</p>

//       <h3>Fine-grained Components:</h3>
//       <UserNameDisplay />
//       <UserAgeDisplay />

//       <div style={{ marginTop: '10px' }}>
//         <button onClick={() => setUser({ age: user.age + 1 })}>
//           Increase Age (only age component should re-render)
//         </button>
//         <button
//           onClick={() => setUser((prev) => ({ ...prev, name: 'Jane Doe' }))}
//         >
//           Change Name (only name component should re-render)
//         </button>
//       </div>
//     </div>
//   );
// }

// // Example 3: Computed Values
// const doubled$ = createComputed(count$, (count) => count * 2);
// const userSummary$ = createComputed(
//   user$,
//   (user) => `${user.name} (${user.age} years old)`
// );

// function ComputedExample() {
//   const doubledCount = useSignal(doubled$, 0);
//   const userSummary = useSignal(userSummary$, '');

//   return (
//     <div>
//       <h2>Computed Values</h2>
//       <p>Count: {getCount()}</p>
//       <p>Doubled: {doubledCount}</p>
//       <p>User Summary: {userSummary}</p>
//     </div>
//   );
// }

// // Main App Component
// export default function App() {
//   return (
//     <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
//       <h1>React RX Signals - Performance Optimized</h1>

//       <div style={{ marginBottom: '20px' }}>
//         <h3>🚀 Performance Features:</h3>
//         <ul>
//           <li>✅ Only components using changed signals re-render</li>
//           <li>✅ Fine-grained selectors prevent unnecessary updates</li>
//           <li>✅ Memoized components with smart equality checks</li>
//           <li>✅ Stable references prevent recreations</li>
//         </ul>
//         <p>
//           <strong>Open console to see re-render logs!</strong>
//         </p>
//       </div>

//       <div
//         style={{ border: '2px solid #ccc', padding: '15px', margin: '10px 0' }}
//       >
//         <h2>Signal Counter</h2>
//         <Counter />
//         <EvenOddDisplay />
//         <UnrelatedComponent />
//       </div>

//       <div
//         style={{ border: '2px solid #ccc', padding: '15px', margin: '10px 0' }}
//       >
//         <h2>Store Example</h2>
//         <UserProfile />
//       </div>

//       <div
//         style={{ border: '2px solid #ccc', padding: '15px', margin: '10px 0' }}
//       >
//         <h2>Computed Values</h2>
//         <ComputedExample />
//       </div>

//       <div
//         style={{ border: '2px solid #ccc', padding: '15px', margin: '10px 0' }}
//       >
//         <h2>Performance Test</h2>
//         <PerformanceTest />
//       </div>
//     </div>
//   );
// }
