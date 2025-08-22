# React RX Signals - Example Project

This example project demonstrates the power and features of `react-rx-signals` running on **React 19** with a modern, beautiful UI.

## 🚀 Features Demonstrated

### 🔢 Signal Counter

- Basic signal usage with fine-grained reactivity
- Only components using changed signals re-render
- Even/Odd display only updates when parity changes
- Unrelated components remain isolated

### 🏪 Store Management

- Complex state management with stores
- Fine-grained selectors for optimal performance
- Partial updates only trigger relevant component re-renders
- Type-safe selectors with full TypeScript support

### 🧮 Computed Values

- Automatic computation and derived values
- Memoized selectors prevent expensive recalculations
- Derived values can depend on multiple signals
- Reactive calculations with automatic dependency tracking

### ⚡ Performance Testing

- Compare signal-based vs traditional React rendering
- Render optimization with memoization
- Independent components isolated from signal updates
- Stress testing capabilities

### 🆚 Render Comparison

- Direct side-by-side comparison of useState vs signals
- Visual demonstration of render count differences
- Stress testing with multiple independent values
- Shows parent component isolation with signals

### 🌳 Tree Re-render Comparison

- Deep component hierarchy demonstrations (5 levels deep)
- React Context + useState vs individual signals vs signal stores
- Container component isolation with signals
- Visual proof of fine-grained reactivity in nested structures

### 🚀 Advanced Features Showcase

- useSignalEffect: Reactive side effects with automatic cleanup
- useSignalLifecycle: Component lifecycle hooks tied to signals
- useDebouncedSignalEffect: Debounced effects for performance optimization
- useSignalValue: Direct signal value access without subscriptions
- createShallowMemo: Optimized memoization with shallow comparison
- withSignalTracking: Automatic signal dependency tracking
- shallowEqual: Utility for shallow object comparison

## 🛠️ Technologies Used

- **React 19** - Latest version with concurrent features
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server
- **React RX Signals** - Fine-grained reactivity library
- **CSS3** - Modern styling with gradients and animations

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. **Install dependencies for the main package (from root directory):**

   ```bash
   npm install
   ```

2. **Navigate to the example directory:**

   ```bash
   cd example
   ```

3. **Install example dependencies:**

   ```bash
   npm install
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser to [http://localhost:3000](http://localhost:3000)**

### Alternative: Run from root directory

You can also run the example from the root directory:

```bash
# Install example dependencies
npm run example:install

# Start development server
npm run example:dev

# Build example for production
npm run example:build
```

## 🎯 What to Look For

### 🔍 Open Browser DevTools Console

The example includes console logging to show you exactly when components re-render, demonstrating the fine-grained reactivity:

- Click buttons and watch which components actually re-render
- Notice how changing the counter only affects the even/odd display when parity changes
- See how store updates only trigger re-renders for components using specific fields

### 🎨 Modern UI Features

- **Gradient backgrounds** with smooth transitions
- **Card-based layout** with hover effects
- **Responsive design** that works on all screen sizes
- **Smooth animations** and micro-interactions
- **Color-coded status indicators**

### ⚡ Performance Optimization

- **Memoized components** that prevent unnecessary re-renders
- **Signal tracking** for automatic dependency detection
- **Fine-grained selectors** that only trigger when specific data changes
- **Batched updates** for optimal performance

## 📊 Performance Benefits

React RX Signals provides several performance advantages over traditional React state:

1. **Fine-grained Updates**: Only components using changed data re-render
2. **Automatic Memoization**: Components are automatically optimized
3. **Selective Re-rendering**: Change one field, only relevant components update
4. **Minimal Bundle Size**: Lightweight library with no unnecessary dependencies

## 🧪 Try These Experiments

1. **Counter Test**: Click increment rapidly and watch console - see how even/odd only updates when parity changes
2. **Store Test**: Update user age vs name - notice only relevant components re-render
3. **Performance Test**: Use the stress test button and compare signal vs React state performance
4. **Independence Test**: Update local state in isolated components - they don't affect others

## 🏗️ Project Structure

```
example/
├── src/
│   ├── components/
│   │   ├── CounterDemo.tsx           # Basic signal usage
│   │   ├── StoreDemo.tsx             # Store management
│   │   ├── ComputedDemo.tsx          # Computed values
│   │   ├── PerformanceDemo.tsx       # Performance testing
│   │   ├── RenderComparisonDemo.tsx  # useState vs signals comparison
│   │   ├── TreeRenderDemo.tsx        # Deep tree re-render comparison
│   │   └── AdvancedFeaturesDemo.tsx  # Advanced hooks and utilities
│   ├── App.tsx                  # Main application
│   ├── main.tsx                 # Entry point
│   └── index.css               # Modern styling
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
└── vite.config.ts              # Vite configuration
```

## 🎨 Styling Features

The example uses a modern CSS approach with:

- **CSS Custom Properties** for consistent theming
- **CSS Grid** for responsive layouts
- **Flexbox** for component alignment
- **Smooth transitions** for interactive elements
- **Gradient backgrounds** for visual appeal
- **Box shadows** for depth and layering

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### Fix Lint Issues

```bash
npm run lint:fix
```

## 📝 Notes

- This example is excluded from the main package's npm distribution
- Uses React 19's latest features and concurrent mode
- Fully typed with TypeScript for better development experience
- Optimized for both development and production builds

Enjoy exploring the power of fine-grained reactivity with React RX Signals! 🚀
