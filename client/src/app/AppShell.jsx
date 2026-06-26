import { useState, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { TopBar } from '../components/layout/TopBar.jsx';
import { ConnectionManager } from '../features/connections/ConnectionManager.jsx';
import { DatabaseExplorer } from '../features/explorer/DatabaseExplorer.jsx';
import { DataViewer } from '../features/data/DataViewer.jsx';
import { RecordEditor, DeleteRecordsDialog } from '../features/data/RecordEditor.jsx';
import { QueryPlayground } from '../features/query/QueryPlayground.jsx';
import { SchemaViewer } from '../features/schema/SchemaViewer.jsx';
import { ImportExportPanel } from '../features/importExport/ImportExportPanel.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function AppShell() {
  const [activeView, setActiveView] = useState('connections');
  const [activeConnection, setActiveConnection] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Record editor state
  const [editorMode, setEditorMode] = useState(null); // 'create' | 'edit' | null
  const [editingRecord, setEditingRecord] = useState(null);

  // Delete records state
  const [deleteRecords, setDeleteRecords] = useState(null);

  // Data viewer refetch key (increments to force re-mount)
  const [dataRefetchKey, setDataRefetchKey] = useState(0);

  const handleSelectConnection = useCallback((conn) => {
    setActiveConnection(conn);
    setActiveTable(null);
    if (conn) {
      setActiveView('explorer');
    }
  }, []);

  const handleSelectTable = useCallback((table) => {
    setActiveTable(table);
    setActiveView('data');
  }, []);

  const handleViewChange = useCallback((view) => {
    setActiveView(view);
  }, []);

  function renderContent() {
    switch (activeView) {
      case 'connections':
        return (
          <ConnectionManager
            activeConnection={activeConnection}
            onSelectConnection={handleSelectConnection}
          />
        );

      case 'explorer':
        if (!activeConnection) {
          return (
            <EmptyState
              title="No connection selected"
              description="Select a connection from the Connection Manager to explore its database."
            />
          );
        }
        return (
          <DatabaseExplorer
            connectionId={activeConnection.id}
            connectionType={activeConnection.type}
            onSelectTable={handleSelectTable}
          />
        );

      case 'data':
        if (!activeConnection || !activeTable) {
          return (
            <EmptyState
              title="No table selected"
              description="Select a table from the Database Explorer to view its data."
            />
          );
        }
        return (
          <DataViewer
            key={dataRefetchKey}
            connectionId={activeConnection.id}
            tableName={activeTable}
            onAddRecord={() => setEditorMode('create')}
            onEditRecord={(record) => {
              setEditingRecord(record);
              setEditorMode('edit');
            }}
            onDeleteRecords={(records) => setDeleteRecords(records)}
          />
        );

      case 'schema':
        if (!activeConnection || !activeTable) {
          return (
            <EmptyState
              title="No table selected"
              description="Select a table from the Database Explorer to view its schema."
            />
          );
        }
        return (
          <SchemaViewer
            connectionId={activeConnection.id}
            tableName={activeTable}
            connectionType={activeConnection.type}
          />
        );

      case 'query':
        if (!activeConnection) {
          return (
            <EmptyState
              title="No connection selected"
              description="Select a connection to use the Query Playground."
            />
          );
        }
        return (
          <QueryPlayground
            connectionId={activeConnection.id}
            connectionType={activeConnection.type}
          />
        );

      case 'importExport':
        if (!activeConnection || !activeTable) {
          return (
            <EmptyState
              title="No table selected"
              description="Select a table from the Database Explorer to import or export data."
            />
          );
        }
        return (
          <ImportExportPanel
            connectionId={activeConnection.id}
            tableName={activeTable}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <TopBar
        activeConnection={activeConnection}
        onToggleSidebar={() => setMobileOpen((prev) => !prev)}
      />
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          activeConnection={activeConnection}
          activeTable={activeTable}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <section className="rounded-lg border border-line bg-white p-6 shadow-panel">
            {renderContent()}
          </section>
        </main>
      </div>

      {/* Record Editor Modal (shared across Data Viewer) */}
      {editorMode && activeConnection && activeTable && (
        <RecordEditor
          connectionId={activeConnection.id}
          tableName={activeTable}
          record={editingRecord}
          mode={editorMode}
          onClose={() => {
            setEditorMode(null);
            setEditingRecord(null);
          }}
          onSaved={() => setDataRefetchKey((k) => k + 1)}
        />
      )}

      {/* Delete Records Confirmation */}
      {deleteRecords && activeConnection && activeTable && (
        <DeleteRecordsDialog
          open={!!deleteRecords}
          connectionId={activeConnection.id}
          tableName={activeTable}
          records={deleteRecords}
          onClose={() => setDeleteRecords(null)}
          onDeleted={() => setDataRefetchKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
