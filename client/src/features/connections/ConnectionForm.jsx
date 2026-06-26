import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { PROVIDER_TYPES } from '../../shared/constants/providerTypes.js';
import { createConnection, updateConnection, testConnection } from '../../shared/api/connectionApi.js';

const PROVIDER_OPTIONS = [
  { value: PROVIDER_TYPES.SQLITE, label: 'SQLite' },
  { value: PROVIDER_TYPES.POSTGRESQL, label: 'PostgreSQL' },
  { value: PROVIDER_TYPES.MONGODB, label: 'MongoDB' }
];

const INITIAL_FORM = {
  name: '',
  type: PROVIDER_TYPES.SQLITE,
  // SQLite
  filePath: '',
  file: null,
  // PostgreSQL
  connectionString: '',
  host: '',
  port: '5432',
  database: '',
  user: '',
  password: '',
  // MongoDB
  uri: '',
  mongoDatabase: ''
};

export function ConnectionForm({ connection, onSuccess, onCancel }) {
  const toast = useToast();
  const isEditing = !!connection;

  const [form, setForm] = useState(() => {
    if (connection) {
      return {
        ...INITIAL_FORM,
        name: connection.name || '',
        type: connection.type || PROVIDER_TYPES.SQLITE,
        host: connection.config?.host || '',
        port: String(connection.config?.port || '5432'),
        database: connection.config?.database || '',
        user: connection.config?.user || '',
        mongoDatabase: connection.config?.database || ''
      };
    }
    return { ...INITIAL_FORM };
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [useConnString, setUseConnString] = useState(false);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === 'file' && files?.[0]) {
      setForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setTestResult(null);
  }

  function buildPayload() {
    const payload = { name: form.name, type: form.type };

    switch (form.type) {
      case PROVIDER_TYPES.SQLITE:
        if (form.file) {
          const fd = new FormData();
          fd.append('name', form.name);
          fd.append('type', form.type);
          fd.append('file', form.file);
          return fd;
        }
        payload.filePath = form.filePath;
        break;

      case PROVIDER_TYPES.POSTGRESQL:
        if (useConnString && form.connectionString) {
          payload.connectionString = form.connectionString;
        } else {
          payload.host = form.host;
          payload.port = Number(form.port);
          payload.database = form.database;
          payload.user = form.user;
          payload.password = form.password;
        }
        break;

      case PROVIDER_TYPES.MONGODB:
        payload.uri = form.uri;
        payload.database = form.mongoDatabase;
        break;
    }

    return payload;
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = buildPayload();
      // FormData can't be used for test; extract fields
      const testPayload = payload instanceof FormData
        ? { type: form.type, name: form.name, filePath: 'upload-pending' }
        : payload;
      await testConnection(testPayload);
      setTestResult({ success: true, message: 'Connection successful!' });
      toast('Connection test passed', 'success');
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast('Connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEditing) {
        // Can't send FormData for update; send JSON
        const jsonPayload = payload instanceof FormData ? { name: form.name } : payload;
        await updateConnection(connection.id, jsonPayload);
        toast('Connection updated', 'success');
      } else {
        await createConnection(payload);
        toast('Connection created', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Connection Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="My Database"
          required
          className={inputCls}
        />
      </div>

      {/* Provider Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Database Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          disabled={isEditing}
          className={inputCls}
        >
          {PROVIDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* SQLite Fields */}
      {form.type === PROVIDER_TYPES.SQLITE && (
        <div className="space-y-3 rounded-lg border border-line bg-mist/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">SQLite Configuration</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Upload Database File</label>
            <input
              type="file"
              name="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleChange}
              className="block w-full text-sm text-slate file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand/90"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Local File Path</label>
            <input
              name="filePath"
              value={form.filePath}
              onChange={handleChange}
              placeholder="/path/to/database.db"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* PostgreSQL Fields */}
      {form.type === PROVIDER_TYPES.POSTGRESQL && (
        <div className="space-y-3 rounded-lg border border-line bg-mist/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">PostgreSQL Configuration</p>
            <label className="flex items-center gap-2 text-xs text-slate">
              <input
                type="checkbox"
                checked={useConnString}
                onChange={(e) => setUseConnString(e.target.checked)}
                className="rounded border-line"
              />
              Use connection string
            </label>
          </div>

          {useConnString ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Connection String</label>
              <input
                name="connectionString"
                value={form.connectionString}
                onChange={handleChange}
                placeholder="postgresql://user:password@localhost:5432/mydb"
                className={inputCls}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-sm font-medium text-ink">Host</label>
                <input name="host" value={form.host} onChange={handleChange} placeholder="localhost" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Port</label>
                <input name="port" value={form.port} onChange={handleChange} placeholder="5432" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink">Database</label>
                <input name="database" value={form.database} onChange={handleChange} placeholder="mydb" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Username</label>
                <input name="user" value={form.user} onChange={handleChange} placeholder="postgres" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••" className={inputCls} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* MongoDB Fields */}
      {form.type === PROVIDER_TYPES.MONGODB && (
        <div className="space-y-3 rounded-lg border border-line bg-mist/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">MongoDB Configuration</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Connection URI</label>
            <input
              name="uri"
              value={form.uri}
              onChange={handleChange}
              placeholder="mongodb://localhost:27017 or mongodb+srv://..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Database Name</label>
            <input
              name="mongoDatabase"
              value={form.mongoDatabase}
              onChange={handleChange}
              placeholder="myDatabase"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`rounded-lg p-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button type="button" variant="ghost" onClick={handleTest} loading={testing} size="sm">
          Test Connection
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
