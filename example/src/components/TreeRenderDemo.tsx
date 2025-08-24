import React, { useState, useCallback, createContext, useContext } from 'react';
import {
  createSignal,
  createStore,
  useSignal,
  useStore,
  createSignalMemo,
  preventUnnecessaryRerenders,
  createSelector,
} from 'react-rx-signals';

// ============================================================================
// REACT USESTATE TREE EXAMPLE
// ============================================================================

interface ReactTreeState {
  rootValue: number;
  level1Value: number;
  level2Value: number;
  level3Value: number;
  level4Value: number;
  // Split tree branches
  branchAValue: number;
  branchBValue: number;
  branchCValue: number;
  treeCLevel1: number;
  treeCLevel2: number;
  // Global parent state that affects all
  globalCounter: number;
}

const ReactTreeContext = createContext<{
  state: ReactTreeState;
  updateRoot: () => void;
  updateLevel1: () => void;
  updateLevel2: () => void;
  updateLevel3: () => void;
  updateLevel4: () => void;
  updateBranchA: () => void;
  updateBranchB: () => void;
  updateBranchC: () => void;
  updateTreeCLevel1: () => void;
  updateTreeCLevel2: () => void;
  triggerGlobalUpdate: () => void;
}>({
  state: {
    rootValue: 0,
    level1Value: 0,
    level2Value: 0,
    level3Value: 0,
    level4Value: 0,
    branchAValue: 0,
    branchBValue: 0,
    branchCValue: 0,
    treeCLevel1: 0,
    treeCLevel2: 0,
    globalCounter: 0,
  },
  updateRoot: () => {},
  updateLevel1: () => {},
  updateLevel2: () => {},
  updateLevel3: () => {},
  updateLevel4: () => {},
  updateBranchA: () => {},
  updateBranchB: () => {},
  updateBranchC: () => {},
  updateTreeCLevel1: () => {},
  updateTreeCLevel2: () => {},
  triggerGlobalUpdate: () => {},
});

const ReactTreeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ReactTreeState>({
    rootValue: 0,
    level1Value: 0,
    level2Value: 0,
    level3Value: 0,
    level4Value: 0,
    branchAValue: 0,
    branchBValue: 0,
    branchCValue: 0,
    treeCLevel1: 0,
    treeCLevel2: 0,
    globalCounter: 0,
  });

  const updateRoot = useCallback(() => {
    setState((prev) => ({ ...prev, rootValue: prev.rootValue + 1 }));
  }, []);

  const updateLevel1 = useCallback(() => {
    setState((prev) => ({ ...prev, level1Value: prev.level1Value + 1 }));
  }, []);

  const updateLevel2 = useCallback(() => {
    setState((prev) => ({ ...prev, level2Value: prev.level2Value + 1 }));
  }, []);

  const updateLevel3 = useCallback(() => {
    setState((prev) => ({ ...prev, level3Value: prev.level3Value + 1 }));
  }, []);

  const updateLevel4 = useCallback(() => {
    setState((prev) => ({ ...prev, level4Value: prev.level4Value + 1 }));
  }, []);

  const updateBranchA = useCallback(() => {
    setState((prev) => ({ ...prev, branchAValue: prev.branchAValue + 1 }));
  }, []);

  const updateBranchB = useCallback(() => {
    setState((prev) => ({ ...prev, branchBValue: prev.branchBValue + 1 }));
  }, []);

  const updateBranchC = useCallback(() => {
    setState((prev) => ({ ...prev, branchCValue: prev.branchCValue + 1 }));
  }, []);

  const updateTreeCLevel1 = useCallback(() => {
    setState((prev) => ({ ...prev, treeCLevel1: prev.treeCLevel1 + 1 }));
  }, []);

  const updateTreeCLevel2 = useCallback(() => {
    setState((prev) => ({ ...prev, treeCLevel2: prev.treeCLevel2 + 1 }));
  }, []);

  const triggerGlobalUpdate = useCallback(() => {
    setState((prev) => ({ ...prev, globalCounter: prev.globalCounter + 1 }));
  }, []);

  return (
    <ReactTreeContext.Provider
      value={{
        state,
        updateRoot,
        updateLevel1,
        updateLevel2,
        updateLevel3,
        updateLevel4,
        updateBranchA,
        updateBranchB,
        updateBranchC,
        updateTreeCLevel1,
        updateTreeCLevel2,
        triggerGlobalUpdate,
      }}
    >
      {children}
    </ReactTreeContext.Provider>
  );
};

