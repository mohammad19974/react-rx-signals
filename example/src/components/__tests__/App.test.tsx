import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple component test without complex dependencies
describe('Example App Tests', () => {
  test('basic React and testing setup works', () => {
    const TestComponent = () => (
      <div>
        <h1>React RX Signals Example</h1>
        <p>This example demonstrates the power of react-rx-signals</p>
      </div>
    );

    render(<TestComponent />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('React RX Signals Example');

    const description = screen.getByText(/This example demonstrates/);
    expect(description).toBeInTheDocument();
  });

  test('can import react-rx-signals library', () => {
    // Test that the library can be imported without errors
    const { createSignal, createStore } = require('react-rx-signals');

    expect(typeof createSignal).toBe('function');
    expect(typeof createStore).toBe('function');
  });

  test('createSignal works correctly', () => {
    const { createSignal } = require('react-rx-signals');

    const [getValue, setValue, signal$] = createSignal(0);

    expect(getValue()).toBe(0);

    setValue(5);
    expect(getValue()).toBe(5);

    // Test that observable is created
    expect(signal$).toBeDefined();
    expect(typeof signal$.subscribe).toBe('function');
  });

  test('createStore works correctly', () => {
    const { createStore } = require('react-rx-signals');

    const [getState, setState, store$] = createStore({
      count: 0,
      name: 'test',
    });

    expect(getState()).toEqual({ count: 0, name: 'test' });

    setState({ count: 5 });
    expect(getState()).toEqual({ count: 5, name: 'test' });

    // Test that observable is created
    expect(store$).toBeDefined();
    expect(typeof store$.subscribe).toBe('function');
  });
});
