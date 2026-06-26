import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useApi, useApiCallback } from '../../shared/hooks/useApi.js';
import {
  fetchConnections,
  deleteConnection,
  reconnectConnection,
  toggleFavorite
} from '../../shared/api/connectionApi.js';
import { ConnectionForm } from './ConnectionForm.jsx';

export function ConnectionManager({ activeConnection, onSelectConnection }) {
  const toast = useToast();
  const { data: connections, loading, error, refetch } = useApi(fetchConnections);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteCb = useApiCallback(deleteConnection);
  const reconnectCb = useApiCallback(reconnectConnection);
  const favoriteCb = useApiCallback(toggleFavorite);

  async function handleDelete() {
    try {
      await deleteCb.execute(deleteTarget.id);
      toast('Connection deleted', 'success');
      setDeleteTarget(null);
      if (activeConnection?.id === deleteTarget.id) onSelectConnection(null);
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleReconnect(conn) {
    try {
      const result = await reconnectCb.execute(conn.id);
      toast('Reconnected successfully', 'success');
      if (activeConnection?.id === conn.id) {
        onSelectConnection(result?.data ?? result);
      }
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleFavorite(conn) {
    try {
      await favoriteCb.execute(conn.id);
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingConnection(null);
    refetch();
  }

  function openEdit(conn) {
    setEditingConnection(conn);
    setShowForm(true);
  }

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load connections: {error}
      </div>
    );
  }

  const sorted = connections ? [...connections].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  }) : [];

  const TYPE_COLORS = {
    sqlite: 'bg-emerald-100 text-emerald-700',
    postgresql: 'bg-blue-100 text-blue-700',
    mongodb: 'bg-amber-100 text-amber-700'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Connections</h2>
        <Button size="sm" onClick={() => { setEditingConnection(null); setShowForm(true); }}>
          + New Connection
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
          title="No connections yet"
          description="Create a connection to start exploring your databases."
        >
          <Button onClick={() => setShowForm(true)}>Create Connection</Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {sorted.map((conn) => {
            const isActive = activeConnection?.id === conn.id;
            return (
              <div
                key={conn.id}
                className={`group flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                  isActive
                    ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                    : 'border-line bg-white hover:border-brand/30 hover:shadow-sm'
                }`}
                onClick={() => onSelectConnection(conn)}
              >
                {/* Favorite star */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleFavorite(conn); }}
                  className={`shrink-0 transition-colors ${conn.favorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                  title={conn.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg className="h-5 w-5" fill={conn.favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>

                {/* Connection info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-ink">{conn.name}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[conn.type] || 'bg-gray-100 text-gray-600'}`}>
                      {conn.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReconnect(conn); }}
                    className="rounded p-1 text-slate hover:bg-mist hover:text-ink"
                    title="Reconnect"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(conn); }}
                    className="rounded p-1 text-slate hover:bg-mist hover:text-ink"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(conn); }}
                    className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connection Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingConnection(null); }}
        title={editingConnection ? 'Edit Connection' : 'New Connection'}
      >
        <ConnectionForm
          connection={editingConnection}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingConnection(null); }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Connection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will close the connection and remove it from your list.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteCb.loading}
      />
    </div>
  );
}
