import { useState, useCallback } from 'react';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useApi } from '../../shared/hooks/useApi.js';
import { fetchExplorerTree } from '../../shared/api/explorerApi.js';

export function DatabaseExplorer({ connectionId, connectionType, onSelectTable }) {
  const { data: tree, loading, error, refetch } = useApi(
    () => fetchExplorerTree(connectionId),
    [connectionId]
  );
  const [expanded, setExpanded] = useState({ tables: true, views: false, indexes: false });

  const toggleSection = useCallback((section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load explorer: {error}
        <button onClick={refetch} className="ml-2 underline">Retry</button>
      </div>
    );
  }

  if (!tree) return null;

  const isMongo = connectionType === 'mongodb';
  const tables = tree.tables || [];
  const views = tree.views || [];
  const indexes = tree.indexes || {};

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate">Explorer</h3>
        <button
          onClick={refetch}
          className="rounded p-1 text-slate hover:bg-mist hover:text-ink transition-colors"
          title="Refresh"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {tables.length === 0 && views.length === 0 ? (
        <EmptyState title="No tables found" description="This database appears to be empty." />
      ) : (
        <>
          {/* Tables / Collections */}
          <TreeSection
            label={isMongo ? 'Collections' : 'Tables'}
            count={tables.length}
            expanded={expanded.tables}
            onToggle={() => toggleSection('tables')}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 10.875c-.621 0-1.125.504-1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 1.5c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621-.504-1.125-1.125-1.125" />
              </svg>
            }
          >
            {tables.map((table) => (
              <TreeItem
                key={table}
                label={table}
                onClick={() => onSelectTable(table)}
              />
            ))}
          </TreeSection>

          {/* Views */}
          {views.length > 0 && (
            <TreeSection
              label="Views"
              count={views.length}
              expanded={expanded.views}
              onToggle={() => toggleSection('views')}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              {views.map((view) => (
                <TreeItem key={view} label={view} onClick={() => onSelectTable(view)} />
              ))}
            </TreeSection>
          )}

          {/* Indexes (SQL only) */}
          {!isMongo && Object.keys(indexes).length > 0 && (
            <TreeSection
              label="Indexes"
              count={Object.values(indexes).flat().length}
              expanded={expanded.indexes}
              onToggle={() => toggleSection('indexes')}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              }
            >
              {Object.entries(indexes).map(([table, idxList]) => (
                <div key={table} className="ml-2">
                  <p className="px-2 py-1 text-xs font-medium text-slate">{table}</p>
                  {Array.isArray(idxList) && idxList.map((idx) => {
                    const idxName = typeof idx === 'string' ? idx : idx.name || JSON.stringify(idx);
                    return <TreeItem key={idxName} label={idxName} />;
                  })}
                </div>
              ))}
            </TreeSection>
          )}
        </>
      )}
    </div>
  );
}

function TreeSection({ label, count, expanded, onToggle, icon, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-mist transition-colors"
      >
        <svg
          className={`h-3 w-3 text-slate transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        {icon}
        <span>{label}</span>
        <span className="ml-auto rounded-full bg-mist px-1.5 py-0.5 text-[10px] font-semibold text-slate">
          {count}
        </span>
      </button>
      {expanded && <div className="ml-4 space-y-0.5">{children}</div>}
    </div>
  );
}

function TreeItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-slate hover:bg-brand/5 hover:text-brand transition-colors"
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <span className="truncate">{label}</span>
    </button>
  );
}
