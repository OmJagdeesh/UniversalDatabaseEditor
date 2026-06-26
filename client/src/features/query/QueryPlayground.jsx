import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { executeQuery } from '../../shared/api/queryApi.js';

const HISTORY_KEY = 'ude_query_history';
const MAX_HISTORY = 50;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function QueryPlayground({ connectionId, connectionType }) {
  const toast = useToast();
  const textareaRef = useRef(null);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  // Dangerous query confirmation state
  const [confirm, setConfirm] = useState(null);

  const isMongo = connectionType === 'mongodb';

  const handleExecute = useCallback(async (confirmedQuery, isConfirmed = false) => {
    const q = confirmedQuery || query.trim();
    if (!q) return;

    setExecuting(true);
    setResult(null);

    try {
      const res = await executeQuery(connectionId, q, isConfirmed);

      if (res?.requiresConfirmation) {
        setConfirm({
          message: res.message,
          patterns: res.patterns,
          query: q
        });
        setExecuting(false);
        return;
      }

      setResult(res?.data ?? res);

      // Save to history
      const newHistory = [
        { query: q, timestamp: new Date().toISOString() },
        ...history.filter((h) => h.query !== q)
      ].slice(0, MAX_HISTORY);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (err) {
      setResult({ error: err.message });
      toast(err.message, 'error');
    } finally {
      setExecuting(false);
    }
  }, [connectionId, query, history, toast]);

  // Ctrl+Enter keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    }
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleExecute]);

  function handleConfirmExecute() {
    const q = confirm.query;
    setConfirm(null);
    handleExecute(q, true);
  }

  function loadFromHistory(item) {
    setQuery(item.query);
    setShowHistory(false);
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  // Extract result data for rendering
  const rows = result?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const rowsAffected = result?.rowsAffected ?? result?.changes ?? null;
  const hasError = result?.error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Query Playground</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </Button>
        </div>
      </div>

      {/* Query Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isMongo ? 'db.collection.find({})' : 'SELECT * FROM users;'}
          rows={6}
          className="w-full rounded-lg border border-line bg-ink p-4 font-mono text-sm text-green-400 placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 resize-y"
          spellCheck={false}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Ctrl+Enter to run</span>
          <Button size="sm" onClick={() => handleExecute()} loading={executing}>
            Execute
          </Button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Query History</h3>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700">
                Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-slate">No queries in history.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => loadFromHistory(item)}
                  className="flex w-full items-start gap-3 rounded-md p-2 text-left text-sm hover:bg-mist transition-colors"
                >
                  <code className="flex-1 truncate font-mono text-xs text-ink">{item.query}</code>
                  <span className="shrink-0 text-[10px] text-slate">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-medium">Error: </span>
          {result.error}
        </div>
      )}

      {!hasError && rowsAffected !== null && rowsAffected !== undefined && rows.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Query executed successfully. {rowsAffected} row(s) affected.
        </div>
      )}

      {!hasError && rows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate">{rows.length} row(s) returned</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportResults(columns, rows)}
            >
              Export Results
            </Button>
          </div>
          <div className="overflow-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist">
                  {columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-medium text-ink">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-line hover:bg-mist/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-3 py-2 text-slate">
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dangerous query confirmation */}
      <ConfirmDialog
        open={!!confirm}
        title="Dangerous Query Detected"
        message={
          confirm
            ? `${confirm.message}\n\nPatterns: ${confirm.patterns?.join(', ')}`
            : ''
        }
        confirmLabel="Execute Anyway"
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function formatCell(val) {
  if (val === null || val === undefined) return <span className="italic text-gray-400">NULL</span>;
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);
  return str.length > 200 ? str.slice(0, 200) + '…' : str;
}

function exportResults(columns, rows) {
  const csv = [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'query_results.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