// Global Parent Component with trigger button
const ReactGlobalParent = React.memo(function ReactGlobalParent() {
  const { state, triggerGlobalUpdate } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        border: '3px solid #e53e3e',
        borderRadius: '12px',
        padding: '1.5rem',
        backgroundColor: '#fef2f2',
      }}
    >
      <div
        className="info-item"
        style={{ borderLeft: '4px solid #e53e3e', marginBottom: '1rem' }}
      >
        <label>🎯 GLOBAL CONTEXT CONTROLLER</label>
        <span>
          Global Counter: {state.globalCounter} | Parent Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.6rem 1.2rem',
            backgroundColor: '#dc2626',
            borderColor: '#dc2626',
            fontWeight: 'bold',
          }}
          onClick={triggerGlobalUpdate}
        >
          🔥 TRIGGER GLOBAL RE-RENDER STORM
        </button>
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          color: '#7f1d1d',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '0.5rem',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          border: '1px solid #fca5a5',
        }}
      >
        ⚠️ Click this button and watch ALL trees re-render even though they
        should be independent!
        <br />
        This demonstrates the React Context "cascade effect" problem.
      </div>
    </div>
  );
});

const ReactRootNode = React.memo(function ReactRootNode() {
  const { state, updateRoot } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div className="info-item" style={{ borderLeft: '4px solid #3182ce' }}>
      <label>🌳 Root (React)</label>
      <span>
        Value: {state.rootValue} | Global: {state.globalCounter} | Renders:{' '}
        {renderCount.current}
      </span>
      <button
        className="btn btn-primary"
        style={{
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          padding: '0.4rem 0.8rem',
        }}
        onClick={updateRoot}
      >
        Update Root
      </button>
    </div>
  );
});

// Branch A Components
const ReactBranchANode = React.memo(function ReactBranchANode() {
  const { state, updateBranchA } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #10b981',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #10b981' }}>
        <label>🌿 Branch A (React)</label>
        <span>
          Value: {state.branchAValue} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={updateBranchA}
        >
          Update Branch A
        </button>
      </div>
      <ReactLevel1ANode />
    </div>
  );
});

const ReactLevel1ANode = React.memo(function ReactLevel1ANode() {
  const { state, updateLevel1 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #f56500' }}>
        <label>🍃 Level 1A (React)</label>
        <span>
          Value: {state.level1Value} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-primary"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={updateLevel1}
        >
          Update L1A
        </button>
      </div>
      <ReactLevel2Node />
    </div>
  );
});

// Branch B Components
const ReactBranchBNode = React.memo(function ReactBranchBNode() {
  const { state, updateBranchB } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #8b5cf6',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #8b5cf6' }}>
        <label>🌿 Branch B (React)</label>
        <span>
          Value: {state.branchBValue} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#8b5cf6',
            borderColor: '#8b5cf6',
            color: 'white',
          }}
          onClick={updateBranchB}
        >
          Update Branch B
        </button>
      </div>
      <ReactLevel1BNode />
    </div>
  );
});

const ReactLevel1BNode = React.memo(function ReactLevel1BNode() {
  const { state } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #ec4899' }}>
        <label>🍃 Level 1B (React)</label>
        <span>
          Global: {state.globalCounter} | Renders: {renderCount.current}
        </span>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginTop: '0.5rem',
          }}
        >
          This branch only shows global state changes
        </div>
      </div>
    </div>
  );
});

