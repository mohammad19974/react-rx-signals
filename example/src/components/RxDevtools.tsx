import React from 'react';
import { createPortal } from 'react-dom';
import type { Observable } from 'rxjs';
import { RxLogsPanel } from './RxLogsPanel';

export function RxDevtools({
  sources,
  initialOpen = false,
  title = 'RxJS Devtools',
}: {
  sources: Array<{ label: string; source$: Observable<unknown> }>;
  initialOpen?: boolean;
  title?: string;
}) {
  const [open, setOpen] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rx-devtools-open');
      if (saved != null) return saved === '1';
    } catch {}
    return initialOpen;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('rx-devtools-open', open ? '1' : '0');
    } catch {}
  }, [open]);

  const container = typeof document !== 'undefined' ? document.body : null;
  if (!container) return null;

  return createPortal(
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle RxJS Devtools"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: open ? '#6c5ce7' : '#0984e3',
          color: 'white',
          border: 'none',
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 2147483646,
        }}
      >
        {open ? '×' : 'Rx'}
      </button>

      {/* Floating panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 72,
            width: 380,
            height: 360,
            background: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            resize: 'both' as unknown as undefined,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(90deg,#6c5ce7,#0984e3)',
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none',
            }}
          >
            <span>{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 8, flex: 1, minHeight: 0, overflow: 'auto' }}>
            <RxLogsPanel sources={sources} />
          </div>
        </div>
      )}
    </>,
    container
  );
}
