import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useApi } from '../../shared/hooks/useApi.js';
import { fetchTableSchema } from '../../shared/api/schemaApi.js';

export function SchemaViewer({ connectionId, tableName, connectionType }) {
  const { data: schema, loading, error, refetch } = useApi(
    () => fetchTableSchema(connectionId, tableName),
    [connectionId, tableName]
  );

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load schema: {error}
        <button onClick={refetch} className="ml-2 underline">Retry</button>
      </div>
    );
  }
  if (!schema) return null;

  const isMongo = connectionType === 'mongodb';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">
        Schema: <span className="text-brand">{tableName}</span>
      </h2>

      {/* SQL: CREATE TABLE statement */}
      {schema.createStatement && (
        <div className="rounded-lg border border-line bg-ink p-4">
          <pre className="overflow-auto font-mono text-sm text-green-400 whitespace-pre-wrap">
            {schema.createStatement}
          </pre>
        </div>
      )}

      {/* Column details */}
      {schema.columns && schema.columns.length > 0 && (
        <div className="overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-mist">
                <th className="px-3 py-2 text-left font-medium text-ink">Column</th>
                <th className="px-3 py-2 text-left font-medium text-ink">Type</th>
                <th className="px-3 py-2 text-left font-medium text-ink">Nullable</th>
                <th className="px-3 py-2 text-left font-medium text-ink">Default</th>
                <th className="px-3 py-2 text-left font-medium text-ink">Primary Key</th>
              </tr>
            </thead>
            <tbody>
              {schema.columns.map((col, i) => (
                <tr key={i} className="border-b border-line hover:bg-mist/50 transition-colors">
                  <td className="px-3 py-2 font-medium text-ink">{col.name || col.column_name}</td>
                  <td className="px-3 py-2 text-slate">
                    <span className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">
                      {col.type || col.data_type || 'unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate">
                    {col.nullable || col.notnull === 0 || col.is_nullable === 'YES'
                      ? <span className="text-green-600">Yes</span>
                      : <span className="text-red-500">No</span>}
                  </td>
                  <td className="px-3 py-2 text-slate font-mono text-xs">
                    {col.defaultValue ?? col.dflt_value ?? col.column_default ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    {(col.pk || col.primaryKey) ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">PK</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MongoDB: metadata & indexes */}
      {isMongo && schema.indexes && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Indexes</h3>
          <div className="overflow-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist">
                  <th className="px-3 py-2 text-left font-medium text-ink">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-ink">Keys</th>
                  <th className="px-3 py-2 text-left font-medium text-ink">Unique</th>
                </tr>
              </thead>
              <tbody>
                {schema.indexes.map((idx, i) => (
                  <tr key={i} className="border-b border-line hover:bg-mist/50 transition-colors">
                    <td className="px-3 py-2 font-medium text-ink">{idx.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate">
                      {JSON.stringify(idx.key || idx.keys)}
                    </td>
                    <td className="px-3 py-2 text-slate">
                      {idx.unique ? <span className="text-green-600">Yes</span> : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw schema fallback for unknown structures */}
      {!schema.columns && !schema.createStatement && (
        <div className="rounded-lg border border-line bg-mist p-4">
          <pre className="overflow-auto font-mono text-xs text-ink whitespace-pre-wrap">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