const ReactLevel2Node = React.memo(function ReactLevel2Node() {
  const { state, updateLevel2 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #38a169' }}>
        <label>🍃 Level 2 (React)</label>
        <span>
          Value: {state.level2Value} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-primary"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={updateLevel2}
        >
          Update L2
        </button>
      </div>
      <ReactLevel3Node />
    </div>
  );
});

const ReactLevel3Node = React.memo(function ReactLevel3Node() {
  const { state, updateLevel3 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #3182ce' }}>
        <label>🌱 Level 3 (React)</label>
        <span>
          Value: {state.level3Value} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-primary"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={updateLevel3}
        >
          Update L3
        </button>
      </div>
      <ReactLevel4Node />
    </div>
  );
});

const ReactLevel4Node = React.memo(function ReactLevel4Node() {
  const { state, updateLevel4 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #805ad5' }}>
        <label>🌾 Level 4 (React)</label>
        <span>
          Value: {state.level4Value} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn btn-primary"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={updateLevel4}
        >
          Update L4
        </button>
      </div>
    </div>
  );
});

// Tree C Components - Independent tree structure
const ReactTreeCNode = React.memo(function ReactTreeCNode() {
  const { state, updateBranchC } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div>
      <div className="info-item" style={{ borderLeft: '4px solid #f59e0b' }}>
        <label>🌿 Tree C Root (React)</label>
        <span>
          Value: {state.branchCValue} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            color: 'white',
          }}
          onClick={updateBranchC}
        >
          Update Tree C
        </button>
      </div>
      <ReactTreeCLevel1Node />
    </div>
  );
});

const ReactTreeCLevel1Node = React.memo(function ReactTreeCLevel1Node() {
  const { state, updateTreeCLevel1 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #d97706' }}>
        <label>🍃 Tree C L1 (React)</label>
        <span>
          Value: {state.treeCLevel1} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#d97706',
            borderColor: '#d97706',
            color: 'white',
          }}
          onClick={updateTreeCLevel1}
        >
          Update C L1
        </button>
      </div>
      <ReactTreeCLevel2Node />
    </div>
  );
});

const ReactTreeCLevel2Node = React.memo(function ReactTreeCLevel2Node() {
  const { state, updateTreeCLevel2 } = useContext(ReactTreeContext);
  const renderCount = React.useRef(0);
  renderCount.current++;

  return (
    <div
      style={{
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '2px solid #ccc',
      }}
    >
      <div className="info-item" style={{ borderLeft: '4px solid #b45309' }}>
        <label>🌱 Tree C L2 (React)</label>
        <span>
          Value: {state.treeCLevel2} | Global: {state.globalCounter} | Renders:{' '}
          {renderCount.current}
        </span>
        <button
          className="btn"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#b45309',
            borderColor: '#b45309',
            color: 'white',
          }}
          onClick={updateTreeCLevel2}
        >
          Update C L2
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// SIGNAL TREE EXAMPLE
// ============================================================================

// Signal-based individual signals
const [, setRootSignal, rootSignal$] = createSignal(0);
const [, setLevel1Signal, level1Signal$] = createSignal(0);
const [, setLevel2Signal, level2Signal$] = createSignal(0);
const [, setLevel3Signal, level3Signal$] = createSignal(0);
const [, setLevel4Signal, level4Signal$] = createSignal(0);

const SignalRootNode = createSignalMemo(
  function SignalRootNode(): React.ReactElement {
    const rootValue = useSignal(rootSignal$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #e53e3e' }}>
        <label>🌳 Root (Signal)</label>
        <span>
          Value: {rootValue} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => setRootSignal((prev) => prev + 1)}
        >
          Update Root
        </button>
      </div>
    );
  }
) as React.FC;

