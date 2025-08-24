import React from 'react';
import type { Observable, Subscription } from 'rxjs';

type LogItem = { id: number; time: number; label: string; value: unknown };

export function RxLogsPanel({
  sources,
}: {
  sources: Array<{ label: string; source$: Observable<unknown> }>;
}) {
  const [logs, setLogs] = React.useState<LogItem[]>([]);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    const subs: Subscription[] = sources.map(({ label, source$ }) =>
      source$.subscribe((value) => {
        idRef.current += 1;
        setLogs((prev) => [
          { id: idRef.current, time: Date.now(), label, value },
          ...prev.slice(0, 199),
        ]);
      })
    );
    return () => subs.forEach((s) => s.unsubscribe());
  }, [sources]);

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 12,
        padding: 8,
        border: '1px solid #ddd',
        borderRadius: 6,
        background: '#fafafa',
        maxHeight: 300,
        overflow: 'auto',
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 600 }}>RxJS Logs</div>
      {logs.length === 0 ? (
        <div style={{ color: '#777' }}>No emissions yet…</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {logs.map((log) => (
            <li
              key={log.id}
              style={{ padding: '4px 0', borderBottom: '1px dashed #eee' }}
            >
              <span style={{ color: '#999' }}>
                {new Date(log.time).toLocaleTimeString()}{' '}
              </span>
              <span style={{ color: '#555' }}>[{log.label}]</span> →{' '}
              <span style={{ color: '#111' }}>{formatValue(log.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return String(value);
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '[Object]';
  }
}
