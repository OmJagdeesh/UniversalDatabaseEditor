import { useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useApi } from '../../shared/hooks/useApi.js';
import { fetchRows } from '../../shared/api/dataApi.js';

export function DataViewer({ connectionId, tableName, onEditRecord, onAddRecord, onDeleteRecords }) {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const fetchParams = { page, limit, sortBy, sortOrder, filterColumn, filterValue };

  const { data, loading, error, refetch } = useApi(
    () => fetchRows(connectionId, tableName, fetchParams),
    [connectionId, tableName, page, limit, sortBy, sortOrder, filterColumn, filterValue]
  );

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);

  const handleFilter = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  function toggleRowSelection(key) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data?.rows) return;
    if (selectedRows.size === data.rows.length) {
      setSelectedRows(new Set());
    } else {
      const keys = data.rows.map((_, i) => i);
      setSelectedRows(new Set(keys));
    }
  }

  function handleDeleteSelected() {
    if (selectedRows.size === 0) return;
    const rows = data?.rows || [];
    const selected = [...selectedRows].map((i) => rows[i]);
    onDeleteRecords(selected);
    setSelectedRows(new Set());
  }

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load data: {error}
        <button onClick={refetch} className="ml-2 underline">Retry</button>
      </div>
    );
  }

  const rows = data?.rows || [];
  const totalRows = data?.totalRows ?? data?.total ?? rows.length;
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAddRecord}>
          + Add Record
        </Button>
        {selectedRows.size > 0 && (
          <Button size="sm" variant="danger" onClick={handleDeleteSelected}>
            Delete ({selectedRows.size})
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink focus:border-brand focus:outline-none"
          >
            <option value="">Filter by…</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            placeholder="Filter value…"
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none w-40"
          />
          <Button size="sm" variant="secondary" onClick={handleFilter}>
            Apply
          </Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState title="No records" description="This table is empty or no results match your filter." />
      ) : (
        <div className="overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-mist">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-line"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="cursor-pointer whitespace-nowrap px-3 py-2 text-left font-medium text-ink hover:text-brand transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col}
                      {sortBy === col && (
                        <svg className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
                <th className="w-16 px-3 py-2 text-right font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`border-b border-line transition-colors ${
                    selectedRows.has(rowIdx) ? 'bg-brand/5' : 'hover:bg-mist/50'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIdx)}
                      onChange={() => toggleRowSelection(rowIdx)}
                      className="rounded border-line"
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="whitespace-nowrap px-3 py-2 text-slate">
                      {formatCellValue(row[col])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onEditRecord(row)}
                      className="rounded p-1 text-slate hover:bg-mist hover:text-ink transition-colors"
                      title="Edit record"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate">
            Page {page} of {totalPages} · {totalRows} total records
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCellValue(val) {
  if (val === null || val === undefined) return <span className="italic text-gray-400">NULL</span>;
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);
  if (str.length > 100) return str.slice(0, 100) + '…';
  return str;
}