const SignalLevel1Container = preventUnnecessaryRerenders(
  function SignalLevel1Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <SignalLevel1Node />
        <SignalLevel2Container />
      </div>
    );
  }
) as React.FC;

const SignalLevel1Node = createSignalMemo(
  function SignalLevel1Node(): React.ReactElement {
    const level1Value = useSignal(level1Signal$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #f56500' }}>
        <label>🌿 Level 1 (Signal)</label>
        <span>
          Value: {level1Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => setLevel1Signal((prev) => prev + 1)}
        >
          Update L1
        </button>
      </div>
    );
  }
) as React.FC;

const SignalLevel2Container = preventUnnecessaryRerenders(
  function SignalLevel2Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <SignalLevel2Node />
        <SignalLevel3Container />
      </div>
    );
  }
) as React.FC;

const SignalLevel2Node = createSignalMemo(
  function SignalLevel2Node(): React.ReactElement {
    const level2Value = useSignal(level2Signal$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #38a169' }}>
        <label>🍃 Level 2 (Signal)</label>
        <span>
          Value: {level2Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => setLevel2Signal((prev) => prev + 1)}
        >
          Update L2
        </button>
      </div>
    );
  }
) as React.FC;

const SignalLevel3Container = preventUnnecessaryRerenders(
  function SignalLevel3Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <SignalLevel3Node />
        <SignalLevel4Container />
      </div>
    );
  }
) as React.FC;

const SignalLevel3Node = createSignalMemo(
  function SignalLevel3Node(): React.ReactElement {
    const level3Value = useSignal(level3Signal$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #3182ce' }}>
        <label>🌱 Level 3 (Signal)</label>
        <span>
          Value: {level3Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => setLevel3Signal((prev) => prev + 1)}
        >
          Update L3
        </button>
      </div>
    );
  }
) as React.FC;

const SignalLevel4Container = preventUnnecessaryRerenders(
  function SignalLevel4Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <SignalLevel4Node />
      </div>
    );
  }
) as React.FC;

const SignalLevel4Node = createSignalMemo(
  function SignalLevel4Node(): React.ReactElement {
    const level4Value = useSignal(level4Signal$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #805ad5' }}>
        <label>🌾 Level 4 (Signal)</label>
        <span>
          Value: {level4Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-success"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => setLevel4Signal((prev) => prev + 1)}
        >
          Update L4
        </button>
      </div>
    );
  }
) as React.FC;

// ============================================================================
// SIGNAL STORE TREE EXAMPLE
// ============================================================================

interface TreeStoreState {
  nodes: {
    root: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
  metadata: {
    totalUpdates: number;
    lastUpdated: string;
  };
}

const [, setTreeStore, treeStore$, selectTreeStore] =
  createStore<TreeStoreState>({
    nodes: {
      root: 0,
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
    },
    metadata: {
      totalUpdates: 0,
      lastUpdated: 'Never',
    },
  });

// Create fine-grained selectors
const nodes$ = selectTreeStore('nodes');
const metadata$ = selectTreeStore('metadata');

// Create individual node selectors using createSelector
const rootNode$ = createSelector(nodes$, (nodes) => nodes.root);
const level1Node$ = createSelector(nodes$, (nodes) => nodes.level1);
const level2Node$ = createSelector(nodes$, (nodes) => nodes.level2);
const level3Node$ = createSelector(nodes$, (nodes) => nodes.level3);
const level4Node$ = createSelector(nodes$, (nodes) => nodes.level4);

const updateNode = (node: keyof TreeStoreState['nodes']) => {
  setTreeStore((prev) => ({
    nodes: {
      ...prev.nodes,
      [node]: prev.nodes[node] + 1,
    },
    metadata: {
      totalUpdates: prev.metadata.totalUpdates + 1,
      lastUpdated: new Date().toLocaleTimeString(),
    },
  }));
};

const StoreRootNode = createSignalMemo(
  function StoreRootNode(): React.ReactElement {
    const rootValue = useStore(rootNode$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #e53e3e' }}>
        <label>🌳 Root (Store)</label>
        <span>
          Value: {rootValue} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => updateNode('root')}
        >
          Update Root
        </button>
      </div>
    );
  }
) as React.FC;

const StoreLevel1Container = preventUnnecessaryRerenders(
  function StoreLevel1Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <StoreLevel1Node />
        <StoreLevel2Container />
      </div>
    );
  }
) as React.FC;

