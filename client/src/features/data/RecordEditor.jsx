import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { insertRow, updateRow, deleteRows } from '../../shared/api/dataApi.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';

/**
 * RecordEditor handles create, update, and delete operations on records.
 * It renders as a modal form.
 */
export function RecordEditor({ connectionId, tableName, record, mode, onClose, onSaved }) {
  const toast = useToast();
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);

  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (record && isEdit) {
      setFields({ ...record });
    } else {
      setFields({});
    }
  }, [record, isEdit]);

  function handleFieldChange(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function addField() {
    const key = prompt('Enter field name:');
    if (key && key.trim()) {
      setFields((prev) => ({ ...prev, [key.trim()]: '' }));
    }
  }

  function removeField(key) {
    setFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreate) {
        await insertRow(connectionId, tableName, fields);
        toast('Record created', 'success');
      } else if (isEdit && record) {
        // Use the first column as the primary key identifier
        const columns = Object.keys(record);
        const pk = record[columns[0]];
        // Only send changed fields
        const changes = {};
        for (const [key, val] of Object.entries(fields)) {
          if (record[key] !== val) changes[key] = val;
        }
        if (Object.keys(changes).length === 0) {
          toast('No changes to save', 'info');
          onClose();
          return;
        }
        await updateRow(connectionId, tableName, pk, changes);
        toast('Record updated', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 transition-colors';

  return (
    <Modal
      open={mode === 'create' || mode === 'edit'}
      onClose={onClose}
      title={isCreate ? 'Add New Record' : 'Edit Record'}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {Object.entries(fields).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-ink">{key}</label>
              {isCreate && (
                <button
                  type="button"
                  onClick={() => removeField(key)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              value={value === null || value === undefined ? '' : String(value)}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className={inputCls}
              placeholder={`Enter ${key}…`}
            />
          </div>
        ))}

        {isCreate && (
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 text-sm text-brand hover:text-brand/80 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Field
          </button>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isCreate ? 'Create' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * DeleteRecordsDialog confirms and executes bulk record deletion.
 */
export function DeleteRecordsDialog({ open, connectionId, tableName, records, onClose, onDeleted }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      // Extract primary keys from the first column
      const columns = records.length > 0 ? Object.keys(records[0]) : [];
      const pkColumn = columns[0];
      const primaryKeys = records.map((r) => r[pkColumn]);
      await deleteRows(connectionId, tableName, primaryKeys);
      toast(`${records.length} record(s) deleted`, 'success');
      onDeleted();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Delete Records"
      message={`Are you sure you want to delete ${records?.length || 0} record(s)? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={handleDelete}
      onCancel={onClose}
      loading={deleting}
    />
  );
}