const StoreLevel1Node = createSignalMemo(
  function StoreLevel1Node(): React.ReactElement {
    const level1Value = useStore(level1Node$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #f56500' }}>
        <label>🌿 Level 1 (Store)</label>
        <span>
          Value: {level1Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => updateNode('level1')}
        >
          Update L1
        </button>
      </div>
    );
  }
) as React.FC;

const StoreLevel2Container = preventUnnecessaryRerenders(
  function StoreLevel2Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <StoreLevel2Node />
        <StoreLevel3Container />
      </div>
    );
  }
) as React.FC;

const StoreLevel2Node = createSignalMemo(
  function StoreLevel2Node(): React.ReactElement {
    const level2Value = useStore(level2Node$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #38a169' }}>
        <label>🍃 Level 2 (Store)</label>
        <span>
          Value: {level2Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => updateNode('level2')}
        >
          Update L2
        </button>
      </div>
    );
  }
) as React.FC;

const StoreLevel3Container = preventUnnecessaryRerenders(
  function StoreLevel3Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <StoreLevel3Node />
        <StoreLevel4Container />
      </div>
    );
  }
) as React.FC;

const StoreLevel3Node = createSignalMemo(
  function StoreLevel3Node(): React.ReactElement {
    const level3Value = useStore(level3Node$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #3182ce' }}>
        <label>🌱 Level 3 (Store)</label>
        <span>
          Value: {level3Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => updateNode('level3')}
        >
          Update L3
        </button>
      </div>
    );
  }
) as React.FC;

const StoreLevel4Container = preventUnnecessaryRerenders(
  function StoreLevel4Container(): React.ReactElement {
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        style={{
          marginLeft: '1rem',
          paddingLeft: '1rem',
          borderLeft: '2px solid #ccc',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-light)',
            marginBottom: '0.5rem',
          }}
        >
          Container renders: {renderCount.current}
        </div>
        <StoreLevel4Node />
        <StoreMetadataDisplay />
      </div>
    );
  }
) as React.FC;

const StoreLevel4Node = createSignalMemo(
  function StoreLevel4Node(): React.ReactElement {
    const level4Value = useStore(level4Node$, 0);
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div className="info-item" style={{ borderLeft: '4px solid #805ad5' }}>
        <label>🌾 Level 4 (Store)</label>
        <span>
          Value: {level4Value} | Renders: {renderCount.current}
        </span>
        <button
          className="btn btn-warning"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            padding: '0.4rem 0.8rem',
          }}
          onClick={() => updateNode('level4')}
        >
          Update L4
        </button>
      </div>
    );
  }
) as React.FC;

const StoreMetadataDisplay = createSignalMemo(
  function StoreMetadataDisplay(): React.ReactElement {
    const metadata = useStore(metadata$, {
      totalUpdates: 0,
      lastUpdated: 'Never',
    });
    const renderCount = React.useRef(0);
    renderCount.current++;

    return (
      <div
        className="info-item"
        style={{ borderLeft: '4px solid #718096', marginTop: '1rem' }}
      >
        <label>📊 Metadata</label>
        <span>
          Updates: {metadata.totalUpdates} | Last: {metadata.lastUpdated} |
          Renders: {renderCount.current}
        </span>
      </div>
    );
  }
) as React.FC;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TreeRenderDemo() {
  return (
    <div className="demo-card">
      <h2>🌳 Tree Re-render Comparison</h2>
      <p>
        Compare how deeply nested component trees behave with React
        Context/useState vs individual signals vs signal stores. Watch the
        render counts to see the difference!
      </p>

      <div className="alert alert-info">
        <strong>🔍 Experiment:</strong> Click any "Update" button and observe:
        <br />• <strong>React:</strong> All components in the tree re-render due
        to Context change
        <br />• <strong>🔥 Global Trigger:</strong> The red button causes ALL
        React trees to re-render
        <br />• <strong>Tree Independence:</strong> Update Tree A → Trees B & C
        also re-render (bad!)
        <br />• <strong>Signals:</strong> Only the specific component that uses
        the changed signal re-renders
        <br />• <strong>Store:</strong> Only components using the changed store
        field re-render
        <br />• <strong>Context Problem:</strong> "Independent" trees aren't
        actually independent
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
        }}
      >
        {/* React useState with Context */}
        <div className="user-card">
          <h3>⚛️ React Context + useState</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              marginBottom: '1rem',
            }}
          >
            Split into 3 "independent" trees - but Context makes them all
            re-render together!
          </p>
          <ReactTreeProvider>
            <ReactGlobalParent />

            {/* Split into three separate tree sections */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              {/* Tree A */}
              <div
                style={{
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  🌲 TREE A
                </div>
                <ReactRootNode />
                <ReactBranchANode />
              </div>

              {/* Tree B */}
              <div
                style={{
                  border: '2px solid #8b5cf6',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#faf5ff',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  🌲 TREE B
                </div>
                <ReactBranchBNode />
              </div>

              {/* Tree C - New independent tree */}
              <div
                style={{
                  border: '2px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#fffbeb',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  🌲 TREE C
                </div>
                <ReactTreeCNode />
              </div>
            </div>
          </ReactTreeProvider>
        </div>

        {/* Signal Individual */}
        <div className="user-card">
          <h3>⚡ Individual Signals</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              marginBottom: '1rem',
            }}
          >
            Only consuming component re-renders, containers isolated
          </p>
          <SignalRootNode />
          <SignalLevel1Container />
        </div>

        {/* Signal Store */}
        <div className="user-card">
          <h3>🏪 Signal Store</h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              marginBottom: '1rem',
            }}
          >
            Fine-grained store updates with field-specific selectors
          </p>
          <StoreRootNode />
          <StoreLevel1Container />
        </div>
      </div>

      <div className="performance-metrics" style={{ marginTop: '2rem' }}>
        <h3>📊 Performance Insights</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value" style={{ color: '#e53e3e' }}>
              HIGH
            </div>
            <div className="metric-label">React Re-renders</div>
          </div>
          <div className="metric-item">
            <div className="metric-value" style={{ color: '#38a169' }}>
              LOW
            </div>
            <div className="metric-label">Signal Re-renders</div>
          </div>
          <div className="metric-item">
            <div className="metric-value" style={{ color: '#3182ce' }}>
              MINIMAL
            </div>
            <div className="metric-label">Store Re-renders</div>
          </div>
          <div className="metric-item">
            <div className="metric-value" style={{ color: '#805ad5' }}>
              ISOLATED
            </div>
            <div className="metric-label">Container Updates</div>
          </div>
        </div>
      </div>

      <ul className="features-list">
        <li>
          React Context causes all consuming components to re-render on any
          state change
        </li>
        <li>
          Individual signals provide complete isolation - only the consuming
          component updates
        </li>
        <li>
          Signal stores offer the best of both worlds - centralized state with
          fine-grained updates
        </li>
        <li>
          Container components can be completely isolated from child state
          changes
        </li>
        <li>Deep nesting doesn't affect performance with signals</li>
        <li>No need for complex React.memo optimization patterns</li>
      </ul>
    </div>
  );
}

export default TreeRenderDemo;
